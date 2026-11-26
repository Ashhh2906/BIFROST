import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Moon, Sparkles, Users } from 'lucide-react';
import { CATEGORIES, QUESTIONS } from '../data/questions.js';
import { useApp } from '../context/AppContext.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import ScenarioCard from '../components/ScenarioCard.jsx';

const CATEGORY_ICONS = {
  Moon,
  BookOpen,
  Sparkles,
  Users,
};

export default function Quiz() {
  const { state, setAnswer, answeredCount, totalQuestions } = useApp();
  const [stepIndex, setStepIndex] = useState(0);
  const [validationError, setValidationError] = useState('');
  const navigate = useNavigate();

  const currentCategory = CATEGORIES[stepIndex];
  const categoryQuestions = QUESTIONS.filter((q) => q.category === currentCategory.id);
  const IconComponent = CATEGORY_ICONS[currentCategory.icon] || Sparkles;

  const unansweredInStep = categoryQuestions.filter(
    (q) => state.answers[q.id] === undefined || state.answers[q.id] === null
  );

  const handleSelectAnswer = (qId, val) => {
    setAnswer(qId, val);
    if (validationError) setValidationError('');
  };

  const handleNext = () => {
    if (unansweredInStep.length > 0) {
      setValidationError(
        `Please pick an option for all ${categoryQuestions.length} scenarios in ${currentCategory.shortLabel} (${unansweredInStep.length} remaining).`
      );
      return;
    }
    setValidationError('');
    if (stepIndex < CATEGORIES.length - 1) {
      setStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/importance');
    }
  };

  const handleBack = () => {
    setValidationError('');
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/profile');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Category step pills */}
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Quiz categories">
        {CATEGORIES.map((cat, idx) => {
          const catQs = QUESTIONS.filter((q) => q.category === cat.id);
          const done = catQs.every(
            (q) => state.answers[q.id] !== undefined && state.answers[q.id] !== null
          );
          const active = idx === stepIndex;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setValidationError('');
                setStepIndex(idx);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                  : done
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {idx + 1}. {cat.shortLabel}
            </button>
          );
        })}
      </div>

      <ProgressBar
        current={answeredCount}
        total={totalQuestions}
        label={`Step ${stepIndex + 1} of ${CATEGORIES.length}: ${currentCategory.label} (autosaved)`}
      />

      <div className="mt-6 mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
          <IconComponent className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
            {currentCategory.label}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{currentCategory.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        {categoryQuestions.map((q, idx) => (
          <ScenarioCard
            key={q.id}
            question={q}
            index={idx}
            value={state.answers[q.id]}
            onChange={handleSelectAnswer}
          />
        ))}
      </div>

      {validationError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
        >
          {validationError}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {stepIndex === CATEGORIES.length - 1 ? 'Next: Priorities' : 'Next Category'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
