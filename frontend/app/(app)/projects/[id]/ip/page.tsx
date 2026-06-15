'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2, Shield, Check, RefreshCw, Download } from 'lucide-react';
import { agentsAPI } from '@/services/api';
import { useToastStore } from '@/store/useToastStore';
import { useProjectData } from '@/hooks/useProjectData';
import { ProgressSteps } from '@/components/ui/ProgressSteps';

export default function IpAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { project, outputs, loading, refresh } = useProjectData(id);
  const { addToast } = useToastStore();
  const [processing, setProcessing] = useState('');
  const [selectedOpp, setSelectedOpp] = useState(0);
  const [progressSteps, setProgressSteps] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const opportunities = outputs.opportunities?.opportunities || [];

  const downloadPdf = async () => {
    setExporting(true);
    try {
      const blob = await agentsAPI.exportFullPdf(id);
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
      addToast(err?.response?.data?.detail || 'Failed to export PDF', 'error');
    } finally {
      setExporting(false);
    }
  };
  const ipAnalysis = outputs[`ip_analysis_${selectedOpp}`];

  const runAgent = async () => {
    setProcessing('Analyzing IP');
    setProgressSteps([]);
    try {
      await agentsAPI.ipStream(id, selectedOpp, (event) => {
        if (event.step === 'analyzing') {
          setProgressSteps((prev) => [...prev, event.message || 'Analyzing...']);
        } else if (event.step === 'complete') {
          setProgressSteps((prev) => [...prev, 'IP analysis complete!']);
          refresh();
          addToast('IP analysis complete!', 'success');
          setTimeout(() => setProcessing(''), 500);
        } else if (event.step === 'error') {
          addToast(event.message || 'IP analysis failed', 'error');
          setProcessing('');
        }
      });
    } catch (err: any) {
      addToast(err?.detail || 'IP analysis failed', 'error');
    } finally {
      setProcessing('');
    }
  };

  if (loading) return <Loading />;
  if (!project) return <NotFound />;

  return (
    <div className="max-w-5xl mx-auto">
      <Header project={project} title="IP Strategy Analysis" subtitle="Unit IV & V · Indian Patents Act, Trade Marks Act, Copyright Act" />

      {opportunities.length === 0 ? (
        <div className="card text-center py-12">
          <Shield size={40} className="mx-auto mb-4 text-brand-400/50" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Run Opportunity Discovery First</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Complete the Opportunities stage to unlock IP analysis.</p>
          <Link href={`/projects/${id}/opportunities`} className="btn-primary">
            Go to Opportunities
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <p className="text-sm text-[var(--text-secondary)]">Analyzing opportunity:</p>
            <select
              value={selectedOpp}
              onChange={(e) => setSelectedOpp(Number(e.target.value))}
              className="input text-sm py-1.5 max-w-xs"
            >
              {opportunities.map((o: any, i: number) => (
                <option key={i} value={i}>{o.title?.slice(0, 60)}</option>
              ))}
            </select>
          </div>

          {!ipAnalysis ? (
            <>
              <div className="card text-center py-12">
                <Shield size={40} className="mx-auto mb-4 text-brand-400/50" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Analyze IP Landscape</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                  Patent analysis under Indian Patents Act 1970, trademark strategy under Trade Marks Act 1999, trade secret and copyright protection.
                </p>
                <button onClick={runAgent} disabled={!!processing} className="btn-primary">
                  {processing ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                  {processing ? 'Analyzing...' : 'Run IP Analysis'}
                </button>
              </div>
              {progressSteps.length > 0 && (
                <div className="mt-4">
                  <ProgressSteps steps={progressSteps} isComplete={progressSteps[progressSteps.length - 1] === 'IP analysis complete!'} />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--text-secondary)]">Analysis for: <strong className="text-[var(--text-primary)]">{opportunities[selectedOpp]?.title}</strong></p>
                <div className="flex gap-2">
                  <button onClick={downloadPdf} disabled={exporting} className="btn-ghost text-xs">
                    {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    PDF
                  </button>
                  <button onClick={runAgent} disabled={!!processing} className="btn-ghost text-xs">
                    {processing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    Re-analyze
                  </button>
                </div>
              </div>

              {ipAnalysis.patent_analysis && (
                <div className="card">
                  <h2 className="font-semibold text-[var(--text-primary)] mb-3">Patent Analysis (Indian Patents Act 1970)</h2>
                  <p className="text-sm text-[var(--text-primary)] mb-3">{ipAnalysis.patent_analysis.patentability_assessment}</p>
                  {ipAnalysis.patent_analysis.section_3_considerations && (
                    <div className="mb-3 p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
                      <p className="text-xs text-yellow-400 font-medium">Section 3 Considerations</p>
                      <p className="text-xs text-[var(--text-secondary)]">{ipAnalysis.patent_analysis.section_3_considerations}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {ipAnalysis.patent_analysis.likely_cpc_codes?.length > 0 && (
                      <div>
                        <p className="text-xs text-[var(--text-muted)] mb-1">CPC Classifications</p>
                        <div className="flex flex-wrap gap-1">
                          {ipAnalysis.patent_analysis.likely_cpc_codes.map((c: string, i: number) => (
                            <span key={i} className="badge text-[10px] bg-blue-600/20 text-blue-400">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ipAnalysis.patent_analysis.prior_art_search_strategy && (
                      <div>
                        <p className="text-xs text-[var(--text-muted)] mb-1">Prior Art Strategy</p>
                        <p className="text-sm text-[var(--text-primary)]">{ipAnalysis.patent_analysis.prior_art_search_strategy}</p>
                      </div>
                    )}
                  </div>
                  {ipAnalysis.patent_analysis.filing_strategy && (
                    <div className="mt-4 p-3 bg-brand-600/10 border border-brand-600/30 rounded-lg">
                      <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">Filing Strategy</p>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div><span className="text-xs text-[var(--text-muted)]">Type</span><p className="text-[var(--text-primary)]">{ipAnalysis.patent_analysis.filing_strategy.type}</p></div>
                        <div><span className="text-xs text-[var(--text-muted)]">Jurisdictions</span><p className="text-[var(--text-primary)]">{(ipAnalysis.patent_analysis.filing_strategy.jurisdictions || []).join(', ')}</p></div>
                        <div><span className="text-xs text-[var(--text-muted)]">Est. Cost</span><p className="text-[var(--text-primary)]">{ipAnalysis.patent_analysis.filing_strategy.estimated_cost_inr || ipAnalysis.patent_analysis.filing_strategy.timeline}</p></div>
                      </div>
                      {ipAnalysis.patent_analysis.filing_strategy.startup_fee_discount && (
                        <p className="text-xs text-emerald-400 mt-2">{ipAnalysis.patent_analysis.filing_strategy.startup_fee_discount}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ipAnalysis.trademark_analysis && (
                  <div className="card">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2 text-sm">Trademark (Indian Act 1999)</h3>
                    <p className="text-xs text-[var(--text-secondary)] mb-2">{ipAnalysis.trademark_analysis.protectable_elements?.slice(0, 3).join(', ')}</p>
                    {ipAnalysis.trademark_analysis.nice_classes?.length > 0 && (
                      <p className="text-xs text-[var(--text-muted)]">Classes: {ipAnalysis.trademark_analysis.nice_classes.join(', ')}</p>
                    )}
                    {ipAnalysis.trademark_analysis.registration_strategy && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{ipAnalysis.trademark_analysis.registration_strategy}</p>
                    )}
                  </div>
                )}
                {ipAnalysis.trade_secret_analysis && (
                  <div className="card">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2 text-sm">Trade Secrets</h3>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Candidates: {ipAnalysis.trade_secret_analysis.trade_secret_candidates?.slice(0, 3).join(', ')}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{ipAnalysis.trade_secret_analysis.recommendation}</p>
                  </div>
                )}
                {ipAnalysis.copyright_analysis && (
                  <div className="card">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2 text-sm">Copyright (Indian Act 1957)</h3>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">{ipAnalysis.copyright_analysis.copyrightable_elements?.slice(0, 3).join(', ')}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{ipAnalysis.copyright_analysis.licensing_strategy}</p>
                  </div>
                )}
              </div>

              {ipAnalysis.ip_strategy && (
                <div className="card">
                  <h2 className="font-semibold text-[var(--text-primary)] mb-3">IP Strategy Roadmap for India</h2>
                  <p className="text-sm text-[var(--text-primary)] mb-4">{ipAnalysis.ip_strategy.portfolio_roadmap}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="kpi-card p-3">
                      <div className="kpi-value text-sm">{ipAnalysis.ip_strategy.budget_estimate}</div>
                      <div className="kpi-label">Budget</div>
                    </div>
                    <div className="kpi-card p-3">
                      <div className="kpi-value text-sm">{ipAnalysis.ip_strategy.timeline_months}mo</div>
                      <div className="kpi-label">Timeline</div>
                    </div>
                    <div className="kpi-card p-3">
                      <div className="kpi-value text-sm">{ipAnalysis.ip_strategy.estimated_ip_value}</div>
                      <div className="kpi-label">IP Value</div>
                    </div>
                    <div className="kpi-card p-3">
                      <div className="kpi-value text-sm text-capitalize">{ipAnalysis.ip_strategy.commercialization_path}</div>
                      <div className="kpi-label">Strategy</div>
                    </div>
                  </div>
                  {ipAnalysis.ip_strategy.key_recommendations?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-[var(--text-muted)] mb-2">Key Recommendations</p>
                      <ul className="space-y-1">
                        {ipAnalysis.ip_strategy.key_recommendations.map((r: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-primary)]">
                            <Check size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <NextButton href={`/projects/${id}/strategy`} label="Next: Business Strategy" />
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
