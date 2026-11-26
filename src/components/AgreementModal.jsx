import { useEffect, useState } from 'react';
import { Check, Copy, Download, FileText, Plus, Printer, Trash2 } from 'lucide-react';
import { formatAgreementAsText, generateRoommateAgreement } from '../utils/agreement.js';
import Modal from './Modal.jsx';

export default function AgreementModal({
  isOpen,
  onClose,
  userName,
  match,
  timeline,
  activeCompromises = [],
  onToast,
}) {
  const [agreement, setAgreement] = useState(() =>
    generateRoommateAgreement({ userName, match, timeline, activeCompromises })
  );
  const [editableUserName, setEditableUserName] = useState(userName || 'You');
  const [editableCandidateName, setEditableCandidateName] = useState(match.candidate.name);
  const [rules, setRules] = useState(agreement.rules);
  const [customInput, setCustomInput] = useState('');
  const [customRules, setCustomRules] = useState([]);

  // Re-initialize when opening or when match/compromises change
  useEffect(() => {
    if (!isOpen) return;
    const fresh = generateRoommateAgreement({
      userName,
      match,
      timeline,
      activeCompromises,
    });
    setAgreement(fresh);
    setEditableUserName(fresh.userName);
    setEditableCandidateName(fresh.candidateName);
    setRules(fresh.rules);
  }, [isOpen, userName, match, timeline, activeCompromises]);

  const toggleRule = (ruleId) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, accepted: !r.accepted } : r))
    );
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    const text = customInput.trim();
    if (!text) return;
    setCustomRules((prev) => [...prev, { id: `custom-${Date.now()}`, text }]);
    setCustomInput('');
  };

  const handleDownloadTxt = () => {
    const content = formatAgreementAsText({
      agreement,
      userName: editableUserName,
      candidateName: editableCandidateName,
      rules,
      customRules,
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roommate-agreement-${editableCandidateName.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onToast?.('Downloaded Roommate Agreement (.txt)');
  };

  const handleCopyText = async () => {
    const content = formatAgreementAsText({
      agreement,
      userName: editableUserName,
      candidateName: editableCandidateName,
      rules,
      customRules,
    });
    try {
      await navigator.clipboard.writeText(content);
      onToast?.('Copied Roommate Agreement to clipboard');
    } catch {
      onToast?.('Copy failed — use Download .txt instead');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Roommate House Rules Agreement"
      maxWidth="max-w-3xl"
      printRoot
    >
      {/* Print-safe header */}
      <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900 dark:bg-indigo-950/40 print:border-slate-300 print:bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400 print:text-slate-900" aria-hidden="true" />
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white print:text-slate-900">
              House Rules &amp; Move-In Agreement
            </h3>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700 shadow-xs dark:bg-slate-800 dark:text-indigo-300 print:border print:border-slate-300 print:text-slate-900">
            {agreement.overallScore}% Match
          </span>
        </div>

        {/* Editable names */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="agr-user-name"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Roommate 1 (You)
            </label>
            <input
              id="agr-user-name"
              type="text"
              value={editableUserName}
              onChange={(e) => setEditableUserName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white print:border-0 print:px-0"
            />
          </div>
          <div>
            <label
              htmlFor="agr-cand-name"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Roommate 2
            </label>
            <input
              id="agr-cand-name"
              type="text"
              value={editableCandidateName}
              onChange={(e) => setEditableCandidateName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white print:border-0 print:px-0"
            />
          </div>
        </div>
      </div>

      {agreement.isAlreadyInSync && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
          You two are already in sync! Here&apos;s a lightweight starter checklist just to keep
          things smooth from day one.
        </div>
      )}

      {/* Rules grouped by category */}
      <div className="space-y-5">
        {agreement.categoryOrder.map((catId) => {
          const catRules = rules.filter((r) => r.category === catId);
          if (catRules.length === 0) return null;

          return (
            <section key={catId} className="print-break-inside-avoid">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {agreement.categoryTitles[catId]}
              </h4>
              <div className="space-y-2.5">
                {catRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`rounded-xl border p-3.5 transition ${
                      rule.accepted
                        ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/60 print:border-slate-300 print:bg-white'
                        : 'no-print border-dashed border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white print:text-slate-900">
                          {rule.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-200 print:text-slate-800">
                          {rule.text}
                        </p>
                        <p className="mt-2 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300 print:bg-slate-100 print:text-slate-700">
                          Because: {rule.reason}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleRule(rule.id)}
                        aria-pressed={rule.accepted}
                        className={`no-print inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                          rule.accepted
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {rule.accepted ? (
                          <>
                            <Check className="h-3.5 w-3.5" aria-hidden="true" /> Included
                          </>
                        ) : (
                          'Dismissed'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Custom Rules */}
        {customRules.length > 0 && (
          <section className="print-break-inside-avoid">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Custom House Rules
            </h4>
            <div className="space-y-2">
              {customRules.map((cr) => (
                <div
                  key={cr.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                >
                  <span>{cr.text}</span>
                  <button
                    type="button"
                    aria-label="Remove custom rule"
                    onClick={() => setCustomRules((prev) => prev.filter((item) => item.id !== cr.id))}
                    className="no-print text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Add Custom Rule Input */}
        <form onSubmit={handleAddCustom} className="no-print flex gap-2">
          <label htmlFor="custom-rule-input" className="sr-only">
            Add a custom house rule
          </label>
          <input
            id="custom-rule-input"
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Add a custom rule (e.g., Split milk & water jug delivery weekly)..."
            className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add
          </button>
        </form>

        {/* Review Clause & Signatures */}
        <div className="print-break-inside-avoid rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50 print:bg-white">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 print:text-slate-800">
            {agreement.reviewClause}
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="border-t border-slate-300 pt-2 text-xs text-slate-600 dark:border-slate-600 dark:text-slate-400">
              Signature — {editableUserName} · Date: __________
            </div>
            <div className="border-t border-slate-300 pt-2 text-xs text-slate-600 dark:border-slate-600 dark:text-slate-400">
              Signature — {editableCandidateName} · Date: __________
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="no-print mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
        <button
          type="button"
          onClick={handleCopyText}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          Copy text
        </button>
        <button
          type="button"
          onClick={handleDownloadTxt}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Download .txt
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 dark:bg-indigo-500"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden="true" />
          Print / Save as PDF
        </button>
      </div>
    </Modal>
  );
}
