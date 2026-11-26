import { describe, expect, it } from 'vitest';
import { DEMO_PERSONA } from '../data/demoPersona.js';
import { SEED_PROFILES } from '../data/seedProfiles.js';
import { formatAgreementAsText, generateRoommateAgreement } from '../utils/agreement.js';
import { evaluatePair } from '../utils/compatibility.js';
import { buildConflictTimeline } from '../utils/timeline.js';

describe('Roommate Agreement Generator', () => {
  it('generates targeted rules from real friction points and timeline windows for Aarav', () => {
    const demoUser = { id: 'demo', ...DEMO_PERSONA.profile, ...DEMO_PERSONA };
    const aarav = SEED_PROFILES.find((p) => p.id === 'aarav-mehta');
    const match = evaluatePair(demoUser, aarav);
    const timeline = buildConflictTimeline(demoUser, aarav);

    const agreement = generateRoommateAgreement({
      userName: demoUser.name,
      match,
      timeline,
    });

    expect(agreement.isAlreadyInSync).toBe(false);
    expect(agreement.rules.length).toBeGreaterThanOrEqual(3);
    expect(agreement.rules.some((r) => r.category === 'sleep')).toBe(true);
    expect(agreement.rules.some((r) => r.category === 'cleanliness')).toBe(true);
    expect(agreement.reviewClause).toContain('14 days');

    const txt = formatAgreementAsText({
      agreement,
      userName: agreement.userName,
      candidateName: agreement.candidateName,
      rules: agreement.rules,
      customRules: [{ id: 'c1', text: 'Alternate buying water cans' }],
    });
    expect(txt).toContain('ROOMMATE HOUSE RULES AGREEMENT');
    expect(txt).toContain('Alternate buying water cans');
    expect(txt).toContain('Because:');
  });

  it('shows the friendly already-in-sync state when no friction exists', () => {
    const demoUser = { id: 'demo', ...DEMO_PERSONA.profile, ...DEMO_PERSONA };
    const twin = {
      ...SEED_PROFILES[0],
      id: 'twin',
      name: 'Twin',
      answers: { ...DEMO_PERSONA.answers },
      importance: { ...DEMO_PERSONA.importance },
      dealBreakers: [...DEMO_PERSONA.dealBreakers],
    };
    const match = evaluatePair(demoUser, twin);
    const timeline = buildConflictTimeline(demoUser, twin);
    const agreement = generateRoommateAgreement({
      userName: 'Riya',
      match,
      timeline,
    });

    expect(agreement.isAlreadyInSync).toBe(true);
    expect(agreement.rules.length).toBeGreaterThan(0);
  });

  it('includes active simulator compromises as explicit stated commitments', () => {
    const demoUser = { id: 'demo', ...DEMO_PERSONA.profile, ...DEMO_PERSONA };
    const aarav = SEED_PROFILES.find((p) => p.id === 'aarav-mehta');
    const match = evaluatePair(demoUser, aarav);
    const timeline = buildConflictTimeline(demoUser, aarav);

    const agreement = generateRoommateAgreement({
      userName: 'Riya',
      match,
      timeline,
      activeCompromises: [
        {
          id: 'c-1',
          questionId: 'screensAtNight',
          category: 'sleep',
          shortLabel: '2 AM screen habits',
          targetValue: 0,
          actorLabel: 'Aarav Mehta',
          impactLabel: '+6% overall',
        },
      ],
    });

    const simRule = agreement.rules.find((r) => r.id === 'sim-c-1');
    expect(simRule).toBeDefined();
    expect(simRule.text).toContain('Aarav Mehta agreed');
  });
});
