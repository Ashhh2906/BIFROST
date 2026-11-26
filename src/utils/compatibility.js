import { CATEGORIES, DEFAULT_IMPORTANCE, QUESTIONS, getOptionLabel } from '../data/questions.js';

/**
 * Asymmetric Roommate Compatibility Engine
 *
 * Unlike symmetric matching apps that average differences and miss who suffers,
 * this engine evaluates BOTH directions independently:
 *   - yourComfort: how comfortable YOU feel living with THEM
 *   - theirComfort: how comfortable THEY feel living with YOU
 *
 * Pair overall score = harmonic mean of both directions, so lopsided matches
 * (e.g. 94% vs 52%) are penalized down toward the less-comfortable person.
 */

const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

/**
 * Normalize an answer value to [0, 1] depending on question type.
 * Returns null when the value is missing or invalid.
 */
export function normalizeAnswer(question, value) {
  if (value === undefined || value === null || value === '') return null;

  if (question.type === 'scale') {
    const num = Number(value);
    if (Number.isNaN(num)) return null;
    return Math.min(1, Math.max(0, (num - 1) / 4));
  }

  if (question.type === 'ordinal' || question.type === 'circular') {
    const idx = question.options.findIndex((opt) => opt.value === value);
    if (idx === -1) return null;
    const n = question.options.length;
    if (n <= 1) return 0;
    return idx / (n - 1);
  }

  return null;
}

/**
 * Compute sensitivity multiplier for directional questions in sleep or cleanliness groups.
 * - Sleep group: viewer's lightSleeper (1 -> 0.6, 5 -> 1.5, linear)
 * - Cleanliness group: viewer's messTolerance (1 -> 1.5, 5 -> 0.6, linear)
 * - Other groups: 1.0
 */
export function getSensitivityMultiplier(question, viewerAnswers) {
  const group = question.scoring?.sensitivityGroup;
  if (!group) return 1;

  if (group === 'sleep') {
    const raw = Number(viewerAnswers?.lightSleeper);
    const val = Number.isNaN(raw) ? 3 : Math.min(5, Math.max(1, raw));
    return 0.6 + ((val - 1) / 4) * 0.9;
  }

  if (group === 'cleanliness') {
    const raw = Number(viewerAnswers?.messTolerance);
    const val = Number.isNaN(raw) ? 3 : Math.min(5, Math.max(1, raw));
    return 1.5 - ((val - 1) / 4) * 0.9;
  }

  return 1;
}

/**
 * Score a single question from the viewer's perspective when matched with `other`.
 * Returns a comfort score in [0, 1], or null if not scorable (modifier or missing answer).
 */
export function scoreQuestionForViewer(question, viewerAnswers, otherAnswers) {
  const mode = question.scoring?.mode;
  if (mode === 'modifier') return null;

  const vVal = viewerAnswers?.[question.id];
  const oVal = otherAnswers?.[question.id];
  if (vVal === undefined || vVal === null || oVal === undefined || oVal === null) {
    return null;
  }

  // Explicit lookup matrix (e.g. smoking)
  if (question.type === 'matrix' && question.scoring?.matrix) {
    const row = question.scoring.matrix[vVal];
    if (!row || row[oVal] === undefined) return null;
    return row[oVal];
  }

  // Circular distance (e.g. studyTime over 4 slots so after-midnight and early-morning are adjacent)
  if (question.type === 'circular') {
    const idxV = question.options.findIndex((opt) => opt.value === vVal);
    const idxO = question.options.findIndex((opt) => opt.value === oVal);
    if (idxV === -1 || idxO === -1) return null;
    const n = question.options.length;
    const rawDiff = Math.abs(idxV - idxO);
    const circDiff = Math.min(rawDiff, n - rawDiff);
    const maxDist = n / 2;
    return maxDist === 0 ? 1 : Math.max(0, 1 - circDiff / maxDist);
  }

  const normV = normalizeAnswer(question, vVal);
  const normO = normalizeAnswer(question, oVal);
  if (normV === null || normO === null) return null;

  if (mode === 'symmetric') {
    return Math.max(0, 1 - Math.abs(normV - normO));
  }

  if (mode === 'directional') {
    // Positive d means `other` is worse for the viewer along the question's friction direction.
    const worseWhen = question.scoring.worseWhen;
    const d = worseWhen === 'other-lower' ? normV - normO : normO - normV;

    if (d <= 0) {
      // Other is equal or "better" than viewer -> small leniency deduction only
      return Math.max(0, 1 - 0.1 * Math.abs(d));
    }

    const sensitivity = getSensitivityMultiplier(question, viewerAnswers);
    return Math.max(0, 1 - d * sensitivity);
  }

  return null;
}

/**
 * Normalize a person's importance map across the categories present.
 */
export function normalizeImportance(importance, activeCategories = CATEGORY_IDS) {
  const merged = { ...DEFAULT_IMPORTANCE, ...(importance || {}) };
  let total = 0;
  const weights = {};
  for (const cat of activeCategories) {
    const raw = Number(merged[cat]);
    const val = Number.isNaN(raw) || raw < 0 ? DEFAULT_IMPORTANCE[cat] : raw;
    weights[cat] = val;
    total += val;
  }
  if (total <= 0) {
    const equal = activeCategories.length ? 1 / activeCategories.length : 0;
    for (const cat of activeCategories) weights[cat] = equal;
    return weights;
  }
  for (const cat of activeCategories) {
    weights[cat] = weights[cat] / total;
  }
  return weights;
}

/**
 * Compute one-way directional comfort for `viewer` living with `other`.
 * Returns { overall: 0..1, categories: { sleep: 0..1, ... }, questionScores: { [qId]: 0..1 | null } }.
 */
export function computeViewerComfort(viewer, other) {
  const viewerAnswers = viewer?.answers || {};
  const otherAnswers = other?.answers || {};

  const questionScores = {};
  const categorySums = {};
  const categoryWeights = {};

  for (const cat of CATEGORY_IDS) {
    categorySums[cat] = 0;
    categoryWeights[cat] = 0;
  }

  for (const q of QUESTIONS) {
    const score = scoreQuestionForViewer(q, viewerAnswers, otherAnswers);
    questionScores[q.id] = score;
    if (score === null) continue;
    const w = q.weight ?? 1;
    if (w <= 0) continue;
    categorySums[q.category] += score * w;
    categoryWeights[q.category] += w;
  }

  const categories = {};
  const activeCategories = [];
  for (const cat of CATEGORY_IDS) {
    if (categoryWeights[cat] > 0) {
      categories[cat] = categorySums[cat] / categoryWeights[cat];
      activeCategories.push(cat);
    } else {
      categories[cat] = null;
    }
  }

  if (activeCategories.length === 0) {
    return { overall: 0, categories, questionScores };
  }

  const normalizedWeights = normalizeImportance(viewer?.importance, activeCategories);
  let overall = 0;
  for (const cat of activeCategories) {
    overall += categories[cat] * normalizedWeights[cat];
  }

  return { overall, categories, questionScores };
}

/**
 * Detect hard or soft deal-breaker clashes between two profiles.
 */
export function detectDealBreakerClashes(user, candidate) {
  const uAns = user?.answers || {};
  const cAns = candidate?.answers || {};
  const uHard = new Set(user?.dealBreakers || []);
  const cHard = new Set(candidate?.dealBreakers || []);
  const warnings = [];

  // 1. Smoking clash: none vs yes
  if (
    (uAns.smoking === 'none' && cAns.smoking === 'yes') ||
    (uAns.smoking === 'yes' && cAns.smoking === 'none')
  ) {
    const isHard = uHard.has('smoking') || cHard.has('smoking');
    warnings.push({
      id: 'smoking',
      label: 'Smoking deal-breaker',
      isHard,
      message:
        uAns.smoking === 'none'
          ? `You don't smoke, while ${candidate.name} answered "Yes" to smoking/vaping.`
          : `${candidate.name} doesn't smoke, while you answered "Yes" to smoking/vaping.`,
    });
  }

  // 2. Overnight guests clash: never (0) vs often (2)
  if ((uAns.guests === 0 && cAns.guests === 2) || (uAns.guests === 2 && cAns.guests === 0)) {
    const isHard = uHard.has('guests') || cHard.has('guests');
    warnings.push({
      id: 'guests',
      label: 'Overnight guest clash',
      isHard,
      message:
        uAns.guests === 0
          ? `You never want overnight guests, while ${candidate.name} hosts often.`
          : `${candidate.name} wants zero overnight guests, while your room is an open hangout.`,
    });
  }

  // 3. Temperature clash: cool (0) vs warm (2)
  if (
    (uAns.temperature === 0 && cAns.temperature === 2) ||
    (uAns.temperature === 2 && cAns.temperature === 0)
  ) {
    const isHard = uHard.has('temperature') || cHard.has('temperature');
    warnings.push({
      id: 'temperature',
      label: 'AC temperature clash',
      isHard,
      message:
        uAns.temperature === 0
          ? `You prefer 18–22°C AC, while ${candidate.name} prefers 26°C+ or just a fan.`
          : `${candidate.name} prefers 18–22°C AC, while you prefer 26°C+ or just a fan.`,
    });
  }

  return warnings;
}

/**
 * Compatibility tier badge metadata.
 */
export function getCompatibilityTier(score) {
  if (score >= 85) {
    return { id: 'excellent', label: 'Excellent', color: 'emerald' };
  }
  if (score >= 70) {
    return { id: 'good', label: 'Good', color: 'indigo' };
  }
  if (score >= 55) {
    return { id: 'fair', label: 'Fair', color: 'amber' };
  }
  return { id: 'challenging', label: 'Challenging', color: 'rose' };
}

/**
 * Mutual gender preference filter.
 */
export function isGenderCompatible(personA, personB) {
  const allows = (viewer, other) => {
    const pref = viewer?.genderPreference || 'any';
    if (pref === 'any') return true;
    if (pref === 'same') {
      return Boolean(viewer?.gender && other?.gender && viewer.gender === other.gender);
    }
    return true;
  };
  return allows(personA, personB) && allows(personB, personA);
}

/**
 * Full bidirectional pair evaluation between `user` and `candidate`.
 */
export function evaluatePair(user, candidate) {
  const viewerDir = computeViewerComfort(user, candidate);
  const otherDir = computeViewerComfort(candidate, user);

  const yourRaw = viewerDir.overall;
  const theirRaw = otherDir.overall;
  const harmonicRaw =
    yourRaw + theirRaw === 0 ? 0 : (2 * yourRaw * theirRaw) / (yourRaw + theirRaw);

  const yourComfort = Math.round(yourRaw * 100);
  const theirComfort = Math.round(theirRaw * 100);
  const uncappedOverall = Math.round(harmonicRaw * 100);

  const warnings = detectDealBreakerClashes(user, candidate);
  const hasHardDealBreaker = warnings.some((w) => w.isHard);
  const overall = hasHardDealBreaker ? Math.min(uncappedOverall, 60) : uncappedOverall;

  const comfortDiff = Math.abs(yourComfort - theirComfort);
  const isLopsided = comfortDiff >= 20;
  let lopsided = null;
  if (isLopsided) {
    const adjuster = yourComfort < theirComfort ? 'you' : candidate.name;
    lopsided = {
      diff: comfortDiff,
      adjuster,
      message:
        adjuster === 'you'
          ? 'You carry more of the adjustment.'
          : `${candidate.name} carries more of the adjustment.`,
    };
  }

  // Per-category integer scores (0-100) for both directions
  const categoryBreakdown = {};
  for (const cat of CATEGORY_IDS) {
    const yScore = viewerDir.categories[cat];
    const tScore = otherDir.categories[cat];
    categoryBreakdown[cat] = {
      yourScore: yScore === null ? null : Math.round(yScore * 100),
      theirScore: tScore === null ? null : Math.round(tScore * 100),
    };
  }

  // Per-question breakdown (includes modifier questions for the comparison table)
  const questionBreakdown = QUESTIONS.map((q) => {
    const yourVal = user?.answers?.[q.id];
    const theirVal = candidate?.answers?.[q.id];
    const yourScore = viewerDir.questionScores[q.id];
    const theirScore = otherDir.questionScores[q.id];

    let pairScore = null;
    if (yourScore !== null && theirScore !== null) {
      pairScore = Math.min(yourScore, theirScore);
    } else if (q.scoring?.mode === 'modifier') {
      const normV = normalizeAnswer(q, yourVal);
      const normO = normalizeAnswer(q, theirVal);
      if (normV !== null && normO !== null) {
        pairScore = 1 - Math.abs(normV - normO);
      }
    }

    let status = 'neutral';
    if (pairScore !== null) {
      if (pairScore >= 0.8) status = 'match';
      else if (pairScore >= 0.55) status = 'close';
      else status = 'conflict';
    }

    return {
      question: q,
      yourValue: yourVal,
      theirValue: theirVal,
      yourLabel: getOptionLabel(q.id, yourVal),
      theirLabel: getOptionLabel(q.id, theirVal),
      yourScore,
      theirScore,
      pairScore,
      status,
    };
  });

  // Top 3 shared traits (highest scored non-modifier questions)
  const scoredRows = questionBreakdown.filter(
    (row) => row.question.scoring?.mode !== 'modifier' && row.pairScore !== null
  );

  const sharedTraits = [...scoredRows]
    .filter((row) => row.pairScore >= 0.75)
    .sort((a, b) => b.pairScore - a.pairScore)
    .slice(0, 3);

  const biggestDifferences = [...scoredRows]
    .filter((row) => row.pairScore < 0.85)
    .sort((a, b) => a.pairScore - b.pairScore)
    .slice(0, 3);

  return {
    candidate,
    overall,
    uncappedOverall,
    yourComfort,
    theirComfort,
    tier: getCompatibilityTier(overall),
    warnings,
    hasHardDealBreaker,
    isLopsided,
    lopsided,
    categoryBreakdown,
    questionBreakdown,
    sharedTraits,
    biggestDifferences,
  };
}

/**
 * Filter eligible candidates, evaluate all pairs, and sort deterministically:
 * overall descending -> higher min(yourComfort, theirComfort) -> alphabetical name.
 */
export function rankMatches(user, pool) {
  if (!Array.isArray(pool)) return [];

  const eligible = pool.filter(
    (candidate) => candidate && candidate.id !== user?.id && isGenderCompatible(user, candidate)
  );

  const results = eligible.map((candidate) => evaluatePair(user, candidate));

  results.sort((a, b) => {
    if (b.overall !== a.overall) return b.overall - a.overall;
    const minA = Math.min(a.yourComfort, a.theirComfort);
    const minB = Math.min(b.yourComfort, b.theirComfort);
    if (minB !== minA) return minB - minA;
    return a.candidate.name.localeCompare(b.candidate.name);
  });

  return results;
}
