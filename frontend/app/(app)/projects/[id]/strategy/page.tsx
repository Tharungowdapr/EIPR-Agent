'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2, Briefcase, RefreshCw, Download } from 'lucide-react';
import { agentsAPI, projectsAPI } from '@/services/api';
import { useToastStore } from '@/store/useToastStore';
import { useProjectData } from '@/hooks/useProjectData';
import { ProgressSteps } from '@/components/ui/ProgressSteps';

function renderText(val: any, fallback: string = ''): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (val && typeof val === 'object') return JSON.stringify(val);
  return fallback;
}

export default function StrategyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { project, outputs, loading, refresh } = useProjectData(id);
  const { addToast } = useToastStore();
  const [processing, setProcessing] = useState('');
  const [selectedOpp, setSelectedOpp] = useState(0);
  const [progressSteps, setProgressSteps] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const opportunities = outputs.opportunities?.opportunities || [];
  const businessPlan = outputs[`business_plan_${selectedOpp}`];

  const downloadPdf = async () => {
    setExporting(true);
    try {
      const blob = await projectsAPI.exportFullPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title.replace(/\s+/g, '_')}_full_report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('PDF downloaded', 'success');
    } catch (err: any) {
      addToast(err?.detail || 'Failed to export PDF', 'error');
    } finally {
      setExporting(false);
    }
  };

  const runAgent = async () => {
    setProcessing('Generating Strategy');
    setProgressSteps([]);
    try {
      await agentsAPI.strategyStream(id, selectedOpp, (event) => {
        if (event.step === 'analyzing') {
          setProgressSteps((prev) => [...prev, event.message || 'Analyzing...']);
        } else if (event.step === 'complete') {
          setProgressSteps((prev) => [...prev, 'Strategy and financial analysis complete!']);
          refresh();
          addToast('Business strategy and financial analysis generated!', 'success');
          setTimeout(() => setProcessing(''), 500);
        } else if (event.step === 'error') {
          addToast(event.message || 'Strategy generation failed', 'error');
          setProcessing('');
        }
      });
    } catch (err: any) {
      addToast(err?.detail || 'Strategy generation failed', 'error');
    } finally {
      setProcessing('');
    }
  };

  if (loading) return <Loading />;
  if (!project) return <NotFound />;

  return (
    <div className="max-w-5xl mx-auto">
      <Header project={project} title="Business Strategy" subtitle="Unit II & III · SWOC, Porter, 4Ps, India business planning" />

      {opportunities.length === 0 ? (
        <PrereqCard href={`/projects/${id}/opportunities`} message="Complete Opportunities first" />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <p className="text-sm text-[var(--text-secondary)]">Strategy for opportunity:</p>
            <select value={selectedOpp} onChange={(e) => setSelectedOpp(Number(e.target.value))} className="input text-sm py-1.5 max-w-xs">
              {opportunities.map((o: any, i: number) => (
                <option key={i} value={i}>{o.title?.slice(0, 60)}</option>
              ))}
            </select>
          </div>

          {!businessPlan ? (
            <>
              <div className="card text-center py-12">
                <Briefcase size={40} className="mx-auto mb-4 text-brand-400/50" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Generate Business Strategy</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                  SWOC analysis, Porter&apos;s strategy, 4Ps marketing plan tailored for Indian market, and financial feasibility.
                </p>
                <button onClick={runAgent} disabled={!!processing} className="btn-primary">
                  {processing ? <Loader2 size={16} className="animate-spin" /> : <Briefcase size={16} />}
                  {processing ? 'Generating...' : 'Generate Strategy & Finance'}
                </button>
              </div>
              {progressSteps.length > 0 && (
                <div className="mt-4">
                  <ProgressSteps steps={progressSteps} isComplete={progressSteps[progressSteps.length - 1] === 'Strategy and financial analysis complete!'} />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--text-secondary)]">
                  Strategy for: <strong className="text-[var(--text-primary)]">{opportunities[selectedOpp]?.title}</strong>
                </p>
                <div className="flex gap-2">
                  <button onClick={downloadPdf} disabled={exporting} className="btn-ghost text-xs">
                    {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    PDF
                  </button>
                  <button onClick={runAgent} disabled={!!processing} className="btn-ghost text-xs">
                    {processing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    Re-generate
                  </button>
                </div>
              </div>

              {businessPlan.business_plan?.executive_summary && (
                <div className="card">
                  <h2 className="font-semibold text-[var(--text-primary)] mb-2">Executive Summary</h2>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed">{renderText(businessPlan.business_plan.executive_summary)}</p>
                </div>
              )}

              {businessPlan.strategic_analysis?.swoc && (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(businessPlan.strategic_analysis.swoc).map(([key, vals]: [string, any]) => (
                    <div key={key} className={`card p-3 ${key === 'strengths' ? 'border-emerald-600/20' : key === 'weaknesses' ? 'border-red-600/20' : key === 'opportunities' ? 'border-blue-600/20' : 'border-yellow-600/20'}`}>
                      <p className="text-xs font-semibold capitalize text-[var(--text-secondary)] mb-1">{key}</p>
                      <ul className="text-xs text-[var(--text-primary)] space-y-0.5">
                        {(vals || []).slice(0, 5).map((v: string, i: number) => (
                          <li key={i} className="flex items-start gap-1">• {v}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {businessPlan.strategic_analysis?.porter_strategy && (
                <div className="card flex items-center gap-4">
                  <span className="badge-brand text-sm">{businessPlan.strategic_analysis.porter_strategy.recommended}</span>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Porter&apos;s Strategy</p>
                    <p className="text-xs text-[var(--text-muted)]">{businessPlan.strategic_analysis.porter_strategy.reasoning}</p>
                  </div>
                </div>
              )}

              {businessPlan.marketing_plan && (
                <div className="card">
                  <h2 className="font-semibold text-[var(--text-primary)] mb-3">Marketing Plan (India-Specific)</h2>
                  {businessPlan.marketing_plan.uvp && (
                    <div className="mb-3 p-3 bg-brand-600/10 border border-brand-600/30 rounded-lg">
                      <p className="text-xs text-brand-400 font-medium">Unique Value Proposition</p>
                      <p className="text-sm text-[var(--text-primary)]">{renderText(businessPlan.marketing_plan.uvp)}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['product', 'price', 'place', 'promotion'].map((p) => (
                      <div key={p} className="card p-2">
                        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">{p}</p>
                        <p className="text-xs text-[var(--text-primary)] mt-1">{businessPlan.marketing_plan.four_ps?.[p] || '-'}</p>
                      </div>
                    ))}
                  </div>
                  {businessPlan.marketing_plan.stp && (
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div><span className="text-xs text-[var(--text-muted)]">Segments</span><p className="text-[var(--text-primary)]">{(businessPlan.marketing_plan.stp.segments || []).join(', ')}</p></div>
                      <div><span className="text-xs text-[var(--text-muted)]">Target</span><p className="text-[var(--text-primary)]">{businessPlan.marketing_plan.stp.target}</p></div>
                      <div><span className="text-xs text-[var(--text-muted)]">Positioning</span><p className="text-[var(--text-primary)]">{businessPlan.marketing_plan.stp.positioning}</p></div>
                    </div>
                  )}
                  {businessPlan.marketing_plan.digital_marketing && (
                    <div className="mt-4">
                      <p className="text-xs text-[var(--text-muted)] mb-2">Digital Marketing</p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {businessPlan.marketing_plan.digital_marketing.seo_strategy && (
                          <div><span className="text-[var(--text-muted)]">SEO: </span><span className="text-[var(--text-primary)]">{businessPlan.marketing_plan.digital_marketing.seo_strategy}</span></div>
                        )}
                        {businessPlan.marketing_plan.digital_marketing.social_media && (
                          <div><span className="text-[var(--text-muted)]">Social: </span><span className="text-[var(--text-primary)]">{businessPlan.marketing_plan.digital_marketing.social_media}</span></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {businessPlan.growth_strategy && (
                <div className="card">
                  <h2 className="font-semibold text-[var(--text-primary)] mb-3">Growth Strategy for India</h2>
                  <p className="text-sm text-[var(--text-primary)] mb-2">{renderText(businessPlan.growth_strategy.organic_growth)}</p>
                  {businessPlan.growth_strategy.strategic_alliances?.length > 0 && (
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">Strategic Alliances</p>
                      <div className="flex flex-wrap gap-1">
                        {businessPlan.growth_strategy.strategic_alliances.map((a: any, i: number) => (
                          <span key={i} className="badge text-xs bg-brand-600/20 text-brand-400">{renderText(a)}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <NextButton href={`/projects/${id}/report`} label="Next: Final Report" />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Header({ project, title, subtitle }: { project: any; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Link href={`/projects/${project.id}`} className="btn-ghost p-2"><ChevronLeft size={18} /></Link>
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{title}</h1>
        <p className="text-xs text-[var(--text-secondary)]">{project.title} · {subtitle}</p>
      </div>
    </div>
  );
}

function PrereqCard({ href, message }: { href: string; message: string }) {
  return (
    <div className="card text-center py-12">
      <p className="text-sm text-[var(--text-secondary)] mb-4">{message}</p>
      <Link href={href} className="btn-primary">Go to Opportunities</Link>
    </div>
  );
}

function NextButton({ href, label }: { href: string; label: string }) {
  return (
    <div className="flex justify-end">
      <Link href={href} className="btn-primary">{label} <ChevronRight size={16} /></Link>
    </div>
  );
}

function Loading() {
  return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={24} className="animate-spin text-brand-400" /></div>;
}

function NotFound() {
  return <div className="text-center py-12"><p className="text-[var(--text-secondary)] mb-4">Project not found</p><Link href="/projects" className="btn-primary">Back to Projects</Link></div>;
}
