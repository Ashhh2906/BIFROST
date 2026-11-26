import { RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react';

const ACTOR_MODES = [
  { id: 'me', label: 'Me' },
  { id: 'them', label: 'Them' },
  { id: 'both', label: 'Both' },
];

export default function CompromisePanel({
  candidateName,
  actorMode,
  onActorModeChange,
  suggestions,
  activeIds,
  onToggleId,
  onReset,
  baseMatch,
  simulatedMatch,
  baseTimeline,
  simulatedTimeline,
}) {
  const overallDiff = simulatedMatch.overall - baseMatch.overall;
  const frictionDiff = Number(
    (baseTimeline.summary.frictionHours - simulatedTimeline.summary.frictionHours).toFixed(1)
  );
  const hasChanges = activeIds.length > 0;

  return (
    <section
      aria-label="Compromise simulator"
      className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-emerald-50/40 p-5 shadow-xs dark:border-indigo-900/70 dark:from-indigo-950/30 dark:via-slate-900 dark:to-emerald-950/20 sm:p-6"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
              What if I compromise?
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
            Test realistic habit shifts live without altering your saved quiz answers.
          </p>
        </div>

        {/* Segmented Control */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Who compromises:
          </span>
          <div
            role="group"
            aria-label="Who compromises"
            className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800"
          >
            {ACTOR_MODES.map((mode) => {
              const selected = actorMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onActorModeChange(mode.id)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    selected
                      ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {mode.id === 'them' ? candidateName.split(' ')[0] : mode.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Before -> After Metrics */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Overall Match</p>
          <p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">
            {hasChanges ? (
              <>
                <span className="text-slate-400 line-through">{baseMatch.overall}%</span>{' '}
                <span className="text-indigo-600 dark:text-indigo-400">
                  → {simulatedMatch.overall}%
                </span>{' '}
                <span
                  className={`text-xs ${
                    overallDiff >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  ({overallDiff >= 0 ? `+${overallDiff}` : overallDiff})
                </span>
              </>
            ) : (
              `${baseMatch.overall}%`
            )}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Your Comfort</p>
          <p className="mt-0.5 text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
            {hasChanges && simulatedMatch.yourComfort !== baseMatch.yourComfort
              ? `${baseMatch.yourComfort}% → ${simulatedMatch.yourComfort}%`
              : `${baseMatch.yourComfort}%`}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {candidateName.split(' ')[0]}&apos;s Comfort
          </p>
          <p className="mt-0.5 text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
            {hasChanges && simulatedMatch.theirComfort !== baseMatch.theirComfort
              ? `${baseMatch.theirComfort}% → ${simulatedMatch.theirComfort}%`
              : `${baseMatch.theirComfort}%`}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Daily Friction
          </p>
          <p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">
            {hasChanges && frictionDiff !== 0 ? (
              <>
                <span>{baseTimeline.summary.frictionHours}h</span>{' '}
                <span className="text-emerald-600 dark:text-emerald-400">
                  → {simulatedTimeline.summary.frictionHours}h
                </span>
              </>
            ) : (
              `${baseTimeline.summary.frictionHours} hrs/day`
            )}
          </p>
        </div>
      </div>

      {/* Top 3 Compromise Toggles */}
      <div className="mt-4 space-y-2.5">
        {suggestions.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-3 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              No higher-impact compromises left in this mode — try switching &ldquo;Who
              compromises&rdquo; above!
            </span>
          </div>
        ) : (
          suggestions.map((sug) => {
            const active = activeIds.includes(sug.id);
            return (
              <button
                key={sug.id}
                type="button"
                role="switch"
                aria-checked={active}
                onClick={() => onToggleId(sug.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition ${
                  active
                    ? 'border-indigo-600 bg-indigo-50/90 ring-1 ring-indigo-600 dark:border-indigo-400 dark:bg-indigo-950/60 dark:ring-indigo-400'
                    : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{sug.label}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                    {sug.deltaOverall > 0 && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        +{sug.deltaOverall}% match
                      </span>
                    )}
                    {sug.deltaYour > 0 && (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        +{sug.deltaYour}% your comfort
                      </span>
                    )}
                    {sug.deltaTheir > 0 && (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                        +{sug.deltaTheir}% their comfort
                      </span>
                    )}
                    {sug.deltaFriction > 0 && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        -{sug.deltaFriction}h friction
                      </span>
                    )}
                  </div>
                </div>

                <span
                  aria-hidden="true"
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                    active ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                      active ? 'translate-x-5.5' : 'translate-x-0.5'
                    }`}
                  />
                </span>
              </button>
            );
          })
        )}
      </div>

      {hasChanges && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-indigo-100 pt-3 dark:border-indigo-900/60">
          <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
            Active toggles will automatically be included as commitments if you generate the Roommate
            Agreement.
          </p>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset
          </button>
        </div>
      )}
    </section>
  );
}
