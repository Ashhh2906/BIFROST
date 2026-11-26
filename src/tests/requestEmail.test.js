import { describe, expect, it } from 'vitest';
import { DEMO_PERSONA } from '../data/demoPersona.js';
import { SEED_PROFILES } from '../data/seedProfiles.js';
import { evaluatePair } from '../utils/compatibility.js';
import {
  buildDefaultEmailRequest,
  buildMailtoHref,
  buildSenderConditions,
  decodeRequestPayload,
  encodeRequestPayload,
  formatFullRequestEmail,
  getCandidateEmail,
} from '../utils/requestEmail.js';
import { buildConflictTimeline } from '../utils/timeline.js';

describe('Shortlist Email Request & Sender Conditions', () => {
  const demoUser = { id: 'demo', ...DEMO_PERSONA.profile, ...DEMO_PERSONA };
  const aarav = SEED_PROFILES.find((p) => p.id === 'aarav-mehta');
  const match = evaluatePair(demoUser, aarav);
  const timeline = buildConflictTimeline(demoUser, aarav);

  it('derives campus emails and extracts sender lifestyle conditions & deal-breakers', () => {
    expect(getCandidateEmail(aarav)).toBe('aarav.mehta@campus.edu');

    const conditions = buildSenderConditions(demoUser);
    expect(conditions.hardDealBreakers).toHaveLength(1);
    expect(conditions.hardDealBreakers[0].id).toBe('smoking');
    expect(conditions.preferencesByCategory).toHaveLength(4);
    expect(conditions.preferencesByCategory[0].items.length).toBeGreaterThanOrEqual(4);
  });

  it('builds email request defaults with proposed rules and formats mailto body', () => {
    const req = buildDefaultEmailRequest({ user: demoUser, match, timeline });
    expect(req.recipientEmail).toBe('aarav.mehta@campus.edu');
    expect(req.subject).toContain('Riya Verma');
    expect(req.proposedRules.length).toBeGreaterThanOrEqual(3);

    const fullBody = formatFullRequestEmail({
      senderName: demoUser.name,
      senderEmail: demoUser.email,
      candidateName: aarav.name,
      message: req.message,
      conditions: req.conditions,
      proposedRules: req.proposedRules,
      reviewUrl: 'http://localhost:5173/request/123',
    });

    expect(fullBody).toContain("Riya Verma'S LIFESTYLE CONDITIONS & PREFERENCES");
    expect(fullBody).toContain('Hard Deal-Breakers:');
    expect(fullBody).toContain('Proposed Roommate Agreement Conditions:');
    expect(fullBody).toContain('http://localhost:5173/request/123');

    const mailto = buildMailtoHref({
      to: req.recipientEmail,
      subject: req.subject,
      body: fullBody,
    });
    expect(mailto.startsWith('mailto:aarav.mehta%40campus.edu?')).toBe(true);
  });

  it('round-trips shareable recipient review payloads cleanly', () => {
    const sample = {
      id: 'req-1',
      senderName: 'Riya Verma',
      candidateName: 'Aarav Mehta',
      overallScore: 67,
      proposedRules: [{ id: 'r1', title: 'Quiet Hours', text: 'Headphones after 10 PM' }],
    };
    const token = encodeRequestPayload(sample);
    expect(token.length).toBeGreaterThan(10);
    const decoded = decodeRequestPayload(token);
    expect(decoded).toEqual(sample);
  });
});
