import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../data/questions.js';
import { SEED_PROFILES, validateSeedProfiles } from '../data/seedProfiles.js';
import { DEMO_PERSONA } from '../data/demoPersona.js';
import {
  computeViewerComfort,
  evaluatePair,
  getCompatibilityTier,
  isGenderCompatible,
  normalizeImportance,
  rankMatches,
  scoreQuestionForViewer,
} from '../utils/compatibility.js';

describe('Seed profile validation', () => {
  it('has 12 valid seed profiles with all 17 answers in range', () => {
    expect(SEED_PROFILES).toHaveLength(12);
    expect(validateSeedProfiles(SEED_PROFILES)).toEqual([]);
  });
});

describe('Asymmetric compatibility engine', () => {
  it('returns 100 overall when two people have identical answers', () => {
    const user = {
      id: 'u1',
      name: 'Alex',
      gender: 'male',
      genderPreference: 'any',
      answers: { ...SEED_PROFILES[0].answers },
      importance: { ...SEED_PROFILES[0].importance },
      dealBreakers: [],
    };
    const clone = { ...SEED_PROFILES[0], id: 'clone', name: 'Clone', dealBreakers: [] };
    const result = evaluatePair(user, clone);
    expect(result.yourComfort).toBe(100);
    expect(result.theirComfort).toBe(100);
    expect(result.overall).toBe(100);
    expect(result.tier.label).toBe('Excellent');
  });

  it('produces strong asymmetry between a messy viewer and a neat roommate', () => {
    const messyViewer = {
      id: 'messy',
      name: 'Messy',
      answers: {
        ...DEMO_PERSONA.answers,
        tidiness: 1,
        cleaningFrequency: 2,
        dishesLaundry: 2,
        messTolerance: 5,
      },
      importance: { sleep: 3, study: 3, cleanliness: 4, social: 3 },
      dealBreakers: [],
    };
    const neatRoommate = {
      id: 'neat',
      name: 'Neat',
      answers: {
        ...DEMO_PERSONA.answers,
        tidiness: 5,
        cleaningFrequency: 0,
        dishesLaundry: 0,
        messTolerance: 1,
      },
      importance: { sleep: 3, study: 3, cleanliness: 5, social: 3 },
      dealBreakers: [],
    };

    const pair = evaluatePair(messyViewer, neatRoommate);
    expect(pair.categoryBreakdown.cleanliness.yourScore).toBeGreaterThanOrEqual(85);
    expect(pair.categoryBreakdown.cleanliness.theirScore).toBeLessThanOrEqual(35);
    expect(pair.isLopsided).toBe(true);
  });

  it('caps overall score at 60 when either person marks a clashing deal-breaker as hard', () => {
    const nonSmoker = {
      id: 'u-ns',
      name: 'NonSmoker',
      answers: { ...DEMO_PERSONA.answers, smoking: 'none' },
      importance: { sleep: 1, study: 1, cleanliness: 1, social: 1 },
      dealBreakers: ['smoking'],
    };
    const identicalSmoker = {
      id: 'u-sm',
      name: 'Smoker',
      answers: { ...DEMO_PERSONA.answers, smoking: 'yes' },
      importance: { sleep: 5, study: 5, cleanliness: 5, social: 1 },
      dealBreakers: [],
    };

    const result = evaluatePair(nonSmoker, identicalSmoker);
    expect(result.warnings.some((w) => w.id === 'smoking' && w.isHard)).toBe(true);
    expect(result.uncappedOverall).toBeGreaterThan(60);
    expect(result.overall).toBe(60);
  });

  it('applies mutual gender preference filtering and excludes self', () => {
    const user = {
      id: 'ananya-rao',
      name: 'User',
      gender: 'female',
      genderPreference: 'any',
      answers: DEMO_PERSONA.answers,
      importance: DEMO_PERSONA.importance,
      dealBreakers: [],
    };
    const sameMale = { id: 'm1', name: 'M1', gender: 'male', genderPreference: 'same' };
    const anyFemale = { id: 'f1', name: 'F1', gender: 'female', genderPreference: 'any' };
    const sameFemale = { id: 'f2', name: 'F2', gender: 'female', genderPreference: 'same' };

    expect(isGenderCompatible(user, sameMale)).toBe(false);
    expect(isGenderCompatible(user, anyFemale)).toBe(true);
    expect(isGenderCompatible(user, sameFemale)).toBe(true);

    const ranked = rankMatches(user, SEED_PROFILES);
    expect(ranked.some((r) => r.candidate.id === 'ananya-rao')).toBe(false);
    expect(ranked.some((r) => r.candidate.id === 'siddharth-kulkarni')).toBe(false);
  });

  it('sorts deterministically by overall desc, then min(comfort), then name', () => {
    const baseAnswers = { ...DEMO_PERSONA.answers };
    const user = {
      id: 'u',
      name: 'User',
      gender: 'female',
      genderPreference: 'any',
      answers: baseAnswers,
      importance: { sleep: 4, cleanliness: 4, study: 3, social: 2 },
      dealBreakers: [],
    };
    const pB = {
      id: 'b',
      name: 'Bravo',
      gender: 'female',
      genderPreference: 'any',
      answers: { ...baseAnswers },
      importance: { sleep: 4, cleanliness: 4, study: 3, social: 2 },
      dealBreakers: [],
    };
    const pA = {
      id: 'a',
      name: 'Alpha',
      gender: 'female',
      genderPreference: 'any',
      answers: { ...baseAnswers },
      importance: { sleep: 4, cleanliness: 4, study: 3, social: 2 },
      dealBreakers: [],
    };

    const ranked = rankMatches(user, [pB, pA]);
    expect(ranked.map((r) => r.candidate.name)).toEqual(['Alpha', 'Bravo']);
  });

  it('handles missing answers gracefully without NaN', () => {
    const partialUser = {
      id: 'partial',
      name: 'Partial',
      gender: 'female',
      genderPreference: 'any',
      answers: { bedtime: 0 },
      importance: {},
      dealBreakers: [],
    };
    const emptyUser = {
      id: 'empty',
      name: 'Empty',
      answers: {},
    };

    const pair1 = evaluatePair(partialUser, SEED_PROFILES[0]);
    const pair2 = evaluatePair(emptyUser, SEED_PROFILES[0]);
    expect(Number.isNaN(pair1.overall)).toBe(false);
    expect(Number.isNaN(pair1.yourComfort)).toBe(false);
    expect(Number.isNaN(pair2.overall)).toBe(false);
    expect(pair2.overall).toBe(0);
  });

  it('normalizes importance weights properly and defaults missing importance', () => {
    const weights = normalizeImportance({ sleep: 10, cleanliness: 10, study: 0, social: 0 });
    expect(weights.sleep).toBeCloseTo(0.5);
    expect(weights.cleanliness).toBeCloseTo(0.5);
    expect(weights.study).toBe(0);

    const defaults = normalizeImportance(undefined);
    const sum = Object.values(defaults).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
  });

  it('computes circular studyTime distance so after-midnight and early-morning are adjacent', () => {
    const studyTimeQ = QUESTIONS.find((q) => q.id === 'studyTime');
    const scoreAdjacent = scoreQuestionForViewer(
      studyTimeQ,
      { studyTime: 0 },
      { studyTime: 3 }
    );
    const scoreOpposite = scoreQuestionForViewer(
      studyTimeQ,
      { studyTime: 0 },
      { studyTime: 2 }
    );
    expect(scoreAdjacent).toBeCloseTo(0.5);
    expect(scoreOpposite).toBeCloseTo(0);
  });

  it('maps compatibility tiers accurately', () => {
    expect(getCompatibilityTier(90).label).toBe('Excellent');
    expect(getCompatibilityTier(75).label).toBe('Good');
    expect(getCompatibilityTier(60).label).toBe('Fair');
    expect(getCompatibilityTier(40).label).toBe('Challenging');
  });

  it('satisfies core demo persona scoring invariants', () => {
    const demoUser = { id: 'demo-user', ...DEMO_PERSONA.profile, ...DEMO_PERSONA };
    const ranked = rankMatches(demoUser, SEED_PROFILES);

    // Top match >= 85
    expect(ranked[0].overall).toBeGreaterThanOrEqual(85);

    // Aarav between 60 and 78, yourComfort at least 20 below theirComfort
    const aarav = ranked.find((r) => r.candidate.id === 'aarav-mehta');
    expect(aarav).toBeDefined();
    expect(aarav.overall).toBeGreaterThanOrEqual(60);
    expect(aarav.overall).toBeLessThanOrEqual(78);
    expect(aarav.theirComfort - aarav.yourComfort).toBeGreaterThanOrEqual(20);

    // At least one match has hard deal-breaker warning and capped score <= 60
    const cappedMatch = ranked.find((r) => r.hasHardDealBreaker);
    expect(cappedMatch).toBeDefined();
    expect(cappedMatch.overall).toBeLessThanOrEqual(60);

    // Sanity check computeViewerComfort directly
    const viewerComfort = computeViewerComfort(demoUser, SEED_PROFILES[0]);
    expect(viewerComfort.overall).toBeGreaterThan(0.85);
  });
});
