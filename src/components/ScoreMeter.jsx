import { useEffect, useRef, useState } from 'react';
import { getCompatibilityTier } from '../utils/compatibility.js';

const TIER_STROKE = {
  emerald: 'stroke-emerald-500 dark:stroke-emerald-400',
  indigo: 'stroke-indigo-600 dark:stroke-indigo-400',
  amber: 'stroke-amber-500 dark:stroke-amber-400',
  rose: 'stroke-rose-500 dark:stroke-rose-400',
};

const TIER_TEXT = {
  emerald: 'text-emerald-700 dark:text-emerald-300',
  indigo: 'text-indigo-700 dark:text-indigo-300',
  amber: 'text-amber-700 dark:text-amber-300',
  rose: 'text-rose-700 dark:text-rose-300',
};

export default function ScoreMeter({ score, size = 76, strokeWidth = 6, label = 'Overall match' }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score || 0)));
  const [displayScore, setDisplayScore] = useState(clamped);
  const prevRef = useRef(clamped);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || prevRef.current === clamped) {
      setDisplayScore(clamped);
      prevRef.current = clamped;
      return undefined;
    }

    const start = prevRef.current;
    const diff = clamped - start;
    const duration = 350;
    const startTime = performance.now();
    let rafId;

    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplayScore(Math.round(start + diff * eased));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        prevRef.current = clamped;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [clamped]);

  const tier = getCompatibilityTier(clamped);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`${label}: ${clamped}% (${tier.label})`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${TIER_STROKE[tier.color]} transition-[stroke-dashoffset] duration-500 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-base font-extrabold leading-none ${TIER_TEXT[tier.color]}`}>
          {displayScore}%
        </span>
      </div>
    </div>
  );
}
