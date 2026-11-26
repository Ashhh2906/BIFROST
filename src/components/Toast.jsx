import { CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg dark:border-slate-700 dark:bg-slate-100 dark:text-slate-900"
    >
      <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600" aria-hidden="true" />
      <span>{toast.message}</span>
    </div>
  );
}
