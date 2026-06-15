'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2, Lightbulb, Sparkles, Target, Globe, Brain, AlertCircle, RefreshCw, Columns, X } from 'lucide-react';
import { agentsAPI } from '@/services/api';
import { useToastStore } from '@/store/useToastStore';
import { useProjectData } from '@/hooks/useProjectData';
import { ProgressSteps } from '@/components/ui/ProgressSteps';

export default function OpportunitiesPage({ params }: { params: { id: string } }) {
  const { project, outputs, loading, refresh } = useProjectData(params.id);
  const { addToast } = useToastStore();
  const [processing, setProcessing] = useState('');
  const [selectedOpp, setSelectedOpp] = useState(0);
  const [progressSteps, setProgressSteps] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<number[]>([]);

  const runAgent = async () => {
    setProcessing('Discovering Opportunities');
    setProgressSteps([]);
    try {
      await agentsAPI.discoverStream(params.id, (event) => {
        if (event.step === 'analyzing') {
          setProgressSteps((prev) => [...prev, event.message || 'Analyzing...']);
        } else if (event.step === 'complete') {
          setProgressSteps((prev) => [...prev, 'Analysis complete!']);
          refresh();
          addToast('Opportunities discovered!', 'success');
          setTimeout(() => setProcessing(''), 500);
        } else if (event.step === 'error') {
          addToast(event.message || 'Analysis failed', 'error');
          setProcessing('');
        }
      });
    } catch (err: any) {
      addToast(err?.detail || 'Failed to discover opportunities', 'error');
    } finally {
      setProcessing('');
    }
  };

  if (loading) return <Loading />;
  if (!project) return <NotFound />;

  const opportunities = outputs.opportunities?.opportunities || [];
  const domainAnalysis = outputs.opportunities?.domain_analysis || {};
  const insights = outputs.opportunities?.entrepreneurial_insights || {};

  return (
    <div className="max-w-5xl mx-auto">
      <Header project={project} title="Opportunity Discovery" subtitle="Unit I & II · Market gaps, entrepreneur types, feasibility analysis" />

      {opportunities.length === 0 ? (
        <>
          <EmptyState
            icon={Lightbulb}
            title="Discover Opportunities"
            description="Analyze your domain for market gaps and entrepreneurial opportunities in the Indian market."
            buttonText="Start Discovery"
            processing={processing === 'Discovering Opportunities'}
            onAction={runAgent}
          />
          {progressSteps.length > 0 && (
            <div className="mt-4">
              <ProgressSteps steps={progressSteps} isComplete={processing === '' && progressSteps.length > 0 && progressSteps[progressSteps.length - 1] === 'Analysis complete!'} />
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">{opportunities.length}</strong> opportunities found for Indian market
            </p>
            <div className="flex items-center gap-2">
              {opportunities.length > 1 && (
                <button onClick={() => { setCompareMode(!compareMode); setCompareSelection([]); }} className={`btn-ghost text-xs ${compareMode ? 'text-brand-400' : ''}`}>
                  <Columns size={12} /> {compareMode ? 'Exit Compare' : 'Compare'}
                </button>
              )}
              <button onClick={runAgent} disabled={!!processing} className="btn-ghost text-xs">
                {processing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Re-run Analysis
              </button>
            </div>
          </div>

          {domainAnalysis.summary && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={16} className="text-brand-400" />
                <h2 className="font-semibold text-[var(--text-primary)]">Domain Analysis</h2>
              </div>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{domainAnalysis.summary}</p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {domainAnalysis.current_market_landscape && (
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Current Market Landscape (India)</p>
                    <p className="text-sm text-[var(--text-primary)]">{domainAnalysis.current_market_landscape}</p>
                  </div>
                )}
                {domainAnalysis.user_gaps && (
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">User Gaps in India</p>
                    <p className="text-sm text-[var(--text-primary)]">{domainAnalysis.user_gaps}</p>
                  </div>
                )}
              </div>
              {domainAnalysis.emerging_trends?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-[var(--text-muted)] mb-2">Emerging Trends</p>
                  <div className="flex flex-wrap gap-2">
                    {domainAnalysis.emerging_trends.map((t: string, i: number) => (
                      <span key={i} className="badge-brand text-xs">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Target size={16} className="text-brand-400" />
              <h2 className="font-semibold text-[var(--text-primary)]">Opportunities</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {opportunities.map((opp: any, i: number) => (
                <OpportunityCard
                  key={i} opp={opp} i={i} selected={selectedOpp === i}
                  onSelect={setSelectedOpp}
                  compareMode={compareMode}
                  checked={compareSelection.includes(i)}
                  onToggleCompare={() => setCompareSelection(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                />
              ))}
            </div>
          </div>

          {compareMode && compareSelection.length >= 2 ? (
            <CompareView opportunities={opportunities} selection={compareSelection} />
          ) : (
            <SelectedDetails opp={opportunities[selectedOpp]} />
          )}

          {insights.traits_needed?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={16} className="text-purple-400" />
                <h2 className="font-semibold text-[var(--text-primary)]">Entrepreneurial Insights</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Traits Needed</p>
                  <div className="flex flex-wrap gap-1">
                    {insights.traits_needed.map((t: string, i: number) => (
                      <span key={i} className="badge-purple text-xs">{t}</span>
                    ))}
                  </div>
                </div>
                {insights.myths_busted?.length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Myths Busted</p>
                    <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                      {insights.myths_busted.map((m: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertCircle size={10} className="text-brand-400 mt-0.5 shrink-0" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <NextButton href={`/projects/${params.id}/ip`} label="Next: IP Analysis" />
        </div>
      )}
    </div>
  );
}

function OpportunityCard({ opp, i, selected, onSelect, compareMode, checked, onToggleCompare }: { opp: any; i: number; selected: boolean; onSelect: (i: number) => void; compareMode?: boolean; checked?: boolean; onToggleCompare?: () => void }) {
  const score = opp.feasibility_score || 5;
  return (
    <div
      className={`card cursor-pointer transition-all ${selected ? 'border-brand-500 ring-1 ring-brand-500/30' : 'hover:border-[var(--border-light)]'}`}
      onClick={() => compareMode ? onToggleCompare?.() : onSelect(i)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {compareMode && (
            <div className={`flex h-5 w-5 items-center justify-center rounded border-2 ${checked ? 'bg-brand-500 border-brand-500' : 'border-[var(--border-light)]'}`}>
              {checked && <span className="text-white text-[10px] font-bold">✓</span>}
            </div>
          )}
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${checked ? 'bg-brand-500 text-white' : 'bg-brand-600/20 text-brand-400'}`}>{i + 1}</div>
          <span className="text-xs text-[var(--text-muted)]">{opp.entrepreneur_type || 'Opportunity'}</span>
        </div>
        <span className={`text-lg font-bold ${score >= 8 ? 'text-emerald-400' : score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{score}/10</span>
      </div>
      <h3 className="font-semibold text-[var(--text-primary)] mb-1">{opp.title}</h3>
      <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">{opp.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {opp.market_gap && <span className="badge-warning text-[10px]">Gap: {opp.market_gap?.slice(0, 40)}...</span>}
        {opp.innovation_level && <span className="badge-purple text-[10px]">{opp.innovation_level}</span>}
        {opp.government_alignment && <span className="badge text-[10px] bg-emerald-600/20 text-emerald-400">{opp.government_alignment}</span>}
      </div>
    </div>
  );
}

function SelectedDetails({ opp }: { opp: any }) {
  if (!opp) return null;
  return (
    <div className="card">
      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Selected Opportunity Details</p>
      <h3 className="font-semibold text-[var(--text-primary)] mb-2">{opp.title}</h3>
      <p className="text-sm text-[var(--text-primary)] mb-4">{opp.description}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        {opp.tam && <Detail label="Market Size (TAM)" value={opp.tam} />}
        {opp.target_customer && <Detail label="Target Customer" value={opp.target_customer} />}
        {opp.entrepreneur_type && <Detail label="Entrepreneur Type" value={opp.entrepreneur_type} />}
        {opp.ip_potential && <Detail label="IP Potential" value={opp.ip_potential} />}
        {opp.regulatory_notes && <Detail label="Indian Regulations" value={opp.regulatory_notes} />}
        {opp.government_alignment && <Detail label="Govt Scheme" value={opp.government_alignment} />}
      </div>
      {opp.success_factors?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-[var(--text-muted)] mb-1">Success Factors</p>
          <div className="flex flex-wrap gap-1">
            {opp.success_factors.map((f: string, i: number) => (
              <span key={i} className="badge text-[10px] bg-emerald-600/20 text-emerald-400">{f}</span>
            ))}
          </div>
        </div>
      )}
      {opp.challenges?.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-[var(--text-muted)] mb-1">Challenges</p>
          <div className="flex flex-wrap gap-1">
            {opp.challenges.map((c: string, i: number) => (
              <span key={i} className="badge text-[10px] bg-red-600/20 text-red-400">{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompareView({ opportunities, selection }: { opportunities: any[]; selection: number[] }) {
  const selected = selection.map(i => opportunities[i]);
  const rows = [
    { label: 'Title', key: 'title' },
    { label: 'Entrepreneur Type', key: 'entrepreneur_type' },
    { label: 'Feasibility Score', key: 'feasibility_score', render: (v: number) => <span className={`font-bold ${v >= 8 ? 'text-emerald-400' : v >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{v}/10</span> },
    { label: 'Market Gap', key: 'market_gap' },
    { label: 'Target Customer', key: 'target_customer' },
    { label: 'Market Size (TAM)', key: 'tam' },
    { label: 'Innovation Level', key: 'innovation_level' },
    { label: 'IP Potential', key: 'ip_potential' },
    { label: 'Govt Scheme Alignment', key: 'government_alignment' },
    { label: 'Regulatory Notes', key: 'regulatory_notes' },
  ];
  return (
    <div className="card overflow-x-auto">
      <h2 className="font-semibold text-[var(--text-primary)] mb-3">Side-by-Side Comparison</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left py-2 pr-4 text-xs text-[var(--text-muted)] font-medium">Attribute</th>
            {selected.map((opp, i) => (
              <th key={i} className="text-left py-2 px-2 text-xs text-[var(--text-muted)] font-medium">#{selection[i] + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, key, render }) => (
            <tr key={key} className="border-b border-[var(--border)] last:border-0">
              <td className="py-2 pr-4 text-xs text-[var(--text-muted)] whitespace-nowrap">{label}</td>
              {selected.map((opp, i) => {
                const val = opp[key];
                return (
                  <td key={i} className="py-2 px-2 text-xs text-[var(--text-primary)]">
                    {render ? render(val) : val?.toString()?.slice(0, 100) || '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function Header({ project, title, subtitle }: { project: any; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Link href={`/projects/${project.id}`} className="btn-ghost p-2">
        <ChevronLeft size={18} />
      </Link>
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{title}</h1>
        <p className="text-xs text-[var(--text-secondary)]">{project.title} · {subtitle}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, buttonText, processing, onAction }: any) {
  return (
    <div className="card text-center py-12">
      <Icon size={40} className="mx-auto mb-4 text-brand-400/50" />
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">{description}</p>
      <button onClick={onAction} disabled={processing} className="btn-primary">
        {processing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {processing ? 'Processing...' : buttonText}
      </button>
    </div>
  );
}

function NextButton({ href, label }: { href: string; label: string }) {
  return (
    <div className="flex justify-end">
      <Link href={href} className="btn-primary">
        {label} <ChevronRight size={16} />
      </Link>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={24} className="animate-spin text-brand-400" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="text-center py-12">
      <p className="text-[var(--text-secondary)] mb-4">Project not found</p>
      <Link href="/projects" className="btn-primary">Back to Projects</Link>
    </div>
  );
}
