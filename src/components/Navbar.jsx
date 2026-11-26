import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bookmark, Menu, RotateCcw, Sparkles, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Modal from './Modal.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function Navbar() {
  const { state, isQuizComplete, answeredCount, resetAllData, resetQuizOnly } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const shortlistCount = state.shortlist.length;
  const hasProgress = answeredCount > 0;

  const navLinkClass = ({ isActive }) =>
    `rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
    }`;

  const handleRetake = () => {
    resetQuizOnly();
    setMobileOpen(false);
    navigate('/quiz');
  };

  const handleConfirmClear = () => {
    resetAllData();
    setConfirmOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <>
      <header className="no-print sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white dark:bg-indigo-500">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>Roommate Finder</span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
            {isQuizComplete && (
              <NavLink to="/results" className={navLinkClass}>
                Matches
              </NavLink>
            )}
            <NavLink to="/shortlist" className={navLinkClass}>
              <span className="inline-flex items-center gap-1.5">
                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                Shortlist
                {shortlistCount > 0 && (
                  <span className="rounded-full bg-indigo-600 px-1.5 py-0.2 text-[11px] font-bold text-white dark:bg-indigo-500">
                    {shortlistCount}
                  </span>
                )}
              </span>
            </NavLink>
            <NavLink to="/how-it-works" className={navLinkClass}>
              How it works
            </NavLink>
            {hasProgress && (
              <NavLink to="/quiz" className={navLinkClass}>
                Edit answers
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {hasProgress && (
              <div className="hidden items-center gap-1.5 md:flex">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Retake
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/60"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Clear
                </button>
              </div>
            )}
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 md:hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav
            aria-label="Mobile navigation"
            className="border-t border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex flex-col gap-1.5">
              {isQuizComplete && (
                <NavLink to="/results" onClick={() => setMobileOpen(false)} className={navLinkClass}>
                  Matches
                </NavLink>
              )}
              <NavLink to="/shortlist" onClick={() => setMobileOpen(false)} className={navLinkClass}>
                Shortlist ({shortlistCount})
              </NavLink>
              <NavLink to="/how-it-works" onClick={() => setMobileOpen(false)} className={navLinkClass}>
                How it works
              </NavLink>
              {hasProgress && (
                <>
                  <NavLink to="/quiz" onClick={() => setMobileOpen(false)} className={navLinkClass}>
                    Edit answers
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Retake quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/60"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Clear my data
                  </button>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Clear all saved data?"
        maxWidth="max-w-md"
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This will permanently erase your profile, quiz answers, importance weights, deal-breakers,
          and shortlist from this browser.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmClear}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Yes, clear data
          </button>
        </div>
      </Modal>
    </>
  );
}
