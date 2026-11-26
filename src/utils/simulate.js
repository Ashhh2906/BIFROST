import { QUESTIONS, getOptionLabel } from '../data/questions.js';
import { evaluatePair } from './compatibility.js';
import { buildConflictTimeline } from './timeline.js';

/**
 * Compromise Simulator Engine
 *
 * Pure functions that compute non-mutating answer overrides to show
 * how small adjustments affect compatibility and 24-hour timeline friction.
 */

function getSortedOptions(question) {
  if (question.type === 'circular') {
    return question.options;
  }
  return [...question.options].sort((a, b) => Number(a.value) - Number(b.value));
}

/**
 * Compute one step from `fromVal` toward `toVal` along the question's option sequence.
 */
export function stepTowardValue(question, fromVal, toVal) {
  const opts = getSortedOptions(question);
  const fromIdx = opts.findIndex((o) => o.value === fromVal);
  const toIdx = opts.findIndex((o) => o.value === toVal);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return fromVal;

  if (question.type === 'circular') {
    const n = opts.length;
    const cwDist = (toIdx - fromIdx + n) % n;
    const ccwDist = (fromIdx - toIdx + n) % n;
    const nextIdx = cwDist <= ccwDist ? (fromIdx + 1) % n : (fromIdx - 1 + n) % n;
    return opts[nextIdx].value;
  }

  const nextIdx = fromIdx < toIdx ? fromIdx + 1 : fromIdx - 1;
  return opts[nextIdx].value;
}

function getStepDistance(question, valA, valB) {
  const opts = getSortedOptions(question);
  const idxA = opts.findIndex((o) => o.value === valA);
  const idxB = opts.findIndex((o) => o.value === valB);
  if (idxA === -1 || idxB === -1) return 0;
  if (question.type === 'circular') {
    const raw = Math.abs(idxA - idxB);
    return Math.min(raw, opts.length - raw);
  }
  return Math.abs(idxA - idxB);
}

/**
 * Compute simulated overrides for a single question under a given actorMode.
 */
function computeQuestionOverride(question, userVal, candVal, actorMode) {
  if (userVal === candVal || userVal === undefined || candVal === undefined) {
    return { nextUserVal: userVal, nextCandVal: candVal };
  }

  if (actorMode === 'me') {
    return {
      nextUserVal: stepTowardValue(question, userVal, candVal),
      nextCandVal: candVal,
    };
  }

  if (actorMode === 'them') {
    return {
      nextUserVal: userVal,
      nextCandVal: stepTowardValue(question, candVal, userVal),
    };
  }

  // actorMode === 'both'
  const dist = getStepDistance(question, userVal, candVal);
  if (dist <= 1) {
    // Adjacent options: meet on the stricter/quieter side or step the higher-friction side
    const worseWhen = question.scoring?.worseWhen;
    if (worseWhen === 'other-higher') {
      const opts = getSortedOptions(question);
      const idxU = opts.findIndex((o) => o.value === userVal);
      const idxC = opts.findIndex((o) => o.value === candVal);
      const target = idxU < idxC ? userVal : candVal;
      return { nextUserVal: target, nextCandVal: target };
    }
    if (worseWhen === 'other-lower') {
      const opts = getSortedOptions(question);
      const idxU = opts.findIndex((o) => o.value === userVal);
      const idxC = opts.findIndex((o) => o.value === candVal);
      const target = idxU > idxC ? userVal : candVal;
      return { nextUserVal: target, nextCandVal: target };
    }
    return {
      nextUserVal: stepTowardValue(question, userVal, candVal),
      nextCandVal: candVal,
    };
  }

  return {
    nextUserVal: stepTowardValue(question, userVal, candVal),
    nextCandVal: stepTowardValue(question, candVal, userVal),
  };
}

function buildHumanLabel(question, nextUserVal, nextCandVal, actorMode, candidateName) {
  const uLabel = getOptionLabel(question.id, nextUserVal);
  const cLabel = getOptionLabel(question.id, nextCandVal);

  if (actorMode === 'me') {
    if (question.compromiseText) {
      return question.compromiseText.replace('{label}', uLabel);
    }
    return `Adjust my "${question.shortLabel}" to "${uLabel}"`;
  }

  if (actorMode === 'them') {
    return `${candidateName} shifts "${question.shortLabel}" to "${cLabel}"`;
  }

  if (nextUserVal === nextCandVal) {
    return `Meet together at "${uLabel}" for ${question.shortLabel.toLowerCase()}`;
  }
  return `Both step closer on ${question.shortLabel.toLowerCase()} (You: "${uLabel}", ${candidateName}: "${cLabel}")`;
}

/**
 * Auto-detect the top 3 compromisable questions (never smoking) that improve comfort/score most.
 */
export function getCompromiseSuggestions(user, candidate, actorMode = 'me') {
  const basePair = evaluatePair(user, candidate);
  const baseTimeline = buildConflictTimeline(user, candidate);
  const suggestions = [];

  for (const q of QUESTIONS) {
    if (!q.compromisable || q.id === 'smoking') continue;

    const uVal = user?.answers?.[q.id];
    const cVal = candidate?.answers?.[q.id];
    const { nextUserVal, nextCandVal } = computeQuestionOverride(q, uVal, cVal, actorMode);
    if (nextUserVal === uVal && nextCandVal === cVal) continue;

    const simUser = {
      ...user,
      answers: { ...(user?.answers || {}), [q.id]: nextUserVal },
    };
    const simCandidate = {
      ...candidate,
      answers: { ...(candidate?.answers || {}), [q.id]: nextCandVal },
    };

    const simPair = evaluatePair(simUser, simCandidate);
    const simTimeline = buildConflictTimeline(simUser, simCandidate);

    const deltaOverall = simPair.overall - basePair.overall;
    const deltaYour = simPair.yourComfort - basePair.yourComfort;
    const deltaTheir = simPair.theirComfort - basePair.theirComfort;
    const deltaFriction = Number(
      (baseTimeline.summary.frictionHours - simTimeline.summary.frictionHours).toFixed(1)
    );

    const impactScore =
      deltaOverall * 3 + Math.max(0, deltaYour) + Math.max(0, deltaTheir) + deltaFriction * 4;

    if (impactScore <= 0 && deltaOverall <= 0 && deltaYour <= 0 && deltaTheir <= 0 && deltaFriction <= 0) {
      continue;
    }

    suggestions.push({
      id: `${actorMode}-${q.id}`,
      questionId: q.id,
      category: q.category,
      shortLabel: q.shortLabel,
      actorMode,
      nextUserVal,
      nextCandVal,
      targetValue: actorMode === 'them' ? nextCandVal : nextUserVal,
      actorLabel:
        actorMode === 'me'
          ? user?.name || 'You'
          : actorMode === 'them'
          ? candidate.name
          : `${user?.name || 'You'} & ${candidate.name}`,
      label: buildHumanLabel(q, nextUserVal, nextCandVal, actorMode, candidate.name),
      deltaOverall,
      deltaYour,
      deltaTheir,
      deltaFriction,
      impactScore,
    });
  }

  suggestions.sort((a, b) => b.impactScore - a.impactScore);
  return suggestions.slice(0, 3);
}

/**
 * Apply selected compromise suggestion IDs cumulatively without mutating stored state.
 */
export function applyCompromises(user, candidate, suggestions, activeIds) {
  const activeSet = new Set(activeIds || []);
  const selected = suggestions.filter((s) => activeSet.has(s.id));

  const nextUserAnswers = { ...(user?.answers || {}) };
  const nextCandAnswers = { ...(candidate?.answers || {}) };

  for (const item of selected) {
    nextUserAnswers[item.questionId] = item.nextUserVal;
    nextCandAnswers[item.questionId] = item.nextCandVal;
  }

  const simulatedUser = { ...user, answers: nextUserAnswers };
  const simulatedCandidate = { ...candidate, answers: nextCandAnswers };

  const simulatedMatch = evaluatePair(simulatedUser, simulatedCandidate);
  const simulatedTimeline = buildConflictTimeline(simulatedUser, simulatedCandidate);

  const activeCommitments = selected.map((item) => ({
    id: item.id,
    questionId: item.questionId,
    category: item.category,
    shortLabel: item.shortLabel,
    targetValue: item.targetValue,
    actorLabel: item.actorLabel,
    impactLabel:
      item.deltaOverall > 0
        ? `+${item.deltaOverall}% match`
        : item.deltaFriction > 0
        ? `-${item.deltaFriction}h friction`
        : 'higher comfort',
  }));

  return {
    simulatedUser,
    simulatedCandidate,
    simulatedMatch,
    simulatedTimeline,
    activeCommitments,
    hasActiveChanges: selected.length > 0,
  };
}
