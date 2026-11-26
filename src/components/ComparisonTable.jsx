import { CATEGORIES } from '../data/questions.js';

const STATUS_BADGE = {
  match: {
    label: 'Match',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  },
  close: {
    label: 'Close',
    classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  conflict: {
    label: 'Conflict',
    classes: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  },
  neutral: {
    label: 'Info',
    classes: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
};

export default function ComparisonTable({ categoryBreakdown, questionBreakdown, candidateName }) {
  return (
    <div className="space-y-5">
      {CATEGORIES.map((cat) => {
        const scores = categoryBreakdown?.[cat.id] || { yourScore: 0, theirScore: 0 };
        const rows = questionBreakdown.filter((r) => r.question.category === cat.id);

        return (
          <section
            key={cat.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5"
          >
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{cat.label}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{cat.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:w-80">
                <div>
                  <div className="mb-1 flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                    <span>Your comfort</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {scores.yourScore ?? '—'}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-400"
                      style={{ width: `${scores.yourScore ?? 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                    <span className="truncate">{candidateName}&apos;s</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {scores.theirScore ?? '—'}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300 dark:bg-emerald-400"
                      style={{ width: `${scores.theirScore ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="pb-2 pr-3">Habit</th>
                    <th className="pb-2 pr-3">You</th>
                    <th className="pb-2 pr-3">{candidateName}</th>
                    <th className="pb-2 text-right">Alignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {rows.map((row) => {
                    const badge = STATUS_BADGE[row.status] || STATUS_BADGE.neutral;
                    const isModifier = row.question.scoring?.mode === 'modifier';
                    return (
                      <tr key={row.question.id} className="align-top">
                        <td className="py-2.5 pr-3 font-medium text-slate-800 dark:text-slate-200">
                          {row.question.shortLabel}
                          {isModifier && (
                            <span className="ml-1.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              Sensitivity
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-slate-600 dark:text-slate-300">
                          {row.yourLabel}
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-slate-600 dark:text-slate-300">
                          {row.theirLabel}
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.classes}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
