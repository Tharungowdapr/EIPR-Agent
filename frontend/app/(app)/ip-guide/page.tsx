'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, BookOpen, FileText, Shield, Copyright, Lock, Palette } from 'lucide-react';
import PatentGuide from '@/components/ip-guide/PatentGuide';
import TrademarkGuide from '@/components/ip-guide/TrademarkGuide';
import CopyrightGuide from '@/components/ip-guide/CopyrightGuide';
import TradeSecretGuide from '@/components/ip-guide/TradeSecretGuide';
import DesignGuide from '@/components/ip-guide/DesignGuide';

const SECTIONS = [
  { id: 'patent', label: 'Patent Filing', icon: FileText },
  { id: 'trademark', label: 'Trademark', icon: Shield },
  { id: 'copyright', label: 'Copyright', icon: Copyright },
  { id: 'trade-secret', label: 'Trade Secret', icon: Lock },
  { id: 'design', label: 'Design Registration', icon: Palette },
];

export default function IPGuidePage() {
  const [activeSection, setActiveSection] = useState('patent');

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/projects" className="btn-ghost p-2"><ChevronLeft size={18} /></Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">IP Filing Guide</h1>
          <p className="text-xs text-[var(--text-secondary)]">Complete step-by-step guide for Indian IP protection with learning resources</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 p-3 bg-brand-600/10 border border-brand-600/30 rounded-lg">
        <BookOpen size={16} className="text-brand-400 shrink-0" />
        <p className="text-xs text-brand-400">Use this guide to navigate the IP protection process in India. Each section provides step-by-step instructions, cost estimates, timelines, and links to official filing portals and learning resources.</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeSection === s.id ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30' : 'text-[var(--text-muted)] border border-transparent hover:border-[var(--border)]'
              }`}
            >
              <Icon size={14} />
              {s.label}
            </button>
          );
        })}
      </div>

      {activeSection === 'patent' && <PatentGuide />}
      {activeSection === 'trademark' && <TrademarkGuide />}
      {activeSection === 'copyright' && <CopyrightGuide />}
      {activeSection === 'trade-secret' && <TradeSecretGuide />}
      {activeSection === 'design' && <DesignGuide />}
    </div>
  );
}
