import { CATEGORIES, getOptionLabel } from '../data/questions.js';

/**
 * Roommate Agreement Generator
 *
 * Generates customized House Rules strictly from real friction points:
 *   - Questions where either person's directional/symmetric comfort < 0.75
 *   - Deal-breaker clashes
 *   - Red/Amber 24-hour timeline conflict windows
 *   - Plus active Compromise Simulator toggles (if any)
 */

const CATEGORY_TITLES = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));

function createRuleForQuestion(row, candidateName, timeline) {
  const { question, yourLabel, theirLabel, yourScore, theirScore, yourValue, theirValue } = row;
  const id = question.id;
  const userNeedsAccommodation = (yourScore ?? 1) <= (theirScore ?? 1);
  const adjuster = userNeedsAccommodation ? candidateName : 'You';
  const beneficiary = userNeedsAccommodation ? 'you' : candidateName;
  const targetLabel = userNeedsAccommodation ? yourLabel : theirLabel;
  const becauseBase = `You: "${yourLabel}" vs ${candidateName}: "${theirLabel}"`;

  switch (id) {
    case 'bedtime':
    case 'screensAtNight': {
      const redWindow = timeline?.conflictWindows?.find((w) => w.zone === 'red');
      const windowNote = redWindow
        ? `${redWindow.startLabel}–${redWindow.endLabel} conflict window`
        : becauseBase;
      return {
        id: `rule-${id}`,
        category: 'sleep',
        title: 'Quiet & Lights-Out Hours',
        text: `${adjuster} will switch to headphones and a low-glare desk lamp (no overhead lights or speaker audio) whenever ${beneficiary} ${
          beneficiary === 'you' ? 'are' : 'is'
        } asleep${redWindow ? ` (especially ${redWindow.startLabel}–${redWindow.endLabel})` : ''}.`,
        reason: windowNote,
      };
    }

    case 'wakeTime':
      return {
        id: `rule-${id}`,
        category: 'sleep',
        title: 'Considerate Morning Alarms',
        text: `${adjuster} will avoid repeated loud snooze alarms, keep morning prep quiet, and step outside for calls before ${
          userNeedsAccommodation ? yourLabel : theirLabel
        }.`,
        reason: becauseBase,
      };

    case 'studyTime':
      return {
        id: `rule-${id}`,
        category: 'study',
        title: 'Respecting Peak Study Blocks',
        text: `During peak study windows (${yourLabel} for you, ${theirLabel} for ${candidateName}), the off-duty roommate agrees to keep calls and distractions outside the room.`,
        reason: becauseBase,
      };

    case 'studyHours':
      return {
        id: `rule-${id}`,
        category: 'study',
        title: 'Study Pace & Desk Availability',
        text: `Both roommates agree not to interrupt each other during scheduled study sprints and to keep shared desk space clear.`,
        reason: becauseBase,
      };

    case 'studyNoise':
      return {
        id: `rule-${id}`,
        category: 'study',
        title: 'Silent Study & Headphones Rule',
        text: `${adjuster} will use headphones for music/videos and take voice/video calls outside the room when ${beneficiary} ${
          beneficiary === 'you' ? 'are' : 'is'
        } studying.`,
        reason: becauseBase,
      };

    case 'studyLocation':
      return {
        id: `rule-${id}`,
        category: 'study',
        title: 'Exam-Week Room vs. Library Balance',
        text: `During exam weeks, both roommates will give a quick heads-up if hosting a study session in the room or moving to the library for late-night crunch.`,
        reason: becauseBase,
      };

    case 'classTiming':
      return {
        id: `rule-${id}`,
        category: 'study',
        title: 'Morning vs. Afternoon Class Prep',
        text: `Whoever has the earlier class window agrees to pack bags and iron clothes the night before to minimize morning rustling.`,
        reason: becauseBase,
      };

    case 'tidiness':
      return {
        id: `rule-${id}`,
        category: 'cleanliness',
        title: '24-Hour Bowl & Desk Reset',
        text: `${adjuster} commits to rinsing used Maggi bowls/cups within 24 hours and keeping clutter off shared surfaces to match "${targetLabel}".`,
        reason: becauseBase,
      };

    case 'cleaningFrequency':
      return {
        id: `rule-${id}`,
        category: 'cleanliness',
        title: 'Shared Cleaning Schedule',
        text: `Both roommates commit to a fixed Saturday 20-minute room reset (sweeping, trash, surfaces) plus immediate spill cleanups.`,
        reason: becauseBase,
      };

    case 'dishesLaundry':
      return {
        id: `rule-${id}`,
        category: 'cleanliness',
        title: 'Laundry & Sink Turnaround',
        text: `${adjuster} will clear overflowing laundry baskets within 48 hours and keep dirty items strictly on their side of the room.`,
        reason: becauseBase,
      };

    case 'guests': {
      const limit = Math.min(Number(yourValue ?? 1), Number(theirValue ?? 1)) === 0
        ? 'zero unannounced overnight guests (daytime hangouts only with consent)'
        : 'at least 12 hours heads-up and explicit OK before any friend stays overnight (max 2 nights/month)';
      return {
        id: `rule-${id}`,
        category: 'social',
        title: 'Overnight Guest Protocol',
        text: `Both roommates agree to ${limit}.`,
        reason: becauseBase,
      };
    }

    case 'socialEnergy':
      return {
        id: `rule-${id}`,
        category: 'social',
        title: 'Recharge & Guest-Free Evenings',
        text: `Reserve at least 3 quiet, guest-free evenings per week so the lower-social-energy roommate has guaranteed recharge space in the room.`,
        reason: becauseBase,
      };

    case 'smoking':
      return {
        id: `rule-${id}`,
        category: 'social',
        title: 'Zero Smoke / Vape Indoors',
        text: `Strict no-smoking and no-vaping policy inside the room and attached balcony, with clothes/gear aired out before returning.`,
        reason: becauseBase,
      };

    case 'temperature':
      return {
        id: `rule-${id}`,
        category: 'social',
        title: 'AC & Fan Middle Ground',
        text: `Set the AC to a compromise 23–24°C with timer/sleep mode at night, use a fan for circulation, and turn off cooling whenever both roommates leave.`,
        reason: becauseBase,
      };

    default:
      return null;
  }
}

/**
 * Build the structured Roommate Agreement object for a pair.
 */
export function generateRoommateAgreement({
  userName,
  match,
  timeline,
  activeCompromises = [],
}) {
  const uName = userName?.trim() || 'You';
  const cName = match.candidate.name;
  const seenRuleIds = new Set();
  const rules = [];

  // 1. Add rules for deal-breaker warnings first
  for (const w of match.warnings || []) {
    const qRow = match.questionBreakdown.find((r) => r.question.id === w.id);
    if (qRow) {
      const rule = createRuleForQuestion(qRow, cName, timeline);
      if (rule && !seenRuleIds.has(rule.id)) {
        seenRuleIds.add(rule.id);
        rules.push({ ...rule, accepted: true, isPriority: true });
      }
    }
  }

  // 2. Add rules for questions where either comfort < 0.75
  for (const row of match.questionBreakdown || []) {
    if (row.question.scoring?.mode === 'modifier') continue;
    const minScore = Math.min(row.yourScore ?? 1, row.theirScore ?? 1);
    if (minScore < 0.75) {
      const rule = createRuleForQuestion(row, cName, timeline);
      if (rule && !seenRuleIds.has(rule.id)) {
        seenRuleIds.add(rule.id);
        rules.push({ ...rule, accepted: true, isPriority: minScore < 0.4 });
      }
    }
  }

  // 3. Add rules for timeline windows if not already covered by bedtime/screensAtNight
  for (const win of timeline?.conflictWindows || []) {
    if (!seenRuleIds.has('rule-bedtime') && !seenRuleIds.has('rule-screensAtNight')) {
      const ruleId = `rule-timeline-${win.startSlot}`;
      if (!seenRuleIds.has(ruleId)) {
        seenRuleIds.add(ruleId);
        rules.push({
          id: ruleId,
          category: 'sleep',
          title: `Timeline Quiet Window (${win.startLabel} – ${win.endLabel})`,
          text: `${win.disturber === 'You' ? 'You commit' : `${win.disturber} commits`} to headphones, muted notifications, and low-glare desk lighting while ${
            win.sleeper === 'You' ? 'you sleep' : `${win.sleeper} sleeps`
          }.`,
          reason: win.sentence,
          accepted: true,
          isPriority: win.zone === 'red',
        });
      }
    }
  }

  // 4. Add active simulator compromises as explicit stated commitments
  for (const comp of activeCompromises) {
    const targetLabel = getOptionLabel(comp.questionId, comp.targetValue);
    rules.push({
      id: `sim-${comp.id}`,
      category: comp.category,
      title: `Simulated Commitment: ${comp.shortLabel}`,
      text: `${comp.actorLabel} agreed to adjust "${comp.shortLabel}" to "${targetLabel}".`,
      reason: `Compromise simulator (+${comp.impactLabel || 'improved comfort'})`,
      accepted: true,
      isPriority: true,
    });
  }

  const isAlreadyInSync = rules.length === 0;

  if (isAlreadyInSync) {
    rules.push(
      {
        id: 'starter-sync-1',
        category: 'sleep',
        title: 'Basic Quiet Courtesy',
        text: 'Give a quick heads-up before late-night calls or alarm changes.',
        reason: 'Proactive starter rule (no sleep friction detected)',
        accepted: true,
        isPriority: false,
      },
      {
        id: 'starter-sync-2',
        category: 'cleanliness',
        title: 'Shared Space Check-In',
        text: 'Split shared essentials (trash bags, dish soap, water) evenly each month.',
        reason: 'Proactive starter rule (cleanliness aligned)',
        accepted: true,
        isPriority: false,
      }
    );
  }

  return {
    userName: uName,
    candidateName: cName,
    overallScore: match.overall,
    isAlreadyInSync,
    reviewClause:
      '2-Week Check-In Clause: We agree to review these house rules together 14 days after moving in and adjust anything that feels unfair.',
    rules,
    categoryOrder: Object.keys(CATEGORY_TITLES),
    categoryTitles: CATEGORY_TITLES,
  };
}

/**
 * Serialize accepted rules + custom rules into clean plain text for Download .txt and Copy text.
 */
export function formatAgreementAsText({
  agreement,
  userName,
  candidateName,
  rules,
  customRules = [],
}) {
  const accepted = rules.filter((r) => r.accepted);
  const lines = [
    '====================================================',
    '            ROOMMATE HOUSE RULES AGREEMENT          ',
    '====================================================',
    `Roommates: ${userName} & ${candidateName}`,
    `Compatibility Score: ${agreement.overallScore}%`,
    `Generated on: ${new Date().toLocaleDateString()}`,
    '',
  ];

  for (const catId of agreement.categoryOrder) {
    const catRules = accepted.filter((r) => r.category === catId);
    if (catRules.length === 0) continue;
    lines.push(`[ ${agreement.categoryTitles[catId].toUpperCase()} ]`);
    for (const r of catRules) {
      lines.push(`- ${r.title}: ${r.text}`);
      lines.push(`  Because: ${r.reason}`);
    }
    lines.push('');
  }

  if (customRules.length > 0) {
    lines.push('[ CUSTOM RULES ]');
    for (const cr of customRules) {
      lines.push(`- ${cr.text}`);
    }
    lines.push('');
  }

  lines.push(agreement.reviewClause);
  lines.push('');
  lines.push(`Signature (${userName}): ________________________   Date: __________`);
  lines.push(`Signature (${candidateName}): ________________________   Date: __________`);

  return lines.join('\n');
}
