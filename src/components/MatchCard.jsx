import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Bookmark, Clock, Mail, Scale } from 'lucide-react';
import { getAvatarColor, getInitials, getSharedTags } from '../utils/insights.js';
import ScoreMeter from './ScoreMeter.jsx';

const TIER_PILL = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
};

export default function MatchCard({
  match,
  isShortlisted,
  onToggleShortlist,
  frictionHours = null,
  rank = null,
  onSendEmail = null,
  requestStatus = null,
}) {
  const { candidate, overall, yourComfort, theirComfort, tier, warnings, isLopsided, lopsided } =
    match;
  const sharedTags = getSharedTags(match);
  const avatarBg = getAvatarColor(candidate.id);

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700">
      <div>
        {/* Top Row: Avatar + Name + ScoreMeter */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              aria-hidden="true"
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-xs ${avatarBg}`}
            >
              {getInitials(candidate.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {rank && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    #{rank}
                  </span>
                )}
                <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">
                  {candidate.name}
                </h3>
              </div>
              <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                {candidate.course} · {candidate.year}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <ScoreMeter score={overall} size={64} strokeWidth={5} label={`Overall match with ${candidate.name}`} />
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TIER_PILL[tier.color]}`}
            >
              {tier.label}
            </span>
          </div>
        </div>

        {/* Fun bio */}
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {candidate.bio}
        </p>

        {/* Two comfort scores */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Your comfort
            </p>
            <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">
              {yourComfort}%
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Their comfort
            </p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {theirComfort}%
            </p>
          </div>
        </div>

        {/* Badges: friction hours, lopsided, warnings */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {frictionHours !== null && (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                frictionHours >= 1.5
                  ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  : frictionHours > 0
                  ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              <Clock className="h-3 w-3" aria-hidden="true" />
              {frictionHours} hrs/day friction
            </span>
          )}

          {isLopsided && (
            <span
              title={lopsided?.message}
              className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
            >
              <Scale className="h-3 w-3" aria-hidden="true" />
              Lopsided
            </span>
          )}

          {warnings.map((w) => (
            <span
              key={w.id}
              title={w.message}
              className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
            >
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              {w.label}
            </span>
          ))}
        </div>

        {/* 2 "You both..." tags */}
        {sharedTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sharedTags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5 dark:border-slate-800">
        <Link
          to={`/compare/${candidate.id}`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          Compare
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        {isShortlisted && onSendEmail && (
          <button
            type="button"
            onClick={onSendEmail}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            <span>
              {requestStatus === 'finalised'
                ? 'Finalised'
                : requestStatus
                ? 'Resend'
                : 'Email'}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onToggleShortlist(candidate.id)}
          aria-pressed={isShortlisted}
          aria-label={isShortlisted ? `Remove ${candidate.name} from shortlist` : `Shortlist ${candidate.name}`}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
            isShortlisted
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/60 dark:text-indigo-300'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Bookmark className={`h-4 w-4 ${isShortlisted ? 'fill-current' : ''}`} aria-hidden="true" />
          <span className="hidden sm:inline">{isShortlisted ? 'Saved' : 'Shortlist'}</span>
        </button>
      </div>
    </article>
  );
}
