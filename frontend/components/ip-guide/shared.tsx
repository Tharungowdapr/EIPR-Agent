import React from 'react';
import { ExternalLink, IndianRupee, Clock, AlertTriangle } from 'lucide-react';

export function ResourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 underline underline-offset-2 decoration-brand-600/30"
    >
      {label} <ExternalLink size={12} />
    </a>
  );
}

export function StepCard({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="card flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600/20 text-brand-400 text-sm font-bold">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
        <div className="text-sm text-[var(--text-secondary)] space-y-2 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export function InfoBox({ icon: Icon, title, children, variant = 'brand' }: { icon: any; title: string; children: React.ReactNode; variant?: 'brand' | 'emerald' | 'amber' | 'blue' }) {
  const colors: Record<string, string> = {
    brand: 'bg-brand-600/10 border-brand-600/30 text-brand-400',
    emerald: 'bg-emerald-600/10 border-emerald-600/30 text-emerald-400',
    amber: 'bg-amber-600/10 border-amber-600/30 text-amber-400',
    blue: 'bg-blue-600/10 border-blue-600/30 text-blue-400',
  };
  return (
    <div className={`p-4 border rounded-lg ${colors[variant] || colors.brand}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} />
        <p className="text-xs font-semibold uppercase tracking-wider">{title}</p>
      </div>
      <div className="text-sm opacity-90 space-y-1">{children}</div>
    </div>
  );
}

export function LearnMore({ children }: { children: React.ReactNode }) {
  return (
    <div className="card mt-4">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Learning Resources</h3>
      {children}
    </div>
  );
}
