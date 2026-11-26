import { CATEGORIES, DEAL_BREAKER_OPTIONS, QUESTIONS, getOptionLabel } from '../data/questions.js';
import { SEED_PROFILES } from '../data/seedProfiles.js';
import { generateRoommateAgreement } from './agreement.js';
import { evaluatePair } from './compatibility.js';
import { buildDefaultEmailRequest } from './requestEmail.js';
import { getCompromiseSuggestions } from './simulate.js';
import { buildConflictTimeline } from './timeline.js';

/**
 * Integrated AI Helper Agent
 *
 * Pure state-aware assistant that helps students:
 *  1. Navigate the app cleanly
 *  2. Audit & refine their preferences, importance weights, and deal-breakers
 *  3. Understand asymmetric match scores & 24-hour conflict windows
 *  4. Draft personalized roommate request emails & custom agreement clauses
 */

function findMentionedCandidate(text, matches, preferredCandidateId) {
  const lower = text.toLowerCase();
  const byName = SEED_PROFILES.find((p) => {
    const first = p.name.split(' ')[0].toLowerCase();
    return lower.includes(p.name.toLowerCase()) || lower.includes(first);
  });
  if (byName) return byName;

  if (preferredCandidateId) {
    const pref = SEED_PROFILES.find((p) => p.id === preferredCandidateId);
    if (pref) return pref;
  }

  if (matches?.length > 0) return matches[0].candidate;
  return SEED_PROFILES[0];
}

export function getSuggestedPrompts({ route = '/', activeCandidateName = null, hasAnswers = false }) {
  if (!hasAnswers) {
    return [
      'Load demo & show me around',
      'How does asymmetric scoring work?',
      'Take me to the quiz',
    ];
  }
  if (route.startsWith('/compare/') && activeCandidateName) {
    return [
      `Why is ${activeCandidateName} scored this way?`,
      `Draft a roommate request email for ${activeCandidateName}`,
      `Draft custom agreement rules for ${activeCandidateName}`,
      'Audit my preferences',
    ];
  }
  if (route.startsWith('/shortlist')) {
    return [
      'Draft a roommate request email',
      'Review my lifestyle conditions',
      'Audit my preferences',
    ];
  }
  if (route.startsWith('/importance') || route.startsWith('/quiz')) {
    return [
      'Audit my preferences',
      'Should I mark smoking or guests as deal-breakers?',
      'Take me to my matches',
    ];
  }
  return [
    'Why is my top match ranked #1?',
    'Audit my preferences & priorities',
    'Draft a roommate request email',
    'Open my shortlist',
  ];
}

export function runAiHelperTurn({
  message,
  route = '/',
  currentUser,
  answeredCount = 0,
  matches = [],
  shortlist = [],
  activeCandidateId = null,
}) {
  const text = (message || '').trim();
  const lower = text.toLowerCase();

  // 1. Demo / Quick Start
  if (lower.includes('demo')) {
    return {
      reply:
        'I can load the sample demo persona (Riya Verma — early, light sleeper, tidy, non-smoker) and jump straight to your ranked matches so you can test the 24-hour Conflict Timeline, Compromise Simulator, and Email Requests immediately.',
      actions: [
        { type: 'loadDemo', label: 'Load Demo & View Matches' },
        { type: 'navigate', to: '/how-it-works', label: 'How scoring works' },
      ],
    };
  }

  // 2. Navigation Intents
  if (
    (lower.includes('go to') ||
      lower.includes('open') ||
      lower.includes('take me') ||
      lower.includes('navigate')) &&
    !lower.includes('draft') &&
    !lower.includes('email')
  ) {
    if (lower.includes('shortlist')) {
      return {
        reply: `Opening your Shortlist (${shortlist.length} saved). From there you can send roommate request emails with your lifestyle conditions attached.`,
        actions: [{ type: 'navigate', to: '/shortlist', label: 'Go to Shortlist' }],
      };
    }
    if (lower.includes('quiz') || lower.includes('answer')) {
      return {
        reply: 'Taking you to the 4-step scenario quiz. Your existing answers are preserved and autosaved.',
        actions: [{ type: 'navigate', to: '/quiz', label: 'Open Scenario Quiz' }],
      };
    }
    if (lower.includes('priority') || lower.includes('priorities') || lower.includes('importance') || lower.includes('deal')) {
      return {
        reply: 'Opening your Category Priorities & Hard Deal-Breakers page so you can fine-tune weights.',
        actions: [{ type: 'navigate', to: '/importance', label: 'Edit Priorities & Deal-Breakers' }],
      };
    }
    if (lower.includes('profile')) {
      return {
        reply: 'Opening your Profile setup to update your name, email, course, or gender preference.',
        actions: [{ type: 'navigate', to: '/profile', label: 'Edit Profile' }],
      };
    }
    if (lower.includes('how') || lower.includes('work') || lower.includes('explain')) {
      return {
        reply: 'Here is our breakdown of asymmetric comfort, sensitivity multipliers, harmonic mean scoring, and the 24-hour conflict timeline.',
        actions: [{ type: 'navigate', to: '/how-it-works', label: 'Open How It Works' }],
      };
    }
    if (lower.includes('compare')) {
      const cand = findMentionedCandidate(text, matches, activeCandidateId);
      return {
        reply: `Let's inspect your 24-hour conflict timeline, radar chart, and compromise options with ${cand.name}.`,
        actions: [{ type: 'navigate', to: `/compare/${cand.id}`, label: `Compare with ${cand.name}` }],
      };
    }
    if (lower.includes('match') || lower.includes('result')) {
      return {
        reply: 'Heading to your ranked roommate matches.',
        actions: [{ type: 'navigate', to: '/results', label: 'View Matches' }],
      };
    }
  }

  // 3. How scoring works
  if (lower.includes('how does') || lower.includes('harmonic') || lower.includes('asymmetric')) {
    return {
      reply:
        'Roommate Finder computes TWO comfort scores: how comfortable YOU feel with them, and how comfortable THEY feel with you (scaled by light-sleeper and mess-tolerance multipliers). We combine both with the harmonic mean 2ab/(a+b) so lopsided pairs are flagged instead of hidden behind an average.',
      actions: [
        { type: 'navigate', to: '/how-it-works', label: 'See live math example' },
        ...(answeredCount > 0 ? [{ type: 'navigate', to: '/results', label: 'View my matches' }] : []),
      ],
    };
  }

  // 4. Direct preference refinement commands
  for (const cat of CATEGORIES) {
    const catHit = lower.includes(cat.id) || lower.includes(cat.shortLabel.toLowerCase());
    if (
      catHit &&
      (lower.includes('priorit') ||
        lower.includes('important') ||
        lower.includes('set ') ||
        lower.includes('make ') ||
        lower.includes('boost') ||
        lower.includes('increase') ||
        lower.includes('lower'))
    ) {
      const numMatch = lower.match(/\b([1-5])\b/);
      const targetVal = numMatch
        ? Number(numMatch[1])
        : lower.includes('lower') || lower.includes('less')
        ? 2
        : 5;
      return {
        reply: `Got it — setting **${cat.label}** priority to **${targetVal}/5** will immediately re-weight your match rankings toward what matters most to you.`,
        actions: [
          {
            type: 'setImportance',
            categoryId: cat.id,
            value: targetVal,
            label: `Set ${cat.shortLabel} priority to ${targetVal}/5`,
          },
          { type: 'navigate', to: '/results', label: 'See updated matches' },
        ],
      };
    }
  }

  if (lower.includes('deal-breaker') || lower.includes('dealbreaker') || lower.includes('deal breaker')) {
    const mentionedDb = DEAL_BREAKER_OPTIONS.find(
      (db) => lower.includes(db.id) || lower.includes('guest') && db.id === 'guests' || lower.includes('temp') && db.id === 'temperature' || lower.includes('ac') && db.id === 'temperature' || lower.includes('smok') && db.id === 'smoking'
    );
    if (mentionedDb) {
      const currentlyOn = (currentUser?.dealBreakers || []).includes(mentionedDb.id);
      const wantOff = lower.includes('remove') || lower.includes('disable') || lower.includes('turn off');
      const nextActive = wantOff ? false : !currentlyOn || lower.includes('add') || lower.includes('mark') || lower.includes('enable');
      return {
        reply: `${nextActive ? 'Enabling' : 'Disabling'} **${mentionedDb.label}** as a hard deal-breaker ${
          nextActive ? 'caps any clashing match at 60% and displays a clear warning.' : 'removes the 60% cap while keeping warning indicators visible.'
        }`,
        actions: [
          {
            type: 'setDealBreaker',
            id: mentionedDb.id,
            active: nextActive,
            label: `${nextActive ? 'Enable' : 'Disable'} ${mentionedDb.label} deal-breaker`,
          },
          { type: 'navigate', to: '/importance', label: 'Review all deal-breakers' },
        ],
      };
    }

    return {
      reply:
        'Hard deal-breakers cap incompatible pairs at 60% when smoking, overnight guests, or AC temperature sit at opposite extremes. Marking Smoking and Overnight Guests is recommended if those are true non-negotiables for your sleep or health.',
      actions: [
        { type: 'setDealBreaker', id: 'smoking', active: true, label: 'Enable Smoking deal-breaker' },
        { type: 'setDealBreaker', id: 'guests', active: true, label: 'Enable Overnight Guests deal-breaker' },
        { type: 'navigate', to: '/importance', label: 'Open Priorities & Deal-Breakers' },
      ],
    };
  }

  // If user hasn't answered quiz yet, prompt them clearly
  if (answeredCount === 0) {
    return {
      reply:
        'You have not answered the scenario quiz yet! Take the 2-minute quiz or click "Load Demo" so I can audit your preferences, analyze conflicts, and draft tailored roommate requests.',
      actions: [
        { type: 'loadDemo', label: 'Load Demo Persona' },
        { type: 'navigate', to: '/profile', label: 'Start Quiz' },
      ],
    };
  }

  // 5. Draft Roommate Request Email
  if (lower.includes('email') || lower.includes('request') || lower.includes('draft') && !lower.includes('agreement') && !lower.includes('rule') && !lower.includes('clause')) {
    const shortlistCandidate =
      shortlist.length > 0
        ? SEED_PROFILES.find((p) => p.id === shortlist[0])
        : null;
    const targetCandidate =
      lower.match(/\b(aarav|ananya|kabir|rohan|devika|zoya|siddharth|vikram|neha|ishaan|tanvi|pranav)\b/)
        ? findMentionedCandidate(text, matches, activeCandidateId)
        : activeCandidateId
        ? findMentionedCandidate(text, matches, activeCandidateId)
        : shortlistCandidate || findMentionedCandidate(text, matches, activeCandidateId);

    const match =
      matches.find((m) => m.candidate.id === targetCandidate.id) ||
      evaluatePair(currentUser, targetCandidate);
    const timeline = buildConflictTimeline(currentUser, targetCandidate);
    const emailDraft = buildDefaultEmailRequest({ user: currentUser, match, timeline });

    const topTips =
      timeline.conflictWindows.length > 0
        ? `I highlighted your ${timeline.summary.frictionHours}h/day schedule overlap directly so ${targetCandidate.name} knows what to expect upfront.`
        : `Your schedules align smoothly (${timeline.summary.syncSleepHours}h shared sleep), so the draft leans into your shared rhythm.`;

    return {
      reply: `Here is a tailored roommate request draft for **${targetCandidate.name}** (${match.overall}% match). ${topTips}`,
      draft: {
        title: `Email Draft for ${targetCandidate.name}`,
        subject: emailDraft.subject,
        body: emailDraft.message,
        candidateId: targetCandidate.id,
      },
      actions: [
        ...(shortlist.includes(targetCandidate.id)
          ? []
          : [
              {
                type: 'shortlist',
                candidateId: targetCandidate.id,
                label: `Shortlist ${targetCandidate.name}`,
              },
            ]),
        { type: 'navigate', to: '/shortlist', label: 'Open Shortlist & Send Email' },
        { type: 'navigate', to: `/compare/${targetCandidate.id}`, label: `Compare ${targetCandidate.name}` },
      ],
    };
  }

  // 6. Draft Agreement Clauses
  if (lower.includes('agreement') || lower.includes('rule') || lower.includes('clause')) {
    const targetCandidate = findMentionedCandidate(text, matches, activeCandidateId);
    const match =
      matches.find((m) => m.candidate.id === targetCandidate.id) ||
      evaluatePair(currentUser, targetCandidate);
    const timeline = buildConflictTimeline(currentUser, targetCandidate);
    const agreement = generateRoommateAgreement({
      userName: currentUser.name,
      match,
      timeline,
    });

    const clauseLines = agreement.rules
      .slice(0, 5)
      .map((r, i) => `${i + 1}. ${r.title}: ${r.text} (Because: ${r.reason})`)
      .join('\n');

    return {
      reply: `I drafted ${agreement.rules.length} targeted house rules for **${currentUser.name} & ${targetCandidate.name}** based on your real friction points and 24-hour timeline:`,
      draft: {
        title: `Agreement Clauses for ${targetCandidate.name}`,
        body: `${clauseLines}\n\n${agreement.reviewClause}`,
        candidateId: targetCandidate.id,
      },
      actions: [
        { type: 'navigate', to: `/compare/${targetCandidate.id}`, label: `Open Comparison & Print Agreement` },
      ],
    };
  }

  // 7. Audit Preferences / Conditions
  if (lower.includes('audit') || lower.includes('refine') || lower.includes('condition') || lower.includes('review my')) {
    const ans = currentUser.answers || {};
    const imp = currentUser.importance || {};
    const dbs = currentUser.dealBreakers || [];
    const observations = [];
    const actions = [];

    if ((ans.lightSleeper ?? 3) >= 4 && (imp.sleep ?? 3) < 5) {
      observations.push(
        `You rated yourself a light sleeper ("${getOptionLabel('lightSleeper', ans.lightSleeper)}"), so raising Sleep priority to 5/5 will protect you from night-owl mismatches.`
      );
      actions.push({
        type: 'setImportance',
        categoryId: 'sleep',
        value: 5,
        label: 'Boost Sleep priority to 5/5',
      });
    }
    if ((ans.messTolerance ?? 3) <= 2 && (imp.cleanliness ?? 3) < 5) {
      observations.push(
        `Your clutter tolerance is low ("${getOptionLabel('messTolerance', ans.messTolerance)}"), so bumping Cleanliness priority to 5/5 is smart.`
      );
      actions.push({
        type: 'setImportance',
        categoryId: 'cleanliness',
        value: 5,
        label: 'Boost Cleanliness priority to 5/5',
      });
    }
    if (ans.smoking === 'none' && !dbs.includes('smoking')) {
      observations.push('You are smoke-free, yet Smoking is not marked as a hard deal-breaker.');
      actions.push({
        type: 'setDealBreaker',
        id: 'smoking',
        active: true,
        label: 'Mark Smoking as hard deal-breaker',
      });
    }
    if (ans.guests === 0 && !dbs.includes('guests')) {
      observations.push('You answered Never to overnight guests — marking Overnight Guests as a hard deal-breaker prevents open-hangout rooms from ranking high.');
      actions.push({
        type: 'setDealBreaker',
        id: 'guests',
        active: true,
        label: 'Mark Guests as hard deal-breaker',
      });
    }

    if (observations.length === 0) {
      observations.push(
        `Your profile looks well-calibrated! Priorities: Sleep ${imp.sleep ?? 4}/5, Cleanliness ${imp.cleanliness ?? 4}/5, Study ${imp.study ?? 3}/5, Social ${imp.social ?? 2}/5. Hard deal-breakers: ${
          dbs.length > 0 ? dbs.join(', ') : 'none'
        }.`
      );
    }

    actions.push({ type: 'navigate', to: '/importance', label: 'Adjust Priorities' });
    if (shortlist.length > 0) {
      actions.push({ type: 'navigate', to: '/shortlist', label: 'Send Shortlist Request' });
    }

    return {
      reply: observations.join('\n\n'),
      actions: actions.slice(0, 4),
    };
  }

  // 8. Analyze a specific match or top match
  if (
    lower.includes('why') ||
    lower.includes('conflict') ||
    lower.includes('lopsided') ||
    lower.includes('compromise') ||
    lower.includes('match') ||
    lower.includes('aarav') ||
    lower.includes('ananya') ||
    lower.includes('vikram')
  ) {
    const targetCandidate = findMentionedCandidate(text, matches, activeCandidateId);
    const match =
      matches.find((m) => m.candidate.id === targetCandidate.id) ||
      evaluatePair(currentUser, targetCandidate);
    const timeline = buildConflictTimeline(currentUser, targetCandidate);
    const sugs = getCompromiseSuggestions(currentUser, targetCandidate, 'both');

    const lines = [
      `**${targetCandidate.name}** scores **${match.overall}%** overall (Your comfort: **${match.yourComfort}%**, Their comfort: **${match.theirComfort}%**).`,
    ];
    if (match.isLopsided) {
      lines.push(`• **Asymmetry**: ${match.lopsided.message}`);
    }
    if (match.warnings.length > 0) {
      lines.push(`• **Deal-breaker alert**: ${match.warnings.map((w) => w.label).join(', ')}.`);
    }
    if (timeline.conflictWindows.length > 0) {
      lines.push(`• **Timeline clash**: ${timeline.conflictWindows[0].sentence}`);
    } else {
      lines.push(`• **Schedule sync**: 0 hrs/day friction and ${timeline.summary.syncSleepHours} hrs/day shared sleep.`);
    }
    if (sugs.length > 0) {
      lines.push(`• **Best compromise**: ${sugs[0].label} (+${sugs[0].deltaOverall}% match).`);
    }

    return {
      reply: lines.join('\n'),
      actions: [
        { type: 'navigate', to: `/compare/${targetCandidate.id}`, label: `Open ${targetCandidate.name}'s Timeline & Simulator` },
        ...(shortlist.includes(targetCandidate.id)
          ? [{ type: 'navigate', to: '/shortlist', label: 'Send Email Request' }]
          : [{ type: 'shortlist', candidateId: targetCandidate.id, label: `Shortlist ${targetCandidate.name}` }]),
      ],
    };
  }

  // Default helpful summary
  const topName = matches[0]?.candidate?.name;
  const topScore = matches[0]?.overall;
  return {
    reply: `You've answered ${answeredCount}/${QUESTIONS.length} scenarios${
      topName ? ` and your #1 match right now is **${topName} (${topScore}%)**` : ''
    }. Ask me to:\n• **Audit your preferences** or tweak Sleep/Cleanliness/Deal-breakers\n• **Explain any match** or 24-hour conflict window\n• **Draft a roommate request email** or **house-rules agreement** for your shortlist.`,
    actions: [
      { type: 'navigate', to: '/results', label: 'Browse Matches' },
      { type: 'navigate', to: '/shortlist', label: `Shortlist (${shortlist.length})` },
      { type: 'navigate', to: '/importance', label: 'Refine Priorities' },
    ],
  };
}
