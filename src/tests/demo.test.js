import { describe, expect, it } from 'vitest';
import { DEMO_PERSONA } from '../data/demoPersona.js';
import { SEED_PROFILES } from '../data/seedProfiles.js';
import { rankMatches } from '../utils/compatibility.js';
import { applyCompromises, getCompromiseSuggestions } from '../utils/simulate.js';
import { buildConflictTimeline } from '../utils/timeline.js';

describe('Hackathon Demo Invariants', () => {
  const demoUser = {
    id: 'demo-user',
    ...DEMO_PERSONA.profile,
    answers: DEMO_PERSONA.answers,
    importance: DEMO_PERSONA.importance,
    dealBreakers: DEMO_PERSONA.dealBreakers,
  };
  const ranked = rankMatches(demoUser, SEED_PROFILES);

  it('(a) top match scores 85+ with little or no timeline friction', () => {
    const top = ranked[0];
    const timeline = buildConflictTimeline(demoUser, top.candidate);
    expect(top.overall).toBeGreaterThanOrEqual(85);
    expect(timeline.summary.frictionHours).toBeLessThanOrEqual(0.5);
  });

  it('(b) Aarav scores 60–78, has yourComfort >= 20 below theirComfort, and >= 1.5h RED timeline window', () => {
    const aaravMatch = ranked.find((m) => m.candidate.id === 'aarav-mehta');
    expect(aaravMatch).toBeDefined();
    expect(aaravMatch.overall).toBeGreaterThanOrEqual(60);
    expect(aaravMatch.overall).toBeLessThanOrEqual(78);
    expect(aaravMatch.theirComfort - aaravMatch.yourComfort).toBeGreaterThanOrEqual(20);

    const timeline = buildConflictTimeline(demoUser, aaravMatch.candidate);
    const hasRed15 = timeline.conflictWindows.some(
      (w) => w.zone === 'red' && w.durationHours >= 1.5
    );
    expect(hasRed15).toBe(true);
  });

  it('(c) at least one match shows a hard deal-breaker warning with capped score <= 60', () => {
    const hardMatch = ranked.find((m) => m.hasHardDealBreaker);
    expect(hardMatch).toBeDefined();
    expect(hardMatch.warnings.some((w) => w.isHard)).toBe(true);
    expect(hardMatch.overall).toBeLessThanOrEqual(60);
  });

  it('(d) compromise simulator produces visible improvement for Aarav', () => {
    const aaravMatch = ranked.find((m) => m.candidate.id === 'aarav-mehta');
    const suggestions = getCompromiseSuggestions(demoUser, aaravMatch.candidate, 'me');
    expect(suggestions.length).toBeGreaterThan(0);

    const sim = applyCompromises(
      demoUser,
      aaravMatch.candidate,
      suggestions,
      suggestions.map((s) => s.id)
    );
    expect(sim.simulatedMatch.overall).toBeGreaterThan(aaravMatch.overall);
  });
});
