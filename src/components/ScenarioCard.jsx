import { Check } from 'lucide-react';

export default function ScenarioCard({ question, value, onChange, index }) {
  const headingId = `q-${question.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition dark:border-slate-800 dark:bg-slate-900 sm:p-6"
    >
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Scenario {index + 1} · {question.shortLabel}
          </span>
          {value !== undefined && value !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Check className="h-3 w-3" aria-hidden="true" /> Answered
            </span>
          )}
        </div>
        <h2 id={headingId} className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
          {question.prompt}
        </h2>
        {question.note && (
          <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            {question.note}
          </p>
        )}
      </div>

      <div
        role="radiogroup"
        aria-labelledby={headingId}
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
      >
        {question.options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(question.id, opt.value)}
              className={`group flex items-start gap-3 rounded-xl border p-3.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-600 dark:border-indigo-400 dark:bg-indigo-950/50 dark:ring-indigo-400'
                  : 'border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-indigo-700 dark:hover:bg-slate-800'
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-500'
                    : 'border-slate-300 bg-white group-hover:border-indigo-400 dark:border-slate-600 dark:bg-slate-900'
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm font-semibold ${
                    isSelected
                      ? 'text-indigo-950 dark:text-indigo-100'
                      : 'text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {opt.label}
                </span>
                {opt.hint && (
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                    {opt.hint}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
