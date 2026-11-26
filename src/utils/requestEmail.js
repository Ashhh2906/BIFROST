import { CATEGORIES, DEAL_BREAKER_OPTIONS, QUESTIONS, getOptionLabel } from '../data/questions.js';
import { generateRoommateAgreement } from './agreement.js';

/**
 * Derive a realistic default campus email for seed profiles.
 */
export function getCandidateEmail(candidate) {
  if (candidate?.email) return candidate.email;
  const slug = String(candidate?.name || 'student')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return `${slug}@campus.edu`;
}

/**
 * Extract structured sender lifestyle conditions & preferences for a roommate request
 * so the recipient can review exact habits, deal-breakers, and proposed house rules.
 */
export function buildSenderConditions(user) {
  const answers = user?.answers || {};
  const importance = user?.importance || {};
  const dealBreakers = new Set(user?.dealBreakers || []);

  const preferencesByCategory = CATEGORIES.map((cat) => {
    const items = QUESTIONS.filter((q) => q.category === cat.id).map((q) => ({
      id: q.id,
      label: q.shortLabel,
      valueLabel: getOptionLabel(q.id, answers[q.id]),
    }));

    return {
      categoryId: cat.id,
      categoryLabel: cat.label,
      importance: importance[cat.id] ?? 3,
      items,
    };
  });

  const hardDealBreakers = DEAL_BREAKER_OPTIONS.filter((db) => dealBreakers.has(db.id)).map(
    (db) => ({
      id: db.id,
      label: db.label,
      description: db.description,
    })
  );

  return {
    preferencesByCategory,
    hardDealBreakers,
  };
}

/**
 * Build default email subject, body, and selectable condition clauses for a shortlisted match.
 */
export function buildDefaultEmailRequest({ user, match, timeline }) {
  const senderName = user?.name?.trim() || 'A fellow student';
  const senderCourse = [user?.course, user?.year].filter(Boolean).join(', ');
  const candidateName = match.candidate.name;
  const recipientEmail = getCandidateEmail(match.candidate);
  const agreement = generateRoommateAgreement({
    userName: senderName,
    match,
    timeline,
  });

  const proposedRules = agreement.rules.map((rule) => ({
    id: rule.id,
    category: rule.category,
    title: rule.title,
    text: rule.text,
    reason: rule.reason,
    included: true,
  }));

  const frictionSummary =
    timeline?.summary?.frictionHours > 0
      ? `Our 24-hour schedules overlap with about ${timeline.summary.frictionHours} hrs/day of potential friction, so I've included a few clear house-rule conditions below for you to review.`
      : `Our 24-hour schedules show 0 hrs/day of major sleep/study conflict and ${timeline?.summary?.syncSleepHours ?? 0} hrs/day of synced sleep!`;

  const subject = `Roommate Request from ${senderName} (${match.overall}% Match · Roommate Finder)`;

  const message = [
    `Hi ${candidateName},`,
    '',
    `I'm ${senderName}${senderCourse ? ` (${senderCourse})` : ''}, and I shortlisted you on Roommate Finder! We scored ${match.overall}% overall (my comfort with you: ${match.yourComfort}%, your comfort with me: ${match.theirComfort}%).`,
    '',
    frictionSummary,
    '',
    `I've attached my lifestyle preferences, hard deal-breakers, and proposed house rules so you can review them upfront and accept or adjust them into a Roommate Agreement.`,
    '',
    `Let me know if you'd like to grab coffee or review the agreement link!`,
    '',
    `Best,`,
    senderName,
  ].join('\n');

  return {
    recipientEmail,
    subject,
    message,
    conditions: buildSenderConditions(user),
    proposedRules,
    agreementSummary: agreement,
  };
}

/**
 * Format the complete email body (personal note + lifestyle conditions + proposed rules + review link)
 * for mailto: links and clipboard copy.
 */
export function formatFullRequestEmail({
  senderName,
  senderEmail,
  candidateName,
  message,
  conditions,
  proposedRules,
  reviewUrl,
}) {
  const lines = [message.trim(), ''];
  lines.push('--------------------------------------------------');
  lines.push(`${senderName}'S LIFESTYLE CONDITIONS & PREFERENCES`);
  lines.push('--------------------------------------------------');

  if (conditions?.hardDealBreakers?.length > 0) {
    lines.push('Hard Deal-Breakers:');
    for (const db of conditions.hardDealBreakers) {
      lines.push(`  • ${db.label}`);
    }
    lines.push('');
  }

  for (const cat of conditions?.preferencesByCategory || []) {
    lines.push(`${cat.categoryLabel} (Priority ${cat.importance}/5):`);
    for (const item of cat.items) {
      if (item.valueLabel && item.valueLabel !== '—') {
        lines.push(`  • ${item.label}: ${item.valueLabel}`);
      }
    }
    lines.push('');
  }

  const activeRules = (proposedRules || []).filter((r) => r.included !== false);
  if (activeRules.length > 0) {
    lines.push('Proposed Roommate Agreement Conditions:');
    for (const r of activeRules) {
      lines.push(`  • ${r.title}: ${r.text}`);
    }
    lines.push('');
  }

  if (reviewUrl) {
    lines.push(`Review & Finalise Roommate Agreement with ${candidateName}:`);
    lines.push(reviewUrl);
    lines.push('');
  }

  if (senderEmail) {
    lines.push(`Reply to: ${senderEmail}`);
  }

  return lines.join('\n');
}

/**
 * Build a mailto: href cleanly.
 */
export function buildMailtoHref({ to, subject, body }) {
  const params = new URLSearchParams({
    subject: subject || '',
    body: body || '',
  });
  return `mailto:${encodeURIComponent(to || '')}?${params.toString()}`;
}

/**
 * Encode/decode a portable request payload for shareable recipient review links.
 */
export function encodeRequestPayload(requestObj) {
  try {
    const json = JSON.stringify(requestObj);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
}

export function decodeRequestPayload(encoded) {
  try {
    if (!encoded) return null;
    let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}
