import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
        404
      </p>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
        Wrong hostel room!
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        That page doesn&apos;t exist. Let&apos;s head back to the main lobby.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
      >
        <Home className="h-4 w-4" aria-hidden="true" />
        Back to Home
      </Link>
    </div>
  );
}
