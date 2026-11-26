import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgrad'];
const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not', label: 'Prefer not to say' },
];

export default function ProfileSetup() {
  const { state, updateProfile } = useApp();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { profile } = state;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      setError('Please enter your first name or nickname.');
      return;
    }
    if (!profile.course.trim()) {
      setError('Please enter your course or major (e.g., B.Tech CSE).');
      return;
    }
    setError('');
    navigate('/quiz');
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to home
        </Link>
        <div className="mt-3 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <UserCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Quick Profile
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Takes 20 seconds — helps personalize your match cards and filters.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6"
      >
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="profile-name"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Your name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              value={profile.name}
              onChange={(e) => updateProfile({ name: e.target.value })}
              placeholder="e.g., Arjun Mehta"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Campus email <span className="text-xs font-normal text-slate-400">(optional, for requests)</span>
            </label>
            <input
              id="profile-email"
              type="email"
              value={profile.email || ''}
              onChange={(e) => updateProfile({ email: e.target.value })}
              placeholder="e.g., arjun@campus.edu"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="profile-course"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Course / Major
            </label>
            <input
              id="profile-course"
              type="text"
              required
              value={profile.course}
              onChange={(e) => updateProfile({ course: e.target.value })}
              placeholder="e.g., B.Tech CSE"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="profile-year"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              Year
            </label>
            <select
              id="profile-year"
              value={profile.year}
              onChange={(e) => updateProfile({ year: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="profile-gender"
            className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Your gender
          </label>
          <select
            id="profile-gender"
            value={profile.gender}
            onChange={(e) => updateProfile({ gender: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
            Roommate gender preference
          </legend>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[
              { value: 'any', title: 'Any gender', desc: 'Show everyone who also matches' },
              { value: 'same', title: 'Same gender only', desc: 'Mutual same-gender hostel wing' },
            ].map((opt) => {
              const selected = profile.genderPreference === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateProfile({ genderPreference: opt.value })}
                  aria-pressed={selected}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    selected
                      ? 'border-indigo-600 bg-indigo-50/80 ring-1 ring-indigo-600 dark:border-indigo-400 dark:bg-indigo-950/50 dark:ring-indigo-400'
                      : 'border-slate-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-700'
                  }`}
                >
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">
                    {opt.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
          {profile.genderPreference === 'same' && profile.gender === 'prefer-not' && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              Tip: Select your gender above if you want same-gender filtering to match accurately.
            </p>
          )}
        </fieldset>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 sm:w-auto dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Start Scenario Quiz
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
