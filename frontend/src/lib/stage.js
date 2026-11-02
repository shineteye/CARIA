/**
 * Mirrors stageOf() in backend/data/onboardingQuestions.js — the profile stores
 * the label the student tapped, so stage is read from that text.
 */
export function stageOf(educationLevel) {
  const stage = String(educationLevel || '').toLowerCase();
  if (stage.includes('finished') || stage.includes('post')) return 'post_wassce';
  // JHS must be tested before "form 3": "JHS Form 3 / BECE soon" contains it too.
  if (stage.includes('jhs') || stage.includes('bece')) return 'jhs';
  if (stage.includes('form 3') || stage.includes('wassce')) return 'shs_final';
  if (stage.includes('shs')) return 'shs';
  if (stage.includes('exploring')) return 'exploring';
  return null;
}

/**
 * Each stage gets its own milestone list. `current` is the index of the one in
 * progress; everything before it is done and is shown as such, so a student who
 * has finished WASSCE never sees BECE as something still ahead of them.
 */
const STAGES = {
  jhs: {
    label: 'JHS',
    current: 0,
    milestones: [
      { title: 'BECE', detail: 'Strengthen the subjects your direction needs' },
      { title: 'SHS selection', detail: 'Choose schools on CSSPS across categories' },
      { title: 'SHS stream', detail: 'Enter the stream your direction requires' },
      { title: 'WASSCE', detail: 'Electives and grades that open programmes' },
      { title: 'University or college', detail: 'Programme admission' },
    ],
    topics: [
      { q: 'Which SHS stream fits me?', d: 'Match a stream to your strengths and direction' },
      { q: 'How should I choose my SHS on CSSPS?', d: 'Categories, realistic choices and order' },
      { q: 'Which subjects should I focus on before BECE?', d: 'Where extra effort pays off most' },
      { q: 'How do I talk to my parents about this?', d: 'When family expects something else' },
    ],
  },
  exploring: {
    label: 'Exploring',
    current: 0,
    milestones: [
      { title: 'Find a direction', detail: 'Narrow down the fields that suit you' },
      { title: 'Build subjects', detail: 'Strengthen what that direction needs' },
      { title: 'SHS stream', detail: 'The stream it points to' },
      { title: 'University or college', detail: 'Programme admission' },
    ],
    topics: [
      { q: 'Which careers suit my strengths?', d: 'Start from what you are good at' },
      { q: 'Which SHS stream would keep my options open?', d: 'Avoid closing doors early' },
      { q: 'What do the top careers in Ghana require?', d: 'Subjects and routes, in brief' },
      { q: 'How do I talk to my parents about this?', d: 'When family expects something else' },
    ],
  },
  shs: {
    label: 'SHS Form 1–2',
    current: 1,
    milestones: [
      { title: 'BECE & placement', detail: 'Done' },
      { title: 'Electives & grades', detail: 'Build the subjects your programme needs' },
      { title: 'WASSCE', detail: 'Sit the exam aiming at your target programmes' },
      { title: 'Programme choice', detail: 'Choose against published cut-offs' },
      { title: 'Admission', detail: 'University, college or technical route' },
    ],
    topics: [
      { q: 'Does my stream lead where I want to go?', d: 'Check electives against programme requirements' },
      { q: 'Which grades should I build now?', d: 'The subjects that decide your options' },
      { q: 'Which university programmes fit my direction?', d: 'With the cut-offs we hold' },
      { q: 'How do I talk to my parents about this?', d: 'When family expects something else' },
    ],
  },
  shs_final: {
    label: 'Final SHS year',
    current: 1,
    milestones: [
      { title: 'BECE & placement', detail: 'Done' },
      { title: 'WASSCE', detail: 'Revision priorities for your target programmes' },
      { title: 'Programme shortlist', detail: 'One ambitious choice, one safe choice' },
      { title: 'Applications', detail: 'University and college applications' },
      { title: 'Admission', detail: 'Or a backup route' },
    ],
    topics: [
      { q: 'Which subjects should I prioritise for WASSCE?', d: 'Where revision time matters most' },
      { q: 'Which programmes should I apply to?', d: 'Ambitious and safe choices' },
      { q: 'What are my options if I miss the cut-off?', d: 'Backup routes that still lead somewhere' },
      { q: 'How do I talk to my parents about this?', d: 'When family expects something else' },
    ],
  },
  post_wassce: {
    label: 'Finished WASSCE',
    current: 1,
    milestones: [
      { title: 'WASSCE', detail: 'Completed' },
      { title: 'Results & aggregate', detail: 'Your best six subjects decide your options' },
      { title: 'Programme shortlist', detail: 'Compare against published cut-offs' },
      { title: 'Applications', detail: 'One ambitious choice, one safe choice' },
      { title: 'Admission or alternative', detail: 'University, college, technical or TVET' },
    ],
    topics: [
      { q: 'Which programmes can my aggregate reach?', d: 'Compared with published cut-offs' },
      { q: 'What if my results fall short?', d: 'Resits and alternative routes' },
      { q: 'What are my non-university options?', d: 'Training colleges, technical universities, TVET' },
      { q: 'How do I talk to my parents about this?', d: 'When family expects something else' },
    ],
  },
};

const UNKNOWN = {
  label: 'Stage not set',
  current: 0,
  milestones: [
    { title: 'Set your stage', detail: 'Edit your answers to tell us where you are' },
  ],
  topics: STAGES.exploring.topics,
};

export function stageInfo(educationLevel) {
  const key = stageOf(educationLevel);
  return { key, ...(STAGES[key] || UNKNOWN) };
}

/**
 * Plain-language fit, so the overall score is never read as a probability.
 * Thresholds follow the real spread: a strong profile's top matches score in
 * the 60s and the catalogue median sits near 40.
 */
export function fitLabel(score) {
  if (typeof score !== 'number') return null;
  if (score >= 60) return 'Strong fit';
  if (score >= 45) return 'Good fit';
  if (score >= 35) return 'Possible fit';
  return 'Weak fit';
}
