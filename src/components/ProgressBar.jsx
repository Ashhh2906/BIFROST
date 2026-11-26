export default function ProgressBar({ current, total, label }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
        <span>{label}</span>
        <span>
          {current} / {total} ({pct}%)
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      >
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
