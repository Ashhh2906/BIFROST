import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileCheck2,
  Mail,
  Plus,
  Printer,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { decodeRequestPayload } from '../utils/requestEmail.js';

export default function RequestReview() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { state, updateSentRequest, saveSentRequest, showToast } = useApp();

  const storedRequest = (state.sentRequests || []).find((r) => r.id === id);
  const decodedFromUrl = useMemo(() => {
    const token = searchParams.get('data');
    return token ? decodeRequestPayload(token) : null;
  }, [searchParams]);

  const initialRequest = storedRequest || decodedFromUrl;

  const [acceptedIds, setAcceptedIds] = useState(
    () =>
      initialRequest?.acceptedRuleIds ||
      (initialRequest?.proposedRules || []).map((r) => r.id)
  );
  const [extraRules, setExtraRules] = useState([]);
  const [newRuleText, setNewRuleText] = useState('');
  const [recipientNotes, setRecipientNotes] = useState(initialRequest?.recipientNotes || '');
  const [recipientSignature, setRecipientSignature] = useState(
    initialRequest?.recipientSignature || initialRequest?.candidateName || ''
  );
  const [localStatus, setLocalStatus] = useState(initialRequest?.status || 'sent');

  useEffect(() => {
    if (!initialRequest) return;
    setAcceptedIds(
      initialRequest.acceptedRuleIds || (initialRequest.proposedRules || []).map((r) => r.id)
    );
    setRecipientNotes(initialRequest.recipientNotes || '');
    setRecipientSignature(initialRequest.recipientSignature || initialRequest.candidateName || '');
    setLocalStatus(initialRequest.status || 'sent');
  }, [initialRequest]);

  if (!initialRequest) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Roommate Request Not Found
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          This request link may have expired or been cleared from local storage.
        </p>
        <Link
          to="/shortlist"
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
        >
          Go to Shortlist
        </Link>
      </div>
    );
  }

  const allRules = [...(initialRequest.proposedRules || []), ...extraRules];

  const toggleAccept = (ruleId) => {
    if (localStatus === 'finalised') return;
    setAcceptedIds((prev) =>
      prev.includes(ruleId) ? prev.filter((item) => item !== ruleId) : [...prev, ruleId]
    );
  };

  const handleAddRecipientRule = (e) => {
    e.preventDefault();
    const trimmed = newRuleText.trim();
    if (!trimmed) return;
    const rule = {
      id: `recip-${Date.now()}`,
      category: 'custom',
      title: `Condition added by ${initialRequest.candidateName}`,
      text: trimmed,
      reason: 'Added during recipient review',
    };
    setExtraRules((prev) => [...prev, rule]);
    setAcceptedIds((prev) => [...prev, rule.id]);
    setNewRuleText('');
  };

  const persistStatus = (nextStatus) => {
    setLocalStatus(nextStatus);
    const patch = {
      status: nextStatus,
      acceptedRuleIds: acceptedIds,
      proposedRules: allRules,
      recipientNotes,
      recipientSignature: recipientSignature.trim() || initialRequest.candidateName,
      finalisedAt: nextStatus === 'finalised' ? new Date().toISOString() : undefined,
    };

    if (storedRequest) {
      updateSentRequest(initialRequest.id, patch);
    } else {
      saveSentRequest({ ...initialRequest, ...patch });
    }
  };

  const handleFinalise = () => {
    persistStatus('finalised');
    showToast(`Roommate Agreement finalised with ${initialRequest.senderName}!`);
  };

  const handleDecline = () => {
    persistStatus('declined');
    showToast('Request marked as declined');
  };

  const formatFinalAgreementText = () => {
    const agreedRules = allRules.filter((r) => acceptedIds.includes(r.id));
    const lines = [
      '====================================================',
      '        FINALISED ROOMMATE AGREEMENT & REQUEST      ',
      '====================================================',
      `Roommates: ${initialRequest.senderName} & ${initialRequest.candidateName}`,
      `Compatibility Score: ${initialRequest.overallScore}%`,
      `Status: ${localStatus.toUpperCase()}`,
      '',
      '[ SENDER LIFESTYLE CONDITIONS & PREFERENCES ]',
    ];

    if (initialRequest.conditions?.hardDealBreakers?.length > 0) {
      lines.push(
        `Hard Deal-Breakers: ${initialRequest.conditions.hardDealBreakers
          .map((d) => d.label)
          .join(', ')}`
      );
    }

    for (const cat of initialRequest.conditions?.preferencesByCategory || []) {
      lines.push(`- ${cat.categoryLabel} (Priority ${cat.importance}/5)`);
      for (const item of cat.items) {
        if (item.valueLabel && item.valueLabel !== '—') {
          lines.push(`  • ${item.label}: ${item.valueLabel}`);
        }
      }
    }

    lines.push('');
    lines.push('[ AGREED HOUSE RULES ]');
    for (const r of agreedRules) {
      lines.push(`- ${r.title}: ${r.text}`);
    }

    if (recipientNotes.trim()) {
      lines.push('');
      lines.push(`Recipient Notes (${initialRequest.candidateName}): ${recipientNotes.trim()}`);
    }

    lines.push('');
    lines.push(`Signed: ${initialRequest.senderName}  &  ${recipientSignature || initialRequest.candidateName}`);
    return lines.join('\n');
  };

  const handleCopyAgreement = async () => {
    try {
      await navigator.clipboard.writeText(formatFinalAgreementText());
      showToast('Finalised agreement copied to clipboard');
    } catch {
      showToast('Copy failed — use Download .txt instead');
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([formatFinalAgreementText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finalised-agreement-${initialRequest.candidateName.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Downloaded agreement (.txt)');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/shortlist"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to Shortlist &amp; Requests
        </Link>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
            localStatus === 'finalised'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              : localStatus === 'declined'
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
              : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
          }`}
        >
          {localStatus === 'finalised'
            ? 'Agreement Finalised'
            : localStatus === 'declined'
            ? 'Declined'
            : 'Pending Recipient Review'}
        </span>
      </div>

      {/* Request Summary Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Mail className="h-4 w-4" aria-hidden="true" />
              Roommate Request &amp; Agreement Review
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              {initialRequest.senderName} → {initialRequest.candidateName}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              From: {initialRequest.senderEmail || initialRequest.senderName}
              {initialRequest.senderCourse ? ` · ${initialRequest.senderCourse}` : ''} · To:{' '}
              {initialRequest.candidateEmail}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-center dark:border-indigo-800 dark:bg-indigo-950/50">
            <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
              Compatibility
            </p>
            <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {initialRequest.overallScore}%
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              {initialRequest.yourComfort}% / {initialRequest.theirComfort}%
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm whitespace-pre-line text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
          {initialRequest.message}
        </div>
      </section>

      {/* Sender's Lifestyle Conditions & Preferences */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
          {initialRequest.senderName}&apos;s Lifestyle Conditions &amp; Preferences
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Review the sender&apos;s daily habits, category priorities, and non-negotiable deal-breakers
          before accepting.
        </p>

        {initialRequest.conditions?.hardDealBreakers?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {initialRequest.conditions.hardDealBreakers.map((db) => (
              <span
                key={db.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
              >
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                Hard Deal-Breaker: {db.label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(initialRequest.conditions?.preferencesByCategory || []).map((cat) => (
            <div
              key={cat.categoryId}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  {cat.categoryLabel}
                </h3>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  Priority {cat.importance}/5
                </span>
              </div>
              <dl className="space-y-1.5 text-xs">
                {cat.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-2">
                    <dt className="text-slate-500 dark:text-slate-400">{item.label}</dt>
                    <dd className="text-right font-semibold text-slate-800 dark:text-slate-200">
                      {item.valueLabel}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* Proposed Conditions Checklist & Agreement Finalisation */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Roommate Agreement Conditions Review
          </h2>
        </div>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {localStatus === 'finalised'
            ? 'These conditions have been accepted and locked into your finalised Roommate Agreement.'
            : 'Toggle each proposed condition to accept it, add any counter-conditions, and finalise below.'}
        </p>

        <div className="mt-4 space-y-2.5">
          {allRules.map((rule) => {
            const accepted = acceptedIds.includes(rule.id);
            return (
              <button
                key={rule.id}
                type="button"
                disabled={localStatus === 'finalised'}
                onClick={() => toggleAccept(rule.id)}
                aria-pressed={accepted}
                className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3.5 text-left transition ${
                  accepted
                    ? 'border-emerald-300 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/20'
                    : 'border-slate-200 bg-slate-50 opacity-65 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{rule.title}</p>
                  <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">{rule.text}</p>
                  {rule.reason && (
                    <p className="mt-1.5 inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {rule.reason}
                    </p>
                  )}
                </div>

                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                    accepted
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {accepted ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" /> Accepted
                    </>
                  ) : (
                    'Needs Talk'
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {localStatus !== 'finalised' && (
          <form onSubmit={handleAddRecipientRule} className="no-print mt-3 flex gap-2">
            <label htmlFor="recip-custom-rule" className="sr-only">
              Add recipient condition
            </label>
            <input
              id="recip-custom-rule"
              type="text"
              value={newRuleText}
              onChange={(e) => setNewRuleText(e.target.value)}
              placeholder={`Add a condition from ${initialRequest.candidateName}...`}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add
            </button>
          </form>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="recip-notes"
              className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Recipient notes / comments
            </label>
            <textarea
              id="recip-notes"
              rows={2}
              disabled={localStatus === 'finalised'}
              value={recipientNotes}
              onChange={(e) => setRecipientNotes(e.target.value)}
              placeholder="e.g., Sounds super fair — happy to use headphones after 10 PM!"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="recip-signature"
              className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Recipient signature name
            </label>
            <input
              id="recip-signature"
              type="text"
              disabled={localStatus === 'finalised'}
              value={recipientSignature}
              onChange={(e) => setRecipientSignature(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Finalise or Export Actions */}
        {localStatus === 'finalised' ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                Roommate Agreement Finalised between {initialRequest.senderName} &amp;{' '}
                {recipientSignature || initialRequest.candidateName}
              </div>
              <div className="no-print flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyAgreement}
                  className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copy
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" /> .txt
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden="true" /> Print / PDF
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-print mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={handleDecline}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300"
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              Decline
            </button>
            <button
              type="button"
              onClick={handleFinalise}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Accept &amp; Finalise Roommate Agreement
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
