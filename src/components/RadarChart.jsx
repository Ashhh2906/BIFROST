import { CATEGORIES } from '../data/questions.js';

/**
 * Custom inline SVG 4-axis radar chart showing bidirectional comfort across
 * Sleep, Study, Cleanliness, and Social.
 */
export default function RadarChart({ categoryBreakdown, candidateName }) {
  const size = 300;
  const center = size / 2;
  const maxRadius = 96;
  const axes = CATEGORIES;
  const rings = [25, 50, 75, 100];

  const getPoint = (axisIndex, valuePct) => {
    const angle = (Math.PI * 2 * axisIndex) / axes.length - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, valuePct ?? 0)) / 100) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const toPolygonPoints = (key) =>
    axes
      .map((cat, idx) => {
        const val = categoryBreakdown?.[cat.id]?.[key] ?? 0;
        const pt = getPoint(idx, val);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');

  const summaryText = axes
    .map((cat) => {
      const y = categoryBreakdown?.[cat.id]?.yourScore ?? 'N/A';
      const t = categoryBreakdown?.[cat.id]?.theirScore ?? 'N/A';
      return `${cat.shortLabel}: you ${y}%, ${candidateName} ${t}%`;
    })
    .join('; ');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Asymmetric Comfort Radar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Two overlaid shapes show where one person adjusts more than the other.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            Your comfort with {candidateName}
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            {candidateName}&apos;s comfort with you
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-64 w-full max-w-[320px] sm:h-72"
          role="img"
          aria-label={`Compatibility radar chart comparing comfort by category. ${summaryText}`}
        >
          <desc>{summaryText}</desc>

          {/* Concentric grid polygons */}
          {rings.map((ring) => {
            const pts = axes
              .map((_, idx) => {
                const pt = getPoint(idx, ring);
                return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
              })
              .join(' ');
            return (
              <polygon
                key={ring}
                points={pts}
                fill="none"
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="1"
              />
            );
          })}

          {/* Axis spokes & labels */}
          {axes.map((cat, idx) => {
            const end = getPoint(idx, 100);
            const labelPt = getPoint(idx, 126);
            const yScore = categoryBreakdown?.[cat.id]?.yourScore ?? 0;
            const tScore = categoryBreakdown?.[cat.id]?.theirScore ?? 0;
            return (
              <g key={cat.id}>
                <line
                  x1={center}
                  y1={center}
                  x2={end.x}
                  y2={end.y}
                  className="stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="1"
                />
                <text
                  x={labelPt.x}
                  y={labelPt.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-slate-700 text-[11px] font-semibold dark:fill-slate-200"
                >
                  {cat.shortLabel}
                </text>
                <text
                  x={labelPt.x}
                  y={labelPt.y + 13}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-slate-500 text-[10px] dark:fill-slate-400"
                >
                  {yScore}% / {tScore}%
                </text>
              </g>
            );
          })}

          {/* Candidate's comfort polygon */}
          <polygon
            points={toPolygonPoints('theirScore')}
            className="fill-emerald-500/20 stroke-emerald-500 dark:fill-emerald-400/20 dark:stroke-emerald-400"
            strokeWidth="2.2"
          />

          {/* Your comfort polygon */}
          <polygon
            points={toPolygonPoints('yourScore')}
            className="fill-indigo-600/20 stroke-indigo-600 dark:fill-indigo-400/20 dark:stroke-indigo-400"
            strokeWidth="2.2"
          />

          {/* Data vertices */}
          {axes.map((cat, idx) => {
            const yPt = getPoint(idx, categoryBreakdown?.[cat.id]?.yourScore ?? 0);
            const tPt = getPoint(idx, categoryBreakdown?.[cat.id]?.theirScore ?? 0);
            return (
              <g key={`${cat.id}-dots`}>
                <circle
                  cx={tPt.x}
                  cy={tPt.y}
                  r="3.5"
                  className="fill-emerald-500 dark:fill-emerald-400"
                />
                <circle
                  cx={yPt.x}
                  cy={yPt.y}
                  r="3.5"
                  className="fill-indigo-600 dark:fill-indigo-400"
                />
              </g>
            );
          })}
        </svg>
      </div>
      <p className="sr-only">{summaryText}</p>
    </div>
  );
}
