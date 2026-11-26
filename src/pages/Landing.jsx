import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  FileText,
  Scale,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function Landing() {
  const { isQuizComplete, answeredCount, totalQuestions, loadDemoPersona } = useApp();
  const navigate = useNavigate();

  const handleTryDemo = () => {
    loadDemoPersona();
    navigate('/results');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Asymmetric Roommate Compatibility Engine
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Find a roommate you&apos;ll actually{' '}
          <span className="text-indigo-600 dark:text-indigo-400">live well with</span>.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
          Other apps give you a compatibility percentage and hope for the best. Ours shows you the
          exact hour of the day you&apos;ll fight, and generates a customized agreement to prevent
          it before you move in.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/profile"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:w-auto dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Find my roommate
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={handleTryDemo}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-xs transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <Zap className="h-4 w-4 text-amber-500" aria-hidden="true" />
            Try demo
          </button>
        </div>

        {answeredCount > 0 && (
          <div className="mt-5">
            <Link
              to={isQuizComplete ? '/results' : '/quiz'}
              className="text-sm font-semibold text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400"
            >
              {isQuizComplete
                ? 'Jump back to your saved matches →'
                : `Resume saved quiz (${answeredCount}/${totalQuestions} answered) →`}
            </Link>
          </div>
        )}
      </section>

      {/* Feature Highlights */}
      <section aria-label="Key features" className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Scale className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Two-Way Asymmetric Scoring
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            A messy sleeper loves a tidy quiet roommate — the reverse isn&apos;t true. We score both
            directions and use the harmonic mean.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <Clock className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            24-Hour Conflict Timeline
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            See your schedules hour-by-hour from 6 PM to 6 PM and pinpoint exact late-night light
            or noise clashes.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Live Compromise Simulator
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Test &ldquo;what if I use headphones?&rdquo; or &ldquo;what if they dim screens at
            midnight?&rdquo; and watch the score jump live.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            1-Click Roommate Agreement
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Generates a customized House Rules sheet solely from your actual friction points — ready
            to print or save as PDF.
          </p>
        </div>
      </section>
    </div>
  );
}
