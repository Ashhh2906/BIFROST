import { describe, expect, it } from 'vitest';
import { DEMO_PERSONA } from '../data/demoPersona.js';
import { SEED_PROFILES } from '../data/seedProfiles.js';
import { rankMatches } from '../utils/compatibility.js';
import { getSuggestedPrompts, runAiHelperTurn } from '../utils/aiHelper.js';

describe('AI Helper Agent', () => {
  const demoUser = { id: 'demo', ...DEMO_PERSONA.profile, ...DEMO_PERSONA };
  const matches = rankMatches(demoUser, SEED_PROFILES);

  it('provides navigation guidance and actions', () => {
    const res = runAiHelperTurn({
      message: 'Open shortlist please',
      route: '/results',
      currentUser: demoUser,
      answeredCount: 17,
      matches,
      shortlist: ['ananya-rao'],
    });
    expect(res.actions.some((a) => a.type === 'navigate' && a.to === '/shortlist')).toBe(true);
  });

  it('audits preferences and recommends actionable priority/deal-breaker refinements', () => {
    const res = runAiHelperTurn({
      message: 'Audit my preferences',
      route: '/importance',
      currentUser: demoUser,
      answeredCount: 17,
      matches,
      shortlist: [],
    });
    expect(res.reply).toContain('light sleeper');
    expect(res.actions.some((a) => a.type === 'setImportance' && a.categoryId === 'sleep')).toBe(
      true
    );
  });

  it('supports direct priority refinement commands', () => {
    const res = runAiHelperTurn({
      message: 'Set cleanliness priority to 5',
      route: '/importance',
      currentUser: demoUser,
      answeredCount: 17,
      matches,
    });
    expect(res.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'setImportance',
          categoryId: 'cleanliness',
          value: 5,
        }),
      ])
    );
  });

  it('drafts tailored roommate request emails and agreement clauses', () => {
    const emailTurn = runAiHelperTurn({
      message: 'Draft a roommate request email for Aarav',
      route: '/shortlist',
      currentUser: demoUser,
      answeredCount: 17,
      matches,
      shortlist: ['aarav-mehta'],
    });
    expect(emailTurn.draft).toBeDefined();
    expect(emailTurn.draft.subject).toContain('Riya Verma');
    expect(emailTurn.draft.body).toContain('Aarav Mehta');

    const agreementTurn = runAiHelperTurn({
      message: 'Draft custom agreement rules for Aarav',
      route: '/compare/aarav-mehta',
      currentUser: demoUser,
      answeredCount: 17,
      matches,
      activeCandidateId: 'aarav-mehta',
    });
    expect(agreementTurn.draft).toBeDefined();
    expect(agreementTurn.draft.body).toContain('Because:');
  });

  it('adapts suggested prompts to the active page', () => {
    const emptyPrompts = getSuggestedPrompts({ route: '/', hasAnswers: false });
    expect(emptyPrompts.some((p) => p.toLowerCase().includes('demo'))).toBe(true);

    const comparePrompts = getSuggestedPrompts({
      route: '/compare/aarav-mehta',
      activeCandidateName: 'Aarav Mehta',
      hasAnswers: true,
    });
    expect(comparePrompts.some((p) => p.includes('Aarav Mehta'))).toBe(true);
  });
});
