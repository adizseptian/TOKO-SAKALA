import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/context/StoreContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useStore();

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon =
            toast.type === 'success'
              ? CheckCircle2
              : toast.type === 'warning'
              ? AlertTriangle
              : toast.type === 'error'
              ? AlertCircle
              : Info;

          const colorClasses =
            toast.type === 'success'
              ? 'border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-[#0c221c]/95 text-slate-900 dark:text-emerald-100 shadow-xl shadow-emerald-950/10'
              : toast.type === 'warning'
              ? 'border-amber-200 dark:border-amber-500/30 bg-white dark:bg-[#251b08]/95 text-slate-900 dark:text-amber-100 shadow-xl shadow-amber-950/10'
              : toast.type === 'error'
              ? 'border-rose-200 dark:border-rose-500/30 bg-white dark:bg-[#290d12]/95 text-slate-900 dark:text-rose-100 shadow-xl shadow-rose-950/10'
              : 'border-teal-200 dark:border-teal-500/30 bg-white dark:bg-[#092320]/95 text-slate-900 dark:text-teal-100 shadow-xl shadow-teal-950/10';

          const iconColor =
            toast.type === 'success'
              ? 'text-emerald-600 dark:text-emerald-400'
              : toast.type === 'warning'
              ? 'text-amber-600 dark:text-amber-400'
              : toast.type === 'error'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-teal-600 dark:text-teal-400';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg ${colorClasses}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
