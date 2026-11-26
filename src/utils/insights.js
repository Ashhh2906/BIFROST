/**
 * Helper utilities for Match Card "you both..." tags, avatar colors,
 * comparison narrative summaries, and intro message templates.
 */

const AVATAR_PALETTES = [
  'bg-indigo-600 text-white',
  'bg-emerald-600 text-white',
  'bg-amber-600 text-white',
  'bg-rose-600 text-white',
  'bg-cyan-600 text-white',
  'bg-violet-600 text-white',
  'bg-teal-600 text-white',
  'bg-fuchsia-600 text-white',
];

export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarColor(idOrName) {
  const str = String(idOrName || 'user');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

/**
 * Generate up to 2 crisp "You both..." tags for match cards.
 */
export function getSharedTags(match) {
  const u = match?.questionBreakdown || [];
  const tags = [];

  for (const row of u) {
    if (row.question.scoring?.mode === 'modifier') continue;
    if (row.yourValue === undefined || row.theirValue === undefined) continue;
    if (row.yourValue === row.theirValue) {
      const id = row.question.id;
      if (id === 'bedtime') tags.push(`You both sleep ${row.yourLabel.toLowerCase()}`);
      else if (id === 'wakeTime') tags.push(`You both wake ${row.yourLabel.toLowerCase()}`);
      else if (id === 'studyTime') tags.push(`You both study ${row.yourLabel.toLowerCase()}`);
      else if (id === 'tidiness') tags.push('You both share Maggi-bowl standards');
      else if (id === 'cleaningFrequency') tags.push('You both share cleaning rhythm');
      else if (id === 'guests') tags.push(`You both align on guests`);
      else if (id === 'temperature') tags.push(`You both pick ${row.yourLabel}`);
      else if (id === 'smoking' && row.yourValue === 'none') tags.push('You both are smoke-free');
      else tags.push(`You both align on ${row.question.shortLabel.toLowerCase()}`);
    }
    if (tags.length >= 2) break;
  }

  if (tags.length < 2) {
    for (const row of match?.sharedTraits || []) {
      const tag = `Aligned on ${row.question.shortLabel.toLowerCase()}`;
      if (!tags.includes(tag)) tags.push(tag);
      if (tags.length >= 2) break;
    }
  }

  return tags.slice(0, 2);
}

/**
 * Auto-generated plain-English summary sentence for the comparison page & Copy Summary.
 */
export function buildComparisonSummary(match, timelineSummary) {
  const { candidate, overall, yourComfort, theirComfort, lopsided, warnings, sharedTraits, biggestDifferences } =
    match;

  const parts = [
    `Roommate Compatibility with ${candidate.name} (${candidate.course}, ${candidate.year}): ${overall}% overall.`,
    `Asymmetric comfort — You with ${candidate.name}: ${yourComfort}%, ${candidate.name} with you: ${theirComfort}%.`,
  ];

  if (lopsided) {
    parts.push(lopsided.message);
  }
  if (warnings?.length) {
    parts.push(`Deal-breaker alert: ${warnings.map((w) => w.label).join(', ')}.`);
  }
  if (timelineSummary) {
    parts.push(
      `24-hour schedule: ${timelineSummary.frictionHours} hrs/day friction, ${timelineSummary.syncSleepHours} hrs/day shared sleep.`
    );
  }
  if (sharedTraits?.length) {
    parts.push(`Top alignment: ${sharedTraits.map((t) => t.question.shortLabel).join(', ')}.`);
  }
  if (biggestDifferences?.length) {
    parts.push(
      `Main discussion points: ${biggestDifferences.map((d) => d.question.shortLabel).join(', ')}.`
    );
  }

  return parts.join(' ');
}

/**
 * Copyable icebreaker message for "Say hi".
 */
export function buildIntroMessage(userName, match, timelineSummary) {
  const greetingName = match.candidate.name;
  const sender = userName?.trim() || 'a fellow student';
  const shared = getSharedTags(match);
  const sharedText =
    shared.length > 0
      ? shared[0].replace(/^You both/i, 'we both')
      : `we scored ${match.overall}% on Roommate Finder`;

  const frictionHint =
    timelineSummary && timelineSummary.frictionHours > 0
      ? ` The app flagged about ${timelineSummary.frictionHours}h/day where our routines cross, so we can even align on quiet hours up front.`
      : ` Our daily schedules look super synced too.`;

  return `Hey ${greetingName}! I'm ${sender} (${match.overall}% match on Roommate Finder). Looks like ${sharedText}.${frictionHint} Want to grab coffee or chat about rooming together?`;
}
