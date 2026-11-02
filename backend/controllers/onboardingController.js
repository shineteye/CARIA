const Session = require("../models/Session");
const User = require("../models/User");
const {
  emptyProfile,
  applyAnswer,
  deriveCareerGoal,
  deriveRoadmapFromProfile,
  getOnboardingPayload,
  getQuestion,
  getTotalQuestions,
} = require("../services/onboardingService");
const { getRecommendations } = require("../services/matchingService");

/**
 * Full-screen onboarding runs outside the conversation.
 *
 * The chat controller answers questions by writing a Message row per turn, which
 * is right for a transcript but wrong for a wizard: twelve raw answers ("Ashanti",
 * "Mathematics, Science") would land in the student's history as if they'd said
 * them out loud, and the guide the agent writes afterwards would be replying to a
 * conversation that never happened. These endpoints move the same state machine
 * forward while leaving the transcript empty, so the first message a student ever
 * sees is their personal guide.
 */

function publicProfile(profile) {
  if (!profile) return emptyProfile();
  const obj = profile.toObject ? profile.toObject() : { ...profile };
  if (obj.freeNotes instanceof Map) {
    obj.freeNotes = Object.fromEntries(obj.freeNotes);
  }
  return obj;
}

/** Signed-in users reach only their own sessions; guests only unclaimed ones. */
function sessionQuery(req, sessionId) {
  return req.user
    ? { sessionId, userId: req.user._id }
    : { sessionId, userId: null };
}

async function syncProfileToUser(session) {
  if (!session.userId) return;
  try {
    const user = await User.findById(session.userId);
    if (!user) return;
    user.profile = publicProfile(session.profile);
    user.markModified("profile");
    user.region = session.region || user.region;
    user.careerGoal = session.careerGoal || user.careerGoal;
    user.activeSessionId = session.sessionId;
    await user.save();
  } catch (err) {
    console.error("Failed to sync profile to user:", err.message);
  }
}

/**
 * Every answer the profile holds, keyed by question id.
 *
 * Deliberately not limited to the current step: after a rewind to question 3 the
 * student's answer to 3 is still on the profile, and the screen should come back
 * with their choice already selected rather than blank. Questions they never
 * reached simply have no value to return.
 */
function answersFromProfile(profile) {
  const answers = {};
  const total = getTotalQuestions();

  for (let i = 0; i < total; i += 1) {
    const question = getQuestion(i);
    if (!question) continue;
    const value = profile[question.profileKey];
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    answers[question.id] = Array.isArray(value) ? value.join(", ") : value;
  }
  return answers;
}

function statePayload(session) {
  const profile = publicProfile(session.profile);
  const step = session.onboardingStep || 0;
  return {
    sessionId: session.sessionId,
    phase: session.phase,
    onboarding: getOnboardingPayload(step, profile),
    answers: answersFromProfile(profile),
    profile,
    careerGoal: session.careerGoal,
  };
}

/**
 * GET /api/onboarding/:sessionId
 * Current question, progress, and prior answers — everything needed to resume a
 * half-finished wizard on a reload or a second device.
 */
exports.getState = async (req, res, next) => {
  try {
    const session = await Session.findOne(
      sessionQuery(req, req.params.sessionId),
    );
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(statePayload(session));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/onboarding/answer  { sessionId, answer }
 * Records the answer to the CURRENT question and advances one step. Completing
 * the last question flips the session to awaiting_signup (guests) or chat, but
 * never generates the guide here — that stays in the chat controller so there is
 * one place where a student's first real message is written.
 */
exports.submitAnswer = async (req, res, next) => {
  try {
    const { sessionId, answer } = req.body;
    if (!sessionId || !String(answer || "").trim()) {
      return res.status(400).json({ error: "sessionId and answer are required" });
    }

    const session = await Session.findOne(sessionQuery(req, sessionId));
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (session.phase !== "onboarding") {
      return res.status(409).json({
        error: "Onboarding is already complete for this session.",
        phase: session.phase,
      });
    }

    const step = session.onboardingStep || 0;
    const total = getTotalQuestions();
    const question = getQuestion(step);
    if (!question) {
      return res.status(409).json({ error: "No question at this step." });
    }

    const updated = applyAnswer(
      publicProfile(session.profile),
      question,
      String(answer).trim(),
    );
    session.profile = updated;
    session.markModified("profile");

    if (question.profileKey === "region") session.region = updated.region;
    if (question.profileKey === "careerDirection") {
      session.careerGoal = deriveCareerGoal(updated);
    }

    const nextStep = step + 1;
    session.onboardingStep = nextStep;

    if (nextStep >= total) {
      session.careerGoal = deriveCareerGoal(updated);
      session.region = updated.region || session.region;
      // A signed-in student goes straight to chat, where /unlock-guide writes the
      // guide. A guest waits at the signup screen with their answers already safe.
      session.phase = session.userId ? "chat" : "awaiting_signup";
      await session.save();
      await syncProfileToUser(session);

      const [topMatch] = getRecommendations(updated, 1);
      return res.json({
        ...statePayload(session),
        completed: true,
        roadmapUpdate: deriveRoadmapFromProfile(updated),
        signupPreview: {
          answersGiven: total,
          careerGoal: session.careerGoal,
          topMatch: topMatch
            ? { title: topMatch.title, score: topMatch.overallScore }
            : null,
        },
      });
    }

    await session.save();
    await syncProfileToUser(session);
    res.json({ ...statePayload(session), completed: false });
  } catch (error) {
    console.error("Onboarding answer error:", error);
    next(error);
  }
};

/**
 * POST /api/onboarding/step  { sessionId, step }
 * Rewind to an earlier question so Back works. Answers already recorded stay on
 * the profile and are returned with the payload — re-answering simply overwrites
 * that key, so there is nothing to clean up. Rewinding forward is refused: the
 * only way to advance is to answer, which is what keeps the profile in step with
 * the counter.
 */
exports.setStep = async (req, res, next) => {
  try {
    const { sessionId, step } = req.body;
    if (!sessionId || !Number.isInteger(step)) {
      return res
        .status(400)
        .json({ error: "sessionId and an integer step are required" });
    }

    const session = await Session.findOne(sessionQuery(req, sessionId));
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (session.phase !== "onboarding") {
      return res.status(409).json({
        error: "Onboarding is already complete for this session.",
        phase: session.phase,
      });
    }

    const current = session.onboardingStep || 0;
    if (step < 0 || step >= getTotalQuestions()) {
      return res.status(400).json({ error: "Step is out of range." });
    }
    if (step > current) {
      return res
        .status(400)
        .json({ error: "Cannot skip ahead — answer the current question." });
    }

    session.onboardingStep = step;
    await session.save();
    res.json(statePayload(session));
  } catch (error) {
    console.error("Onboarding step error:", error);
    next(error);
  }
};
