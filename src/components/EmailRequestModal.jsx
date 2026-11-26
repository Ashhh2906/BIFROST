import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Copy,
  ExternalLink,
  Mail,
  Plus,
  Send,
  ShieldAlert,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { runAiHelperTurn } from '../utils/aiHelper.js';
import {
  buildDefaultEmailRequest,
  buildMailtoHref,
  encodeRequestPayload,
  formatFullRequestEmail,
} from '../utils/requestEmail.js';
import Modal from './Modal.jsx';

export default function EmailRequestModal({
  isOpen,
  onClose,
  user,
  match,
  timeline,
  existingRequest = null,
}) {
  const { saveSentRequest, showToast, openAiHelper } = useApp();

  const initial = useMemo(
    () => buildDefaultEmailRequest({ user, match, timeline }),
    [user, match, timeline]
  );

  const [recipientEmail, setRecipientEmail] = useState(initial.recipientEmail);
  const [senderEmail, setSenderEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState(initial.subject);
  const [message, setMessage] = useState(initial.message);
  const [proposedRules, setProposedRules] = useState(initial.proposedRules);
  const [customCondition, setCustomCondition] = useState('');
  const [savedRequestId, setSavedRequestId] = useState(existingRequest?.id || null);

  useEffect(() => {
    if (!isOpen) return;
    if (existingRequest) {
      setRecipientEmail(existingRequest.candidateEmail || initial.recipientEmail);
      setSenderEmail(existingRequest.senderEmail || user?.email || '');
      setSubject(existingRequest.subject || initial.subject);
      setMessage(existingRequest.message || initial.message);
      setProposedRules(existingRequest.proposedRules || initial.proposedRules);
      setSavedRequestId(existingRequest.id);
    } else {
      setRecipientEmail(initial.recipientEmail);
      setSenderEmail(user?.email || '');
      setSubject(initial.subject);
      setMessage(initial.message);
      setProposedRules(initial.proposedRules);
      setSavedRequestId(null);
    }
  }, [isOpen, existingRequest, initial, user?.email]);

  const toggleRuleIncluded = (ruleId) => {
    setProposedRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, included: !r.included } : r))
    );
  };

  const handleAddCondition = (e) => {
    e.preventDefault();
    const trimmed = customCondition.trim();
    if (!trimmed) return;
    setProposedRules((prev) => [
      ...prev,
      {
        id: `custom-cond-${Date.now()}`,
        category: 'custom',
        title: 'Sender Condition',
        text: trimmed,
        reason: 'Added by sender in roommate request',
        included: true,
      },
    ]);
    setCustomCondition('');
  };

  const handleAiPolish = () => {
    const aiResult = runAiHelperTurn({
      message: `Draft a roommate request email for ${match.candidate.name}`,
      route: '/shortlist',
      currentUser: user,
      answeredCount: 17,
      matches: [match],
      shortlist: [match.candidate.id],
      activeCandidateId: match.candidate.id,
    });
    if (aiResult.draft) {
      setSubject(aiResult.draft.subject || subject);
      setMessage(aiResult.draft.body || message);
      showToast('AI Helper updated your email draft');
    }
  };

  const persistRequest = () => {
    const reqId = savedRequestId || `req-${match.candidate.id}-${Date.now()}`;
    const payload = {
      id: reqId,
      candidateId: match.candidate.id,
      candidateName: match.candidate.name,
      candidateCourse: match.candidate.course,
      candidateYear: match.candidate.year,
      candidateEmail: recipientEmail.trim(),
      senderName: user?.name?.trim() || 'Student',
      senderEmail: senderEmail.trim(),
      senderCourse: user?.course || '',
      senderYear: user?.year || '',
      overallScore: match.overall,
      yourComfort: match.yourComfort,
      theirComfort: match.theirComfort,
      subject: subject.trim(),
      message: message.trim(),
      conditions: initial.conditions,
      proposedRules: proposedRules.filter((r) => r.included),
      status: existingRequest?.status || 'sent',
      acceptedRuleIds:
        existingRequest?.acceptedRuleIds ||
        proposedRules.filter((r) => r.included).map((r) => r.id),
      recipientNotes: existingRequest?.recipientNotes || '',
      recipientSignature: existingRequest?.recipientSignature || '',
      createdAt: existingRequest?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveSentRequest(payload);
    setSavedRequestId(reqId);
    return payload;
  };

  const buildShareLink = (reqObj) => {
    const token = encodeRequestPayload(reqObj);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/request/${reqObj.id}?data=${token}`;
  };

  const handleSendViaEmailClient = () => {
    const saved = persistRequest();
    const reviewUrl = buildShareLink(saved);
    const fullBody = formatFullRequestEmail({
      senderName: saved.senderName,
      senderEmail: saved.senderEmail,
      candidateName: saved.candidateName,
      message: saved.message,
      conditions: saved.conditions,
      proposedRules: saved.proposedRules,
      reviewUrl,
    });
    const href = buildMailtoHref({
      to: saved.candidateEmail,
      subject: saved.subject,
      body: fullBody,
    });
    window.location.href = href;
  };

  const handleSaveAndCopy = async () => {
    const saved = persistRequest();
    const reviewUrl = buildShareLink(saved);
    const fullBody = formatFullRequestEmail({
      senderName: saved.senderName,
      senderEmail: saved.senderEmail,
      candidateName: saved.candidateName,
      message: saved.message,
      conditions: saved.conditions,
      proposedRules: saved.proposedRules,
      reviewUrl,
    });
    try {
      await navigator.clipboard.writeText(`To: ${saved.candidateEmail}\nSubject: ${saved.subject}\n\n${fullBody}`);
      showToast('Request saved & full email + conditions copied!');
    } catch {
      showToast('Request saved! Click "Open Recipient Review" to preview.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Send Roommate Request to ${match.candidate.name}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Email Fields */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="req-to-email"
              className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Recipient email
            </label>
            <input
              id="req-to-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="req-from-email"
              className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Your reply-to email
            </label>
            <input
              id="req-from-email"
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="you@campus.edu"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="req-subject"
            className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Subject
          </label>
          <input
            id="req-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="req-message"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Personal message
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAiPolish}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
              >
                <Wand2 className="h-3 w-3" aria-hidden="true" />
                AI Draft Note
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAiHelper(`Help me refine my roommate request email for ${match.candidate.name}`, match.candidate.id);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Sparkles className="h-3 w-3 text-indigo-500" aria-hidden="true" />
                Ask AI Helper
              </button>
            </div>
          </div>
          <textarea
            id="req-message"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs leading-relaxed text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Sender Lifestyle Conditions & Preferences Included */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Your Lifestyle Conditions &amp; Preferences Attached to Request
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {match.candidate.name} will see these conditions in the email and interactive agreement
            review page.
          </p>

          {initial.conditions.hardDealBreakers.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {initial.conditions.hardDealBreakers.map((db) => (
                <span
                  key={db.id}
                  className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                >
                  <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                  Hard Deal-Breaker: {db.label}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {initial.conditions.preferencesByCategory.map((cat) => (
              <div
                key={cat.categoryId}
                className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="mb-1.5 flex items-center justify-between font-bold text-slate-800 dark:text-slate-100">
                  <span>{cat.categoryLabel}</span>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                    Priority {cat.importance}/5
                  </span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {cat.items.slice(0, 3).map((item) => (
                    <li key={item.id} className="flex justify-between gap-2">
                      <span className="text-slate-500 dark:text-slate-400">{item.label}:</span>
                      <span className="text-right font-medium">{item.valueLabel}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Selectable Proposed Roommate Agreement Rules */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              Proposed Roommate Agreement Conditions ({proposedRules.filter((r) => r.included).length} selected)
            </p>
            <div className="space-y-2">
              {proposedRules.map((rule) => (
                <button
                  key={rule.id}
                  type="button"
                  role="checkbox"
                  aria-checked={rule.included}
                  onClick={() => toggleRuleIncluded(rule.id)}
                  className={`flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left text-xs transition ${
                    rule.included
                      ? 'border-indigo-300 bg-white dark:border-indigo-700 dark:bg-slate-900'
                      : 'border-slate-200 bg-slate-100/60 opacity-60 dark:border-slate-800 dark:bg-slate-900/40'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      rule.included
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-400 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {rule.included && <Check className="h-3 w-3" />}
                  </span>
                  <span>
                    <span className="block font-bold text-slate-900 dark:text-white">
                      {rule.title}
                    </span>
                    <span className="block text-slate-600 dark:text-slate-300">{rule.text}</span>
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleAddCondition} className="mt-2.5 flex gap-2">
              <label htmlFor="custom-req-condition" className="sr-only">
                Add custom condition
              </label>
              <input
                id="custom-req-condition"
                type="text"
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                placeholder="Add another condition (e.g., No food on desks overnight)..."
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div>
            {savedRequestId && (
              <Link
                to={`/request/${savedRequestId}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Preview Recipient Review &amp; Finalise Agreement
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveAndCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Save &amp; Copy Email
            </button>
            <button
              type="button"
              onClick={handleSendViaEmailClient}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 dark:bg-indigo-500"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              Send Request &amp; Open Email App
              <Send className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
