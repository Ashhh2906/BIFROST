import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Filter, RotateCcw, Sparkles, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { buildConflictTimeline } from '../utils/timeline.js';
import MatchCard from '../components/MatchCard.jsx';

export default function Results() {
  const { state, currentUser, matches, answeredCount, isQuizComplete, toggleShortlist, loadDemoPersona } =
    useApp();
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'name'
  const [minScore, setMinScore] = useState(0);
  const [courseFilter, setCourseFilter] = useState('all');
  const [hideWarnings, setHideWarnings] = useState(false);

  const courses = useMemo(() => {
    const unique = new Set(matches.map((m) => m.candidate.course).filter(Boolean));
    return Array.from(unique).sort();
  }, [matches]);

  const filteredMatches = useMemo(() => {
    const list = matches.filter((m) => {
      if (m.overall < minScore) return false;
      if (courseFilter !== 'all' && m.candidate.course !== courseFilter) return false;
      if (hideWarnings && m.warnings.length > 0) return false;
      return true;
    });

    if (sortBy === 'name') {
      return [...list].sort((a, b) => a.candidate.name.localeCompare(b.candidate.name));
    }
    return list;
  }, [matches, minScore, courseFilter, hideWarnings, sortBy]);

  const hasActiveFilters = minScore > 0 || courseFilter !== 'all' || hideWarnings || sortBy !== 'score';

  const resetFilters = () => {
    setSortBy('score');
    setMinScore(0);
    setCourseFilter('all');
    setHideWarnings(false);
  };

  if (answeredCount === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          No quiz answers yet
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Answer our 2-minute scenario quiz or load the sample demo persona to see ranked matches.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/profile"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
          >
            Find my roommate
          </Link>
          <button
            type="button"
            onClick={loadDemoPersona}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <Zap className="h-4 w-4 text-amber-500" aria-hidden="true" />
            Try demo
          </button>
        </div>
      </div>
    );
  }

  const topFive = filteredMatches.slice(0, 5);
  const remaining = filteredMatches.slice(5);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          {state.isDemo && (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Demo Mode: Riya Verma (Early sleeper · Light sleeper · Tidy · Non-smoker)
            </div>
          )}
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
            Your Roommate Matches
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Ranked by harmonic mean of <strong>your comfort with them</strong> and{' '}
            <strong>their comfort with you</strong>.
            {!isQuizComplete && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                (Partial quiz —{' '}
                <Link to="/quiz" className="underline">
                  finish all questions
                </Link>{' '}
                for full accuracy.)
              </span>
            )}
          </p>
        </div>

        <Link
          to="/importance"
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Adjust priorities &amp; deal-breakers
        </Link>
      </div>

      {/* Filters & Sorting Bar */}
      <section
        aria-label="Filter and sort matches"
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            Filter &amp; Sort ({filteredMatches.length} of {matches.length} shown)
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Reset filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div>
            <label
              htmlFor="sort-select"
              className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Sort by
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="score">Best match (overall score)</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="course-select"
              className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Course
            </label>
            <select
              id="course-select"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">All courses</option>
              {courses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <label htmlFor="min-score-slider">Minimum match score</label>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{minScore}%</span>
            </div>
            <input
              id="min-score-slider"
              type="range"
              min={0}
              max={90}
              step={5}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>

          <div className="flex items-center">
            <button
              type="button"
              role="switch"
              aria-checked={hideWarnings}
              onClick={() => setHideWarnings((prev) => !prev)}
              className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                hideWarnings
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              <span>Hide matches with warnings</span>
              <span
                aria-hidden="true"
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                  hideWarnings ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                    hideWarnings ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </section>

      {filteredMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            No matches pass these filters
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Try lowering the minimum score or showing matches with warnings.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Relax filters
          </button>
        </div>
      ) : (
        <>
          {/* Top 5 Match Cards */}
          <section aria-label="Top matches">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Top {topFive.length} Matches
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topFive.map((match, idx) => (
                <MatchCard
                  key={match.candidate.id}
                  match={match}
                  rank={sortBy === 'score' && !hasActiveFilters ? idx + 1 : null}
                  frictionHours={
                    buildConflictTimeline(currentUser, match.candidate).summary.frictionHours
                  }
                  isShortlisted={state.shortlist.includes(match.candidate.id)}
                  onToggleShortlist={toggleShortlist}
                />
              ))}
            </div>
          </section>

          {/* Remaining Matches */}
          {remaining.length > 0 && (
            <section className="mt-8" aria-label="All remaining matches">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  More Matches ({remaining.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  aria-expanded={showAll}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {showAll ? (
                    <>
                      Hide remaining matches <ChevronUp className="h-4 w-4" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      See all matches ({filteredMatches.length}){' '}
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>

              {showAll && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {remaining.map((match, idx) => (
                    <MatchCard
                      key={match.candidate.id}
                      match={match}
                      rank={sortBy === 'score' && !hasActiveFilters ? idx + 6 : null}
                      frictionHours={
                        buildConflictTimeline(currentUser, match.candidate).summary.frictionHours
                      }
                      isShortlisted={state.shortlist.includes(match.candidate.id)}
                      onToggleShortlist={toggleShortlist}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
