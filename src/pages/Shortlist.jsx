import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bookmark, CheckCircle2, ExternalLink, Mail, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { buildConflictTimeline } from '../utils/timeline.js';
import EmailRequestModal from '../components/EmailRequestModal.jsx';
import MatchCard from '../components/MatchCard.jsx';

export default function Shortlist() {
  const { state, currentUser, matches, toggleShortlist, openAiHelper } = useApp();
  const [emailTarget, setEmailTarget] = useState(null);

  const shortlistedMatches = matches.filter((m) => state.shortlist.includes(m.candidate.id));
  const sentRequests = state.sentRequests || [];

  const getLatestRequestFor = (candidateId) =>
    sentRequests.find((r) => r.candidateId === candidateId) || null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
            Shortlisted Roommates &amp; Requests
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Send an email request with your lifestyle conditions attached, or let the recipient
            review and finalise a Roommate Agreement.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openAiHelper('Draft a roommate request email for my shortlist')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AI Draft Request
          </button>
          <Link
            to="/results"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Back to all matches
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {shortlistedMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Bookmark className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Your shortlist is empty
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Click &ldquo;Shortlist&rdquo; on any match card to save promising roommates and send them
            a roommate request email.
          </p>
          <Link
            to="/results"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
          >
            Browse matches
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shortlistedMatches.map((match) => {
            const timeline = buildConflictTimeline(currentUser, match.candidate);
            const req = getLatestRequestFor(match.candidate.id);
            return (
              <MatchCard
                key={match.candidate.id}
                match={match}
                frictionHours={timeline.summary.frictionHours}
                isShortlisted
                onToggleShortlist={toggleShortlist}
                requestStatus={req?.status || null}
                onSendEmail={() => setEmailTarget({ match, timeline, existingRequest: req })}
              />
            );
          })}
        </div>
      )}

      {/* Sent Requests & Conditions Review Tracker */}
      {sentRequests.length > 0 && (
        <section
          aria-label="Sent roommate requests"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Sent Roommate Requests ({sentRequests.length})
            </h2>
          </div>

          <div className="space-y-3">
            {sentRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {req.candidateName}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ({req.candidateEmail})
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        req.status === 'finalised'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : req.status === 'declined'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {req.status === 'finalised' && (
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      )}
                      {req.status === 'finalised'
                        ? 'Agreement Finalised'
                        : req.status === 'declined'
                        ? 'Declined'
                        : 'Awaiting Review'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {req.proposedRules?.length || 0} condition(s) attached · {req.overallScore}%
                    match
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/request/${req.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 dark:bg-indigo-500"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    {req.status === 'finalised'
                      ? 'View Finalised Agreement'
                      : 'Review as Recipient & Finalise'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {emailTarget && (
        <EmailRequestModal
          isOpen={Boolean(emailTarget)}
          onClose={() => setEmailTarget(null)}
          user={currentUser}
          match={emailTarget.match}
          timeline={emailTarget.timeline}
          existingRequest={emailTarget.existingRequest}
        />
      )}
    </div>
  );
}
