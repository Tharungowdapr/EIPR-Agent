'use client';

import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-brand-950 via-[var(--bg-primary)] to-[var(--bg-secondary)] items-center justify-center p-12">
        <div className="max-w-md">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white text-xl font-bold mb-6">E</div>
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">EIPR-Agent</h2>
          <p className="text-[var(--text-secondary)] mb-8">Multi-Agent AI System for Entrepreneurship & Intellectual Property Rights Analysis</p>
          <div className="space-y-4">
            {[
              'Discover entrepreneurial opportunities from any domain',
              'Analyze patents, trademarks, and IP landscapes via MCP',
              'Generate EIPR curriculum-aligned case studies & reports',
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-600/20 flex items-center justify-center mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
