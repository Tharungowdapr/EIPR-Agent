'use client';

import { Loader2, Check, AlertCircle } from 'lucide-react';

export function ProgressSteps({ steps, isComplete, error }: { steps: string[]; isComplete: boolean; error?: string }) {
  if (steps.length === 0 && !error) return null;

  return (
    <div className="card border-brand-500/30 bg-brand-600/5">
      <div className="flex items-center gap-2 mb-3">
        {isComplete ? (
          <Check size={16} className="text-emerald-400" />
        ) : error ? (
          <AlertCircle size={16} className="text-red-400" />
        ) : (
          <Loader2 size={16} className="animate-spin text-brand-400" />
        )}
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {isComplete ? 'Complete' : error ? 'Failed' : 'Analyzing...'}
        </p>
      </div>
      <div className="space-y-1.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            {i === steps.length - 1 && !isComplete && !error ? (
              <Loader2 size={10} className="animate-spin text-brand-400 shrink-0" />
            ) : (
              <Check size={10} className="text-emerald-400 shrink-0" />
            )}
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
