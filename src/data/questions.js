/**
 * Central questionnaire configuration.
 * The entire quiz UI, scoring engine, comparison table, and compromise simulator
 * are driven from this schema. Adding a question here requires zero UI changes.
 */

export const CATEGORIES = [
  {
    id: 'sleep',
    label: 'Sleep & Night Routine',
    shortLabel: 'Sleep',
    description: 'Bedtimes, alarms, and whether a vibrating phone ends your night.',
    icon: 'Moon',
  },
  {
    id: 'study',
    label: 'Study & Classes',
    shortLabel: 'Study',
    description: 'When your brain turns on, exam crunch habits, and noise tolerance.',
    icon: 'BookOpen',
  },
  {
    id: 'cleanliness',
    label: 'Cleanliness & Chores',
    shortLabel: 'Cleanliness',
    description: 'Maggi bowl urgency, laundry mountains, and shared-space standards.',
    icon: 'Sparkles',
  },
  {
    id: 'social',
    label: 'Social & Room Vibe',
    shortLabel: 'Social',
    description: 'Overnight crashers, weekend battery, smoking, and AC wars.',
    icon: 'Users',
  },
];

export const DEFAULT_IMPORTANCE = {
  sleep: 4,
  cleanliness: 4,
  study: 3,
  social: 2,
};

export const DEAL_BREAKER_OPTIONS = [
  {
    id: 'smoking',
    label: 'Smoking or vaping',
    description: 'Hard clash if one person smokes/vapes and the other wants none.',
  },
  {
    id: 'guests',
    label: 'Overnight guests',
    description: 'Hard clash if one wants zero overnight guests and the other hosts often.',
  },
  {
    id: 'temperature',
    label: 'Room AC / fan temperature',
    description: 'Hard clash if one needs an 18–22°C icebox and the other wants 26°C+.',
  },
];

export const QUESTIONS = [
  // ================= SLEEP =================
  {
    id: 'bedtime',
    category: 'sleep',
    shortLabel: 'Weekday bedtime',
    prompt: "On a normal weekday you're in bed by...",
    type: 'ordinal',
    options: [
      { value: 0, label: 'Before 10 PM', hint: 'Lights out before the hostel corridor wakes up' },
      { value: 1, label: '10 PM – 12 AM', hint: 'Classic reasonable human hours' },
      { value: 2, label: '12 AM – 2 AM', hint: 'Peak reel-scrolling and late chai zone' },
      { value: 3, label: 'After 2 AM', hint: 'Sleep is basically a daytime hobby' },
    ],
    scoring: {
      mode: 'directional',
      worseWhen: 'other-higher',
      sensitivityGroup: 'sleep',
    },
    weight: 1,
    compromisable: true,
    compromiseText: 'Shift my bedtime toward {label}',
  },
  {
    id: 'wakeTime',
    category: 'sleep',
    shortLabel: 'Morning alarm',
    prompt: 'Your alarm actually gets you up at...',
    type: 'ordinal',
    options: [
      { value: 0, label: 'Before 6 AM', hint: 'Up before the milk crate arrives' },
      { value: 1, label: '6 AM – 8 AM', hint: 'Makes the 8:30 lecture with breakfast' },
      { value: 2, label: '8 AM – 10 AM', hint: 'Ten-minute sprint to class' },
      { value: 3, label: 'After 10 AM', hint: 'Morning classes are a rumor' },
    ],
    scoring: {
      mode: 'directional',
      worseWhen: 'other-lower',
      sensitivityGroup: 'sleep',
    },
    weight: 1,
    compromisable: true,
    compromiseText: 'Move my wake-up alarm toward {label}',
  },
  {
    id: 'lightSleeper',
    category: 'sleep',
    shortLabel: 'Sleep sensitivity',
    prompt: "Your roommate's phone buzzes at 2 AM. You...",
    type: 'scale',
    options: [
      { value: 5, label: "Wake instantly and can't sleep again", hint: 'Every creak is a jump-scare' },
      { value: 4, label: 'Wake up but drift back', hint: 'Noticeable, slightly annoying' },
      { value: 2, label: 'Barely notice', hint: 'Half a blink and back out' },
      { value: 1, label: "An earthquake wouldn't wake me", hint: 'Certified heavy sleeper' },
    ],
    scoring: {
      mode: 'modifier',
      sensitivityGroup: 'sleep',
    },
    weight: 0,
    compromisable: false,
  },
  {
    id: 'screensAtNight',
    category: 'sleep',
    shortLabel: '2 AM screen habits',
    prompt: "It's 2 AM and you can't sleep. You...",
    type: 'ordinal',
    options: [
      { value: 0, label: 'Lie in the dark till sleep comes', hint: 'Zero glow, zero sound' },
      { value: 1, label: 'Scroll on low brightness', hint: 'Earbuds in, dim screen' },
      { value: 2, label: 'Reels, YouTube, lights on if needed', hint: 'Full bright-screen energy' },
    ],
    scoring: {
      mode: 'directional',
      worseWhen: 'other-higher',
      sensitivityGroup: 'sleep',
    },
    weight: 1,
    compromisable: true,
    compromiseText: 'At night, switch to "{label}"',
  },

  // ================= STUDY =================
  {
    id: 'studyTime',
    category: 'study',
    shortLabel: 'Peak study time',
    prompt: 'Mid-sems are in 3 days. When does your brain actually work?',
    type: 'circular',
    options: [
      { value: 0, label: 'Early morning revision', hint: 'Fresh coffee at sunrise' },
      { value: 1, label: 'Afternoon', hint: 'Post-lunch grind' },
      { value: 2, label: 'Evening', hint: 'Sunset to dinner focus' },
      { value: 3, label: 'After midnight when the hostel goes quiet', hint: 'Peak 1 AM clarity' },
    ],
    scoring: {
      mode: 'symmetric',
    },
    weight: 1,
    compromisable: true,
    compromiseText: 'Shift main study hours toward {label}',
  },
  {
    id: 'studyHours',
    category: 'study',
    shortLabel: 'Daily study hours',
    prompt: 'On a normal non-exam day, you actually study...',
    type: 'ordinal',
    options: [
      { value: 0, label: '0–2 hours', hint: 'Attends class, trusts vibes' },
      { value: 1, label: '2–4 hours', hint: 'Consistent daily catch-up' },
      { value: 2, label: '4–6 hours', hint: 'Locked-in academic weapon' },
      { value: 3, label: '6+ hours', hint: 'Basically lives in textbooks' },
    ],
    scoring: {
      mode: 'symmetric',
    },
    weight: 1,
    compromisable: false,
  },
  {
    id: 'studyNoise',
    category: 'study',
    shortLabel: 'Study noise level',
    prompt: 'Exam tomorrow. Your roommate wants to play a lo-fi playlist on speaker. You say...',
    type: 'ordinal',
    options: [
      { value: 0, label: 'Absolutely not, silence only', hint: 'Pin-drop focus required' },
      { value: 1, label: 'Low volume is fine', hint: 'Soft background hum is okay' },
      { value: 2, label: 'Sure, I study with music or calls too', hint: 'Noise never bothers me' },
    ],
    scoring: {
      mode: 'directional',
      worseWhen: 'other-higher',
    },
    weight: 1,
    compromisable: true,
    compromiseText: 'Use headphones / keep study sound at "{label}"',
  },
  {
    id: 'studyLocation',
    category: 'study',
    shortLabel: 'Exam-week study spot',
    prompt: 'Where do you really study in exam week?',
    type: 'ordinal',
    options: [
      { value: 0, label: 'Desk in the room, always', hint: 'My chair, my setup' },
      { value: 1, label: 'Mix of library and room', hint: 'Depends on the mood' },
      { value: 2, label: 'Library or cafe, room is for sleeping', hint: 'Keep stress outside the room' },
    ],
    scoring: {
      mode: 'symmetric',
    },
    weight: 0.5,
    compromisable: true,
    compromiseText: 'Use "{label}" during exam weeks',
  },
  {
    id: 'classTiming',
    category: 'study',
    shortLabel: 'Class schedule',
    prompt: 'Your classes usually run...',
    type: 'ordinal',
    options: [
      { value: 0, label: 'Morning (8 AM – 1 PM)', hint: 'Early lectures, free afternoons' },
      { value: 1, label: 'Midday (11 AM – 4 PM)', hint: 'Balanced campus block' },
      { value: 2, label: 'Afternoon (1 PM – 6 PM)', hint: 'Late labs and tutorials' },
      { value: 3, label: 'Flexible or mostly online', hint: 'Recorded lectures & projects' },
    ],
    scoring: {
      mode: 'symmetric',
    },
    weight: 0.5,
    compromisable: false,
  },

  // ================= CLEANLINESS =================
  {
    id: 'tidiness',
    category: 'cleanliness',
    shortLabel: 'Desk & Maggi bowl urgency',
    prompt: "It's 1 AM before mid-sems and there are 3-day-old Maggi bowls on your desk. You...",
    type: 'scale',
    options: [
      { value: 5, label: "Wash them right now, can't focus otherwise", hint: 'Clutter freezes my brain' },
      { value: 4, label: 'Stack them aside, clean after studying', hint: 'Tidy right after the chapter' },
      { value: 2, label: 'Push them to a corner and keep studying', hint: 'Out of sight, out of mind' },
      { value: 1, label: "What bowls? They're part of the desk now", hint: 'Ecosystem in progress' },
    ],
    scoring: {
      mode: 'directional',
      worseWhen: 'other-lower',
      sensitivityGroup: 'cleanliness',
    },
    weight: 1,
    compromisable: true,
    compromiseText: 'Keep shared desk clutter to "{label}"',
  },
  {
    id: 'cleaningFrequency',
    category: 'cleanliness',
    shortLabel: 'Cleaning routine',
    prompt: 'What actually makes you clean the room?',
    type: 'ordinal',
    options: [
      { value: 0, label: 'A small mess bugs me the same day', hint: 'Daily mini-resets' },
      { value: 1, label: 'Saturday is cleaning day, no excuses', hint: 'Weekly deep reset' },
      { value: 2, label: 'Only when parents or the warden are visiting', hint: 'Emergency panic clean' },
    ],
    scoring: {
      mode: 'directional',
      worseWhen: 'other-higher',
      sensitivityGroup: 'cleanliness',
    },
    weight: 1,
    compromisable: true,
    compromiseText: 'Stick to "{label}" for room cleaning',
  },
  {
    id: 'dishesLaundry',
    category: 'cleanliness',
    shortLabel: 'Laundry & dishes speed',
    prompt: 'Laundry basket is overflowing on Sunday night. You...',
    type: 'ordinal',
    options: [
      { value: 0, label: 'Wash it immediately', hint: 'Basket never wins' },
      { value: 1, label: 'Do it within a day or two', hint: 'Reasonable turnaround' },
      { value: 2, label: 'Wear the least-dirty thing until it becomes a mountain', hint: 'Sniff-test champion' },
    ],
    scoring: {
      mode: 'directional',
      worseWhen: 'other-higher',
      sensitivityGroup: 'cleanliness',
    },
    weight: 1,
    compromisable: true,
    compromiseText: 'Keep laundry & dishes to "{label}"',
  },
  {
    id: 'messTolerance',
    category: 'cleanliness',
    shortLabel: 'Clutter tolerance',
    prompt: 'Your roommate leaves a cup and some clothes on their bed. You...',
    type: 'scale',
    options: [
      { value: 1, label: 'It would bug me all day', hint: 'Needs visual order' },
      { value: 2, label: "I'd mention it politely", hint: 'Friendly nudge' },
      { value: 4, label: 'Slightly annoying but fine', hint: 'Their side, their rules' },
      { value: 5, label: "I wouldn't even notice", hint: 'Zero clutter radar' },
    ],
    scoring: {
      mode: 'modifier',
      sensitivityGroup: 'cleanliness',
    },
    weight: 0,
    compromisable: false,
  },

  // ================= SOCIAL =================
  {
    id: 'guests',
    category: 'social',
    shortLabel: 'Overnight guests',
    prompt: 'Friends want to crash in your room overnight. How often is that okay?',
    type: 'ordinal',
    options: [
      { value: 0, label: 'Never, my room is my sanctuary', hint: 'Private recharge space only' },
      { value: 1, label: 'Occasionally with a heads-up', hint: 'Ask first, keep it rare' },
      { value: 2, label: 'Often, my room is the hangout spot', hint: 'Open-door hostel hub' },
    ],
    scoring: {
      mode: 'directional',
      worseWhen: 'other-higher',
    },
    weight: 1,
    compromisable: true,
    compromiseText: 'Limit overnight guests to "{label}"',
  },
  {
    id: 'socialEnergy',
    category: 'social',
    shortLabel: 'Weekend social battery',
    prompt: 'After a long week your ideal Saturday is...',
    type: 'scale',
    options: [
      { value: 1, label: 'Bed, blankets, zero people', hint: 'Full introvert recharge' },
      { value: 2, label: 'Coffee with 1–2 close friends', hint: 'Low-key catch-up' },
      { value: 4, label: 'A few friends out', hint: 'Dinner & campus stroll' },
      { value: 5, label: 'Big group outing', hint: 'Maximum social energy' },
    ],
    scoring: {
      mode: 'symmetric',
    },
    weight: 1,
    compromisable: false,
  },
  {
    id: 'smoking',
    category: 'social',
    shortLabel: 'Smoking / vaping',
    prompt: 'Smoking or vaping?',
    note: 'Be honest, this is a hard deal-breaker.',
    type: 'matrix',
    options: [
      { value: 'none', label: 'None', hint: 'Smoke-free' },
      { value: 'outside', label: 'Outside only', hint: 'Never inside the room or balcony' },
      { value: 'yes', label: 'Yes', hint: 'Regular smoker / vaper' },
    ],
    scoring: {
      mode: 'directional',
      matrix: {
        none: { none: 1, outside: 0.5, yes: 0 },
        outside: { none: 1, outside: 1, yes: 0.5 },
        yes: { none: 0.8, outside: 0.9, yes: 1 },
      },
    },
    weight: 1,
    compromisable: false,
  },
  {
    id: 'temperature',
    category: 'social',
    shortLabel: 'AC / fan setting',
    prompt: 'Peak summer night, your AC setting is...',
    type: 'ordinal',
    options: [
      { value: 0, label: 'Cool (18–22°C)', hint: 'Blanket weather year-round' },
      { value: 1, label: 'Moderate (23–25°C)', hint: 'Comfortable middle ground' },
      { value: 2, label: 'Warm or just a fan (26°C+)', hint: 'No shivering in bed' },
    ],
    scoring: {
      mode: 'symmetric',
    },
    weight: 1,
    compromisable: true,
    compromiseText: 'Set AC/fan temperature to {label}',
  },
];

export const QUESTION_MAP = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

export function getOptionLabel(questionId, value) {
  const q = QUESTION_MAP[questionId];
  if (!q) return String(value ?? '—');
  const match = q.options.find((opt) => opt.value === value);
  return match ? match.label : '—';
}
