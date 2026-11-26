import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  Copy,
  FileText,
  Mail,
  MessageCircle,
  Scale,
  Sparkles,
} from 'lucide-react';
import { SEED_PROFILES } from '../data/seedProfiles.js';
import { useApp } from '../context/AppContext.jsx';
import { evaluatePair } from '../utils/compatibility.js';
import {
  buildComparisonSummary,
  buildIntroMessage,
  getAvatarColor,
  getInitials,
} from '../utils/insights.js';
import { applyCompromises, getCompromiseSuggestions } from '../utils/simulate.js';
import { buildConflictTimeline } from '../utils/timeline.js';
import AgreementModal from '../components/AgreementModal.jsx';
import ComparisonTable from '../components/ComparisonTable.jsx';
import CompromisePanel from '../components/CompromisePanel.jsx';
import EmailRequestModal from '../components/EmailRequestModal.jsx';
import Modal from '../components/Modal.jsx';
import RadarChart from '../components/RadarChart.jsx';
import ScoreMeter from '../components/ScoreMeter.jsx';
import Timeline from '../components/Timeline.jsx';

export default function Compare() {
  const { id } = useParams();
  const { state, currentUser, answeredCount, toggleShortlist, showToast, openAiHelper } = useApp();

  const [agreementOpen, setAgreementOpen] = useState(false);
  const [sayHiOpen, setSayHiOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [actorMode, setActorMode] = useState('me');
  const [activeIds, setActiveIds] = useState([]);
  const [introText, setIntroText] = useState('');

  const candidate = SEED_PROFILES.find((p) => p.id === id);

  // Reset simulator state when switching candidates
  useEffect(() => {
    setActiveIds([]);
    setActorMode('me');
  }, [id]);

  const baseMatch = useMemo(() => {
    if (!candidate || answeredCount === 0) return null;
    return evaluatePair(currentUser, candidate);
  }, [currentUser, candidate, answeredCount]);

  const baseTimeline = useMemo(() => {
    if (!candidate || answeredCount === 0) return null;
    return buildConflictTimeline(currentUser, candidate);
  }, [currentUser, candidate, answeredCount]);

  const suggestions = useMemo(() => {
    if (!candidate || answeredCount === 0) return [];
    return getCompromiseSuggestions(currentUser, candidate, actorMode);
  }, [currentUser, candidate, answeredCount, actorMode]);

  const simulation = useMemo(() => {
    if (!candidate || answeredCount === 0) return null;
    return applyCompromises(currentUser, candidate, suggestions, activeIds);
  }, [currentUser, candidate, answeredCount, suggestions, activeIds]);

  const handleActorModeChange = (nextMode) => {
    setActorMode(nextMode);
    setActiveIds([]);
  };

  const handleToggleSuggestion = (sugId) => {
    setActiveIds((prev) =>
      prev.includes(sugId) ? prev.filter((item) => item !== sugId) : [...prev, sugId]
    );
  };

  if (!candidate) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Roommate profile not found
        </h1>
        <Link
          to="/results"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to matches
        </Link>
      </div>
    );
  }

  if (answeredCount === 0 || !baseMatch || !baseTimeline || !simulation) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Answer the quiz first
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Complete the quick scenario quiz or click &ldquo;Try demo&rdquo; on the home page to
          compare yourself with {candidate.name}.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          Go to Home
        </Link>
      </div>
    );
  }

  const displayMatch = simulation.simulatedMatch;
  const displayTimeline = simulation.simulatedTimeline;
  const isShortlisted = state.shortlist.includes(candidate.id);
  const summarySentence = buildComparisonSummary(displayMatch, displayTimeline.summary);

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summarySentence);
      showToast('Comparison summary copied');
    } catch {
      showToast('Unable to copy automatically');
    }
  };

  const handleOpenSayHi = () => {
    setIntroText(buildIntroMessage(currentUser.name, displayMatch, displayTimeline.summary));
    setSayHiOpen(true);
  };

  const handleCopyIntro = async () => {
    try {
      await navigator.clipboard.writeText(introText);
      showToast('Intro message copied — paste in WhatsApp or email!');
    } catch {
      showToast('Select the message text to copy');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="no-print">
        <Link
          to="/results"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to matches
        </Link>
      </div>

      {/* Header */}
      <section className="no-print rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        {simulation.hasActiveChanges && (
          <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200">
            <span>
              Live Compromise Preview active — showing simulated scores &amp; timeline (saved quiz
              answers unchanged).
            </span>
            <button
              type="button"
              onClick={() => setActiveIds([])}
              className="underline hover:no-underline"
            >
              Reset
            </button>
          </div>
        )}

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex items-center -space-x-3">
              <div
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white bg-indigo-600 text-sm font-bold text-white shadow-xs dark:border-slate-900"
              >
                {getInitials(currentUser.name)}
              </div>
              <div
                aria-hidden="true"
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white text-sm font-bold shadow-xs dark:border-slate-900 ${getAvatarColor(
                  candidate.id
                )}`}
              >
                {getInitials(candidate.name)}
              </div>
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
                {currentUser.name} &amp; {candidate.name}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {candidate.course} · {candidate.year}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{candidate.bio}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <ScoreMeter
              score={displayMatch.overall}
              size={86}
              strokeWidth={7}
              label="Pair overall score"
            />
            <div className="space-y-1.5 text-sm">
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                Your comfort with {candidate.name}:{' '}
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                  {displayMatch.yourComfort}%
                </span>
              </p>
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                {candidate.name}&apos;s comfort with you:{' '}
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  {displayMatch.theirComfort}%
                </span>
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAgreementOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700 dark:bg-indigo-500"
                >
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  Generate Roommate Agreement
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isShortlisted) toggleShortlist(candidate.id);
                    setEmailOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  Send Email Request
                </button>
                <button
                  type="button"
                  onClick={handleOpenSayHi}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Say hi
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openAiHelper(
                      `Why is ${candidate.name} scored this way and what should I put in our agreement?`,
                      candidate.id
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Ask AI
                </button>
                <button
                  type="button"
                  onClick={() => toggleShortlist(candidate.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    isShortlisted
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  <Bookmark
                    className={`h-3.5 w-3.5 ${isShortlisted ? 'fill-current' : ''}`}
                    aria-hidden="true"
                  />
                  {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {(displayMatch.isLopsided || displayMatch.warnings.length > 0) && (
          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            {displayMatch.isLopsided && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                <Scale className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Lopsided pairing ({displayMatch.lopsided.diff}-point gap):{' '}
                  {displayMatch.lopsided.message}
                </span>
              </div>
            )}
            {displayMatch.warnings.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {w.isHard ? 'Hard Deal-Breaker (score capped at 60%): ' : 'Heads-up: '}
                  {w.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Auto-generated summary + Copy summary */}
      <section className="no-print flex flex-col justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-slate-800 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-slate-200 sm:flex-row sm:items-center">
        <p className="leading-relaxed">{summarySentence}</p>
        <button
          type="button"
          onClick={handleCopySummary}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-300"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          Copy summary
        </button>
      </section>

      {/* Live Compromise Simulator */}
      <div className="no-print">
        <CompromisePanel
          candidateName={candidate.name}
          actorMode={actorMode}
          onActorModeChange={handleActorModeChange}
          suggestions={suggestions}
          activeIds={activeIds}
          onToggleId={handleToggleSuggestion}
          onReset={() => setActiveIds([])}
          baseMatch={baseMatch}
          simulatedMatch={displayMatch}
          baseTimeline={baseTimeline}
          simulatedTimeline={displayTimeline}
        />
      </div>

      {/* 24-Hour Conflict Timeline */}
      <div className="no-print">
        <Timeline timeline={displayTimeline} />
      </div>

      {/* Radar Chart */}
      <div className="no-print">
        <RadarChart categoryBreakdown={displayMatch.categoryBreakdown} candidateName={candidate.name} />
      </div>

      {/* Category Bars & Question-by-Question Table */}
      <div className="no-print">
        <ComparisonTable
          categoryBreakdown={displayMatch.categoryBreakdown}
          questionBreakdown={displayMatch.questionBreakdown}
          candidateName={candidate.name}
        />
      </div>

      {/* Roommate Agreement Modal */}
      <AgreementModal
        isOpen={agreementOpen}
        onClose={() => setAgreementOpen(false)}
        userName={currentUser.name}
        match={displayMatch}
        timeline={displayTimeline}
        activeCompromises={simulation.activeCommitments}
        onToast={showToast}
      />

      {/* Email Request Modal */}
      <EmailRequestModal
        isOpen={emailOpen}
        onClose={() => setEmailOpen(false)}
        user={currentUser}
        match={displayMatch}
        timeline={displayTimeline}
        existingRequest={(state.sentRequests || []).find((r) => r.candidateId === candidate.id) || null}
      />

      {/* Say Hi Intro Modal */}
      <Modal
        isOpen={sayHiOpen}
        onClose={() => setSayHiOpen(false)}
        title={`Say hi to ${candidate.name}`}
        maxWidth="max-w-lg"
      >
        <p className="mb-3 text-xs text-slate-600 dark:text-slate-300">
          Copy and customize this icebreaker to send over WhatsApp, Discord, or campus email (no
          real messages are sent from this demo app).
        </p>
        <label htmlFor="say-hi-textarea" className="sr-only">
          Intro message
        </label>
        <textarea
          id="say-hi-textarea"
          rows={4}
          value={introText}
          onChange={(e) => setIntroText(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setSayHiOpen(false)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleCopyIntro}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 dark:bg-indigo-500"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copy message
          </button>
        </div>
      </Modal>
    </div>
  );
}
