'use client';

import { useToastStore } from '@/store/useToastStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const COLORS = {
  success: 'border-emerald-600/30 bg-emerald-600/10 text-emerald-400',
  error: 'border-red-600/30 bg-red-600/10 text-red-400',
  info: 'border-brand-600/30 bg-brand-600/10 text-brand-400',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className={`flex items-start gap-2 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm animate-slide-up ${COLORS[t.type]}`}
          >
            <Icon size={16} className="mt-0.5 shrink-0" />
            <p className="text-sm flex-1">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="opacity-60 hover:opacity-100 shrink-0">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}