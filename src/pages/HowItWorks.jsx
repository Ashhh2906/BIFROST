import { Link } from 'react-router-dom';
import { ArrowRight, Clock, FileText, Scale, ShieldAlert, Sparkles } from 'lucide-react';
import { DEMO_PERSONA } from '../data/demoPersona.js';
import { evaluatePair } from '../utils/compatibility.js';

export default function HowItWorks() {
  // Real live computation of the messy-vs-neat asymmetry example
  const messyExample = {
    id: 'ex-messy',
    name: 'Messy Student',
    answers: {
      ...DEMO_PERSONA.answers,
      tidiness: 1,
      cleaningFrequency: 2,
      dishesLaundry: 2,
      messTolerance: 5,
    },
    importance: { sleep: 3, study: 3, cleanliness: 4, social: 3 },
    dealBreakers: [],
  };

  const neatExample = {
    id: 'ex-neat',
    name: 'Neat Student',
    answers: {
      ...DEMO_PERSONA.answers,
      tidiness: 5,
      cleaningFrequency: 0,
      dishesLaundry: 0,
      messTolerance: 1,
    },
    importance: { sleep: 3, study: 3, cleanliness: 5, social: 3 },
    dealBreakers: [],
  };

  const exampleResult = evaluatePair(messyExample, neatExample);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Under the Hood
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
          How Roommate Finder Works
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
          Built around a simple truth: roommate compatibility isn&apos;t symmetric, and percentages
          alone don&apos;t stop 1 AM arguments.
        </p>
      </div>

      {/* Step 1 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          1. Scenario Questions Instead of Fake 1–5 Scales
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Nobody knows what &ldquo;cleanliness: 3/5&rdquo; means. Instead, you tap relatable hostel
          scenarios (like 3-day-old Maggi bowls at 1 AM or a phone buzzing at 2 AM). Under the hood,
          each option maps to normalized scales, circular study-time slots, or sensitivity
          multipliers.
        </p>
      </section>

      {/* Step 2: Live Asymmetric Example */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Asymmetric Comfort &amp; Harmonic Mean
          </h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          A naive app takes the average difference and thinks a messy person and a neat person are
          &ldquo;50% compatible.&rdquo; In reality, the messy person loves having a clean roommate,
          while the neat person is miserable. Look at what our engine computes live:
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-950/50">
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              Messy Student&apos;s Cleanliness Comfort
            </p>
            <p className="mt-1 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {exampleResult.categoryBreakdown.cleanliness.yourScore}%
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Happy living with someone tidy!
            </p>
          </div>
          <div className="rounded-xl bg-rose-50 p-4 dark:bg-rose-950/50">
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
              Neat Student&apos;s Cleanliness Comfort
            </p>
            <p className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              {exampleResult.categoryBreakdown.cleanliness.theirScore}%
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Amplified by low mess tolerance (1.5× sensitivity).
            </p>
          </div>
          <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Overall Pair Score (Harmonic Mean)
            </p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              {exampleResult.overall}%
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Your comfort: {exampleResult.yourComfort}% · Theirs: {exampleResult.theirComfort}%
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Why harmonic mean{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">
            2ab / (a + b)
          </code>
          ? Because a roommate pairing is only as peaceful as its less-comfortable person. Whenever
          comfort differs by 20+ points, we flag the pair as <strong>Lopsided</strong>.
        </p>
      </section>

      {/* Step 3 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <ShieldAlert className="mb-2 h-5 w-5 text-rose-500" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            3. Hard Deal-Breakers
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Opposing smoking, guest, or AC temperature clashes always trigger a warning badge — and
            if either person marked it hard, the score caps at 60%.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <Clock className="mb-2 h-5 w-5 text-amber-500" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            4. 24-Hour Conflict Timeline
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            We build 48 half-hour schedule slots (6 PM → 6 PM) and highlight exact windows when one
            sleeps while the other studies with lights or noise.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <FileText className="mb-2 h-5 w-5 text-emerald-500" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            5. Custom Roommate Agreement
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Every rule cites the exact answer clash or timeline window that caused it — plus any
            compromises you toggled in the live simulator.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
        >
          Take the quiz
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          to="/results"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          View matches
        </Link>
      </div>
    </div>
  );
}
