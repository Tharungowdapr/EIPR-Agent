'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2, TrendingUp, RefreshCw, Download, BarChart3, PieChart, LineChart } from 'lucide-react';
import { RevenueChart, QuarterlyChart, CostBreakdownChart } from '@/components/ui/FinancialCharts';
import { agentsAPI } from '@/services/api';
import { useToastStore } from '@/store/useToastStore';
import { useProjectData } from '@/hooks/useProjectData';
import { ProgressSteps } from '@/components/ui/ProgressSteps';

function renderText(val: any, fallback: string = ''): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return val.map(v => renderText(v)).join(', ');
  if (val && typeof val === 'object') return JSON.stringify(val);
  return fallback;
}

function parseNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  let s = String(v).replace(/[₹,\s]/g, '');
  const lower = s.toLowerCase();
  if (lower.endsWith('cr')) return parseFloat(lower.replace('cr', '')) * 10000000;
  if (lower.endsWith('l')) return parseFloat(lower.replace('l', '')) * 100000;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function fmtNum(v: unknown): string {
  const n = parseNum(v);
  if (n === 0 && v != null && String(v).trim() !== '0') return String(v);
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(0)}L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function extractVal(obj: any, ...keys: string[]) {
  for (const k of keys) {
    if (obj?.[k] != null) return obj[k];
  }
  return null;
}

function renderItem(val: any): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object' && val.name) return val.name;
  if (val && typeof val === 'object' && val.scheme) return val.scheme;
  return renderText(val);
}

export default function FinancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { project, outputs, loading, refresh } = useProjectData(id);
  const { addToast } = useToastStore();
  const [processing, setProcessing] = useState('');
  const [selectedOpp, setSelectedOpp] = useState(0);
  const [progressSteps, setProgressSteps] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const opportunities = outputs.opportunities?.opportunities || [];
  const businessPlan = outputs[`business_plan_${selectedOpp}`];
  const financial = outputs[`financial_${selectedOpp}`];

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

  const runAgent = async () => {
    setProcessing('Generating Finance');
    setProgressSteps([]);
    try {
      await agentsAPI.financeStream(id, selectedOpp, (event) => {
        if (event.step === 'analyzing') {
          setProgressSteps((prev) => [...prev, event.message || 'Analyzing...']);
        } else if (event.step === 'complete') {
          setProgressSteps((prev) => [...prev, 'Financial analysis complete!']);
          refresh();
          addToast('Financial analysis generated!', 'success');
          setTimeout(() => setProcessing(''), 500);
        } else if (event.step === 'error') {
          addToast(event.message || 'Financial analysis failed', 'error');
          setProcessing('');
        }
      });
    } catch (err: any) {
      addToast(err?.detail || 'Financial analysis failed', 'error');
    } finally {
      setProcessing('');
    }
  };

  if (loading) return <Loading />;
  if (!project) return <NotFound />;

  return (
    <div className="max-w-5xl mx-auto">
      <Header project={project} title="Financial Feasibility" subtitle="Unit III · Startup costs, revenue, funding in INR" />

      {opportunities.length === 0 ? (
        <PrereqCard href={`/projects/${id}/opportunities`} message="Complete Opportunities and Strategy first" />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <p className="text-sm text-[var(--text-secondary)]">Finance for opportunity:</p>
            <select value={selectedOpp} onChange={(e) => setSelectedOpp(Number(e.target.value))} className="input text-sm py-1.5 max-w-xs">
              {opportunities.map((o: any, i: number) => (
                <option key={i} value={i}>{o.title?.slice(0, 60)}</option>
              ))}
            </select>
          </div>

          {!businessPlan ? (
            <div className="card text-center py-12">
              <TrendingUp size={40} className="mx-auto mb-4 text-brand-400/50" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Generate Strategy First</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Financial analysis is generated alongside business strategy.</p>
              <Link href={`/projects/${id}/strategy`} className="btn-primary">Go to Strategy</Link>
            </div>
          ) : !financial ? (
            <>
              <div className="card text-center py-12">
                <TrendingUp size={40} className="mx-auto mb-4 text-brand-400/50" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Run Financial Analysis</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-6">Generate financial projections, funding strategy, and key metrics.</p>
                <button onClick={runAgent} disabled={!!processing} className="btn-primary">
                  {processing ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                  {processing ? 'Generating...' : 'Generate Financial Analysis'}
                </button>
              </div>
              {progressSteps.length > 0 && (
                <div className="mt-4">
                  <ProgressSteps steps={progressSteps} isComplete={progressSteps[progressSteps.length - 1] === 'Financial analysis complete!'} />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--text-secondary)]">
                  Finance for: <strong className="text-[var(--text-primary)]">{opportunities[selectedOpp]?.title}</strong>
                </p>
                <div className="flex gap-2">
                  <button onClick={downloadPdf} disabled={exporting} className="btn-ghost text-xs">
                    {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    PDF
                  </button>
                  <button onClick={runAgent} disabled={!!processing} className="btn-ghost text-xs">
                    {processing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Re-run
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="kpi-card p-3">
                  <div className="kpi-value text-sm">{fmtNum(extractVal(financial.startup_costs, 'total_initial_investment', 'total'))}</div>
                  <div className="kpi-label">Initial Investment</div>
                </div>
                <div className="kpi-card p-3">
                  <div className="kpi-value text-sm text-emerald-400">{fmtNum(financial.revenue_projections?.year_1?.arr)}</div>
                  <div className="kpi-label">Year 1 ARR</div>
                </div>
                <div className="kpi-card p-3">
                  <div className="kpi-value text-sm">{extractVal(financial.break_even_analysis, 'break_even_months', 'break_even_timeline_months') || '-'}mo</div>
                  <div className="kpi-label">Break-even</div>
                </div>
                <div className="kpi-card p-3">
                  <div className="kpi-value text-sm text-brand-400">{financial.funding_strategy?.investor_readiness_score || '-'}/10</div>
                  <div className="kpi-label">Investor Readiness</div>
                </div>
              </div>

              <div className="card">
                <h2 className="font-semibold text-[var(--text-primary)] mb-3">Startup Costs (INR)</h2>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Development', key: 'development' },
                    { label: 'Marketing', key: 'marketing' },
                    { label: 'Operations', key: 'operations' },
                    { label: 'Legal & IP', key: 'legal_ip' },
                    { label: 'Office & Infrastructure', key: 'office_infrastructure' },
                  ].map(({ label, key }) => (
                    financial.startup_costs?.[key] !== undefined && (
                      <div key={key} className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">{label}</span>
                        <span className="text-[var(--text-primary)]">{fmtNum(financial.startup_costs[key])}</span>
                      </div>
                    )
                  ))}
                  <div className="border-t border-[var(--border)] pt-2 flex justify-between font-semibold">
                    <span className="text-[var(--text-primary)]">Total Investment</span>
                    <span className="text-brand-400">{fmtNum(financial.startup_costs?.total_initial_investment)}</span>
                  </div>
                  {financial.startup_costs?.monthly_burn_rate && (
                    <div className="flex justify-between text-xs text-[var(--text-muted)]">
                      <span>Monthly Burn Rate</span>
                      <span>{fmtNum(financial.startup_costs.monthly_burn_rate)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <h2 className="font-semibold text-[var(--text-primary)] mb-3">Revenue Projections</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['year_1', 'year_2', 'year_3'].map((y) => {
                    const data = financial.revenue_projections?.[y];
                    const arr = data?.arr || data?.total_revenue || data?.projected_revenue;
                    return (
                      <div key={y} className="text-center">
                        <p className="text-xs text-[var(--text-muted)]">{y.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">{fmtNum(arr)}</p>
                        <p className="text-xs text-[var(--text-muted)]">ARR</p>
                      </div>
                    );
                  })}
                </div>
                {financial.revenue_projections?.year_1?.quarterly_breakdown && (
                  <div className="mt-4">
                    <p className="text-xs text-[var(--text-muted)] mb-2">Year 1 Quarterly</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {financial.revenue_projections.year_1.quarterly_breakdown.map((q: any, i: number) => (
                        <div key={i} className="card p-2 text-center">
                          <p className="text-[10px] text-[var(--text-muted)]">{q.q || q.quarter || `Q${i + 1}`}</p>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{fmtNum(q.revenue || q.amount || q.projection)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="card">
                <h2 className="font-semibold text-[var(--text-primary)] mb-3">Funding Strategy (India)</h2>
                <div className="grid grid-cols-2 gap-4">
                  {financial.funding_strategy?.recommended_mix && (
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">Recommended Mix</p>
                      <div className="space-y-1 text-sm">
                        {Object.entries(financial.funding_strategy.recommended_mix).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-[var(--text-secondary)] capitalize">{k.replace(/_/g, ' ')}</span>
                            <span className="text-[var(--text-primary)]">{renderText(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {financial.funding_strategy?.funding_roadmap && (
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">Funding Roadmap</p>
                      {Array.isArray(financial.funding_strategy.funding_roadmap) ? (
                        <div className="space-y-2 text-sm">
                          {financial.funding_strategy.funding_roadmap.map((step: any, i: number) => (
                            <div key={i} className="p-2 bg-[var(--bg-tertiary)] rounded text-xs">
                              {step.stage && <p className="font-medium text-[var(--text-primary)]">{step.stage}</p>}
                              {step.milestone && <p className="text-[var(--text-muted)]">{step.milestone}</p>}
                              {(step.source || step.amount) && (
                                <p className="text-[var(--text-secondary)]">{step.source && `Source: ${step.source}`}{step.amount && ` · ${fmtNum(step.amount)}`}</p>
                              )}
                              {step.months && <p className="text-[var(--text-muted)]">Timeline: {step.months}{typeof step.months === 'number' ? ' months' : ''}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--text-primary)]">{renderText(financial.funding_strategy.funding_roadmap)}</p>
                      )}
                    </div>
                  )}
                </div>
                {financial.funding_strategy?.indian_grant_eligibility?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Indian Grant Eligibility</p>
                    <div className="flex flex-wrap gap-1">
                      {financial.funding_strategy.indian_grant_eligibility.map((g: any, i: number) => (
                        <span key={i} className="badge text-xs bg-emerald-600/20 text-emerald-400">{renderItem(g)}</span>
                      ))}
                    </div>
                  </div>
                )}
                {financial.funding_strategy?.recommended_investors?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Recommended Investors</p>
                    <div className="flex flex-wrap gap-1">
                      {financial.funding_strategy.recommended_investors.map((inv: any, i: number) => (
                        <span key={i} className="badge text-xs bg-brand-600/20 text-brand-400">{renderItem(inv)}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="card">
                <h2 className="font-semibold text-[var(--text-primary)] mb-3">Financial Metrics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {extractVal(financial.financial_metrics?.gross_margin, 'percentage', 'pct', 'gross_margin_pct') !== undefined && (
                    <div><span className="text-xs text-[var(--text-muted)]">Gross Margin</span><p className="font-medium">{extractVal(financial.financial_metrics?.gross_margin, 'percentage', 'pct', 'gross_margin_pct')}%</p></div>
                  )}
                  {financial.financial_metrics?.cac !== undefined && (
                    <div><span className="text-xs text-[var(--text-muted)]">CAC</span><p className="font-medium">{fmtNum(financial.financial_metrics.cac)}</p></div>
                  )}
                  {financial.financial_metrics?.ltv !== undefined && (
                    <div><span className="text-xs text-[var(--text-muted)]">LTV</span><p className="font-medium">{fmtNum(financial.financial_metrics.ltv)}</p></div>
                  )}
                  {extractVal(financial.financial_metrics?.customer_metrics, 'ltv_cac_ratio') || financial.financial_metrics?.ltv_cac_ratio !== undefined && (
                    <div><span className="text-xs text-[var(--text-muted)]">LTV:CAC</span><p className="font-medium">{extractVal(financial.financial_metrics?.customer_metrics, 'ltv_cac_ratio') || financial.financial_metrics?.ltv_cac_ratio}x</p></div>
                  )}
                  {extractVal(financial.financial_metrics, 'payback_period_months', 'payback_period') !== undefined && (
                    <div><span className="text-xs text-[var(--text-muted)]">Payback</span><p className="font-medium">{extractVal(financial.financial_metrics, 'payback_period_months', 'payback_period')}mo</p></div>
                  )}
                  {extractVal(financial.financial_metrics?.roi_projection, 'three_year_roi_pct') || financial.financial_metrics?.roi_year_3_pct !== undefined && (
                    <div><span className="text-xs text-[var(--text-muted)]">Year 3 ROI</span><p className="font-medium text-emerald-400">{extractVal(financial.financial_metrics?.roi_projection, 'three_year_roi_pct') || financial.financial_metrics?.roi_year_3_pct}%</p></div>
                  )}
                  {financial.financial_metrics?.net_margin_year_1 !== undefined && (
                    <div><span className="text-xs text-[var(--text-muted)]">Y1 Margin</span><p className="font-medium">{financial.financial_metrics.net_margin_year_1}%</p></div>
                  )}
                  {financial.financial_metrics?.net_margin_year_3 !== undefined && (
                    <div><span className="text-xs text-[var(--text-muted)]">Y3 Margin</span><p className="font-medium text-emerald-400">{financial.financial_metrics.net_margin_year_3}%</p></div>
                  )}
                </div>
                {financial.financial_metrics?.tax_considerations && (
                  <div className="mt-3 p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
                    <p className="text-xs text-yellow-400 font-medium">Tax Considerations</p>
                    <p className="text-xs text-[var(--text-secondary)]">{renderText(financial.financial_metrics.tax_considerations)}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RevenueChart revenue={financial.revenue_projections} />
                <CostBreakdownChart costs={financial.startup_costs} />
                <div className="md:col-span-2">
                  <QuarterlyChart quarterly={financial.revenue_projections?.year_1?.quarterly_breakdown} />
                </div>
              </div>

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
