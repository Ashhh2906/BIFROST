import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldAlert, Sliders } from 'lucide-react';
import { CATEGORIES, DEAL_BREAKER_OPTIONS } from '../data/questions.js';
import { useApp } from '../context/AppContext.jsx';

const IMPORTANCE_LABELS = {
  1: 'Chill / Low',
  2: 'Mild',
  3: 'Moderate',
  4: 'High',
  5: 'Crucial',
};

export default function Importance() {
  const { state, setImportance, toggleDealBreaker } = useApp();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
          <Sliders className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            What Matters Most to You?
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Weight each category and flag any non-negotiable deal-breakers.
          </p>
        </div>
      </div>

      {/* Category Importance Sliders */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">
          Category Priorities
        </h2>
        <div className="space-y-5">
          {CATEGORIES.map((cat) => {
            const val = state.importance[cat.id] ?? 3;
            const sliderId = `imp-${cat.id}`;
            return (
              <div key={cat.id}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label
                    htmlFor={sliderId}
                    className="text-sm font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {cat.label}
                  </label>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {val} / 5 · {IMPORTANCE_LABELS[val]}
                  </span>
                </div>
                <input
                  id={sliderId}
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={val}
                  onChange={(e) => setImportance(cat.id, Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Hard Deal-Breakers */}
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-500" aria-hidden="true" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Hard Deal-Breakers
          </h2>
        </div>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          When enabled, an opposite clash in these areas caps the match score at 60% and displays a
          prominent warning.
        </p>

        <div className="space-y-2.5">
          {DEAL_BREAKER_OPTIONS.map((db) => {
            const checked = state.dealBreakers.includes(db.id);
            return (
              <button
                key={db.id}
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => toggleDealBreaker(db.id)}
                className={`flex w-full items-center justify-between gap-4 rounded-xl border p-3.5 text-left transition ${
                  checked
                    ? 'border-rose-500 bg-rose-50/70 dark:border-rose-600 dark:bg-rose-950/40'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">
                    {db.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                    {db.description}
                  </span>
                </div>
                <span
                  aria-hidden="true"
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                    checked ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                      checked ? 'translate-x-5.5' : 'translate-x-0.5'
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/quiz')}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Quiz
        </button>

        <button
          type="button"
          onClick={() => navigate('/results')}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          See My Matches
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
