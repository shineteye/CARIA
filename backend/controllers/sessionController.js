const { randomUUID } = require("crypto");
const Session = require("../models/Session");
const Message = require("../models/Message");
const User = require("../models/User");
const {
  emptyProfile,
  firstQuestionMessage,
  getOnboardingPayload,
  deriveCareerGoal,
} = require("../services/onboardingService");

function publicProfile(profile) {
  if (!profile) return emptyProfile();
  const obj = profile.toObject ? profile.toObject() : { ...profile };
  if (obj.freeNotes instanceof Map) {
    obj.freeNotes = Object.fromEntries(obj.freeNotes);
  }
  return obj;
}

function sessionPayload(session, messages) {
  const phase = session.phase || "chat";
  const total = getOnboardingPayload(0).total;
  const onboarding =
    phase === "onboarding"
      ? getOnboardingPayload(session.onboardingStep || 0)
      : {
          step: total,
          total,
          progress: 100,
          completed: true,
          question: null,
        };

  return {
    sessionId: session.sessionId,
    phase,
    onboarding,
    profile: publicProfile(session.profile),
    careerGoal:
      session.careerGoal ||
      (session.profile
        ? deriveCareerGoal(publicProfile(session.profile))
        : null),
    guideReady: !!session.guideGenerated,
    messages,
  };
}

/**
 * Create a new advising session for the logged-in student.
 * If they already completed a profile, resume in chat phase with that profile.
 * Body: { forceNew?: boolean } — start fresh onboarding even if profile exists.
 */
exports.createSession = async (req, res, next) => {
  try {
    const user = req.user; // undefined for guests
    const forceNew = !!req.body?.forceNew;

    // ── Guest: anonymous session, claimed later at sign-up ──
    if (!user) {
      const guestId = randomUUID();
      const welcome = firstQuestionMessage();
      const guestSession = await Session.create({
        sessionId: guestId,
        userId: null,
        phase: "onboarding",
        onboardingStep: 0,
        profile: emptyProfile(),
      });
      const agentMessage = await Message.create({
        sessionId: guestId,
        role: "agent",
        content: welcome,
      });
      guestSession.messages.push(agentMessage._id);
      await guestSession.save();

      return res.status(201).json(
        sessionPayload(guestSession, [
          {
            role: "agent",
            content: welcome,
            timestamp: agentMessage.timestamp,
          },
        ]),
      );
    }

    // Resume existing active session unless forceNew
    if (!forceNew && user.activeSessionId) {
      const existing = await Session.findOne({
        sessionId: user.activeSessionId,
        userId: user._id,
      });
      if (existing) {
        const messages = await Message.find({ sessionId: existing.sessionId })
          .sort({ timestamp: 1 })
          .select("role content timestamp -_id");
        return res.status(200).json(sessionPayload(existing, messages));
      }
    }

    const hasProfile =
      !forceNew &&
      user.guideGenerated &&
      (user.profile?.educationLevel || user.profile?.careerDirection);

    const sessionId = randomUUID();
    const profile = hasProfile
      ? publicProfile(user.profile)
      : emptyProfile();

    const session = await Session.create({
      sessionId,
      userId: user._id,
      phase: hasProfile ? "chat" : "onboarding",
      onboardingStep: hasProfile ? getOnboardingPayload(0).total : 0,
      profile,
      region: user.region || profile.region || null,
      careerGoal: user.careerGoal || null,
      guideGenerated: !!hasProfile,
    });

    let messages = [];
    if (hasProfile) {
      const welcomeBack = await Message.create({
        sessionId,
        role: "agent",
        content: `Welcome back, **${user.name.split(" ")[0]}**. Your profile is loaded — ask me anything about your path, or edit your answers anytime from the sidebar.`,
      });
      session.messages.push(welcomeBack._id);
      messages = [
        {
          role: "agent",
          content: welcomeBack.content,
          timestamp: welcomeBack.timestamp,
        },
      ];
    } else {
      const welcome = firstQuestionMessage();
      const agentMessage = await Message.create({
        sessionId,
        role: "agent",
        content: welcome,
      });
      session.messages.push(agentMessage._id);
      messages = [
        {
          role: "agent",
          content: welcome,
          timestamp: agentMessage.timestamp,
        },
      ];
    }

    await session.save();

    user.activeSessionId = sessionId;
    await user.save();

    res.status(201).json(sessionPayload(session, messages));
  } catch (error) {
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const user = req.user; // undefined for guests

    // A guest may only read an unclaimed session; a signed-in user only their own.
    // The sessionId is an unguessable UUID, which is what protects guest sessions.
    const session = await Session.findOne(
      user ? { sessionId, userId: user._id } : { sessionId, userId: null },
    );
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const messages = await Message.find({ sessionId })
      .sort({ timestamp: 1 })
      .select("role content timestamp -_id");

    res.json(sessionPayload(session, messages));
  } catch (error) {
    next(error);
  }
};
