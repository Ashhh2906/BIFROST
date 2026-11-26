import { describe, expect, it } from 'vitest';
import { DEMO_PERSONA } from '../data/demoPersona.js';
import { SEED_PROFILES } from '../data/seedProfiles.js';
import { applyCompromises, getCompromiseSuggestions } from '../utils/simulate.js';

describe('Compromise Simulator', () => {
  it('auto-detects up to 3 compromisable questions and never includes smoking', () => {
    const demoUser = { id: 'demo', ...DEMO_PERSONA.profile, ...DEMO_PERSONA };
    const vikram = SEED_PROFILES.find((p) => p.id === 'vikram-joshi');

    const suggestionsMe = getCompromiseSuggestions(demoUser, vikram, 'me');
    const suggestionsThem = getCompromiseSuggestions(demoUser, vikram, 'them');

    expect(suggestionsMe.length).toBeLessThanOrEqual(3);
    expect(suggestionsMe.some((s) => s.questionId === 'smoking')).toBe(false);
    expect(suggestionsThem.some((s) => s.questionId === 'smoking')).toBe(false);
  });

  it('improves score/friction for Aarav without mutating stored user answers', () => {
    const demoUser = {
      id: 'demo',
      ...DEMO_PERSONA.profile,
      answers: { ...DEMO_PERSONA.answers },
      importance: { ...DEMO_PERSONA.importance },
      dealBreakers: [...DEMO_PERSONA.dealBreakers],
    };
    const originalSnapshot = JSON.stringify(demoUser.answers);
    const aarav = SEED_PROFILES.find((p) => p.id === 'aarav-mehta');

    // Check 'them' and 'both' and 'me'
    const meSuggestions = getCompromiseSuggestions(demoUser, aarav, 'me');
    const themSuggestions = getCompromiseSuggestions(demoUser, aarav, 'them');
    const bothSuggestions = getCompromiseSuggestions(demoUser, aarav, 'both');

    expect(meSuggestions.length).toBeGreaterThan(0);
    expect(themSuggestions.length).toBeGreaterThan(0);
    expect(bothSuggestions.length).toBeGreaterThan(0);

    const simResult = applyCompromises(
      demoUser,
      aarav,
      bothSuggestions,
      bothSuggestions.map((s) => s.id)
    );

    expect(simResult.hasActiveChanges).toBe(true);
    expect(simResult.simulatedMatch.overall).toBeGreaterThan(
      applyCompromises(demoUser, aarav, bothSuggestions, []).simulatedMatch.overall
    );
    expect(simResult.activeCommitments.length).toBe(bothSuggestions.length);
    // Stored answers must remain completely untouched
    expect(JSON.stringify(demoUser.answers)).toBe(originalSnapshot);
  });
});
