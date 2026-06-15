'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, FileText, Sparkles, Download, Check, GraduationCap, Briefcase, Users } from 'lucide-react';
import { agentsAPI } from '@/services/api';
import { useToastStore } from '@/store/useToastStore';
import { useProjectData } from '@/hooks/useProjectData';
import { ProgressSteps } from '@/components/ui/ProgressSteps';

function mdToHtml(text: string): string {
  let t = text;
  t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/__(.+?)__/g, '<strong>$1</strong>');
  t = t.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  t = t.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  t = t.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  t = t.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  t = t.replace(/^\[([^\]]+)\]\([^)]+\)/gm, '$1');
  t = t.replace(/^- (.+)$/gm, '• $1');
  t = t.replace(/\n{2,}/g, '</p><p>');
  t = '<p>' + t + '</p>';
  return t;
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { project, outputs, loading, refresh } = useProjectData(id);
  const { addToast } = useToastStore();
  const [processing, setProcessing] = useState('');
  const [progressSteps, setProgressSteps] = useState<string[]>([]);
  const [reportTemplate, setReportTemplate] = useState('academic');

  const report = outputs.report;

  const TEMPLATES = [
    { id: 'academic', label: 'Academic', icon: GraduationCap, desc: 'Curriculum-aligned for university submission' },
    { id: 'investor', label: 'Investor', icon: Briefcase, desc: 'Pitch-ready for angels and VCs' },
    { id: 'classroom', label: 'Classroom', icon: Users, desc: 'Engaging format for undergraduate teaching' },
  ];

  const runAgent = async () => {
    setProcessing('Generating Report');
    setProgressSteps([]);
    try {
      await agentsAPI.reportStream(id, (event) => {
        if (event.step === 'analyzing') {
          setProgressSteps((prev) => [...prev, event.message || 'Analyzing...']);
        } else if (event.step === 'complete') {
          setProgressSteps((prev) => [...prev, 'Report generation complete!']);
          refresh();
          addToast('Report generated!', 'success');
          setTimeout(() => setProcessing(''), 500);
        } else if (event.step === 'error') {
          addToast(event.message || 'Report generation failed', 'error');
          setProcessing('');
        }
      }, reportTemplate, (err: any) => {
        addToast(err?.detail || 'Report generation failed', 'error');
        setProcessing('');
      });
    } catch (err: any) {
      addToast(err?.detail || 'Report generation failed', 'error');
    } finally {
      setProcessing('');
    }
  };

  const handleExport = async (format: 'docx' | 'pdf') => {
    setProcessing(`Download ${format.toUpperCase()}`);
    try {
      const fn = format === 'docx' ? agentsAPI.exportDocx : agentsAPI.exportPdf;
      const blob = await fn(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eipr_case_study_${project?.title?.replace(/\s+/g, '_').toLowerCase() || 'report'}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      addToast(`${format.toUpperCase()} downloaded`, 'success');
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Export failed', 'error');
    } finally {
      setProcessing('');
    }
  };

  if (loading) return <Loading />;
  if (!project) return <NotFound />;

  return (
    <div className="max-w-5xl mx-auto">
      <Header project={project} title="EIPR Case Study Report" subtitle="All Units · India-focused academic EIPR case study" />

      {!report ? (
        <>
          <div className="card text-center py-12">
            <FileText size={40} className="mx-auto mb-4 text-brand-400/50" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Generate EIPR Case Study</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
              Synthesize all analysis into a publishable case study aligned with the EIPR curriculum for Indian universities.
              Covers Indian IP law, Startup India policies, and India-specific business context.
            </p>

            <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setReportTemplate(t.id)}
                  className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg border text-xs transition-all ${
                    reportTemplate === t.id
                      ? 'border-brand-500 bg-brand-600/10 text-brand-400'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-light)]'
                  }`}
                >
                  <t.icon size={18} />
                  <span className="font-medium">{t.label}</span>
                  <span className="text-[10px] opacity-70">{t.desc}</span>
                </button>
              ))}
            </div>

            <button onClick={runAgent} disabled={!!processing} className="btn-primary">
              {processing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {processing ? 'Generating...' : `Generate ${TEMPLATES.find(t => t.id === reportTemplate)?.label} Report`}
            </button>
          </div>
          {progressSteps.length > 0 && (
            <div className="mt-4">
              <ProgressSteps steps={progressSteps} isComplete={progressSteps[progressSteps.length - 1] === 'Report generation complete!'} />
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Report generated from all 5 stages of analysis</p>
            <div className="flex gap-2">
              <button onClick={() => handleExport('docx')} disabled={!!processing} className="btn-ghost text-xs">
                {processing === 'Download DOCX' ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                Download DOCX
              </button>
              <button onClick={() => handleExport('pdf')} disabled={!!processing} className="btn-ghost text-xs">
                {processing === 'Download PDF' ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                Download PDF
              </button>
            </div>
          </div>

          <div className="card">
            <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">{report.title}</h1>
            <div className="text-sm text-[var(--text-secondary)] italic mb-4 [&_strong]:text-brand-300" dangerouslySetInnerHTML={{ __html: mdToHtml(report.abstract || '') }} />

            {report.eipr_mapping && (
              <div className="flex flex-wrap gap-2 mb-6">
                {report.eipr_mapping.map((m: any, i: number) => (
                  <div key={i} className="card p-2 flex-1 min-w-[120px]">
                    <span className="badge-brand text-[10px]">Unit {m.unit}</span>
                    <p className="text-xs font-medium text-[var(--text-primary)] mt-1">{m.topic}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{m.coverage?.slice(0, 60)}...</p>
                  </div>
                ))}
              </div>
            )}

            {report.indian_legal_references?.length > 0 && (
              <div className="mb-4 p-3 bg-brand-600/10 border border-brand-600/30 rounded-lg">
                <p className="text-xs text-brand-400 font-medium mb-1">Indian Legal References</p>
                <div className="flex flex-wrap gap-1">
                  {report.indian_legal_references.map((ref: string, i: number) => (
                    <span key={i} className="badge text-[10px] bg-brand-600/20 text-brand-400">{ref}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {report.case_study && ['introduction', 'opportunity_analysis', 'business_strategy', 'ip_strategy', 'conclusion'].map((section) => (
            report.case_study[section] ? (
              <div key={section} className="card">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  {section.replace(/_/g, ' ')}
                </h2>
                <div className="text-sm text-[var(--text-primary)] leading-relaxed [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_strong]:text-brand-300 [&_em]:text-[var(--text-secondary)] [&_code]:text-xs [&_code]:bg-[var(--bg-tertiary)] [&_code]:px-1 [&_code]:rounded [&_p]:mb-2" dangerouslySetInnerHTML={{ __html: mdToHtml(report.case_study[section]) }} />
              </div>
            ) : null
          ))}

          {report.learning_outcomes?.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Learning Outcomes</h2>
              <ul className="space-y-2">
                {report.learning_outcomes.map((o: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                    <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.discussion_questions?.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Discussion Questions</h2>
              <ol className="space-y-2 list-decimal list-inside">
                {report.discussion_questions.map((q: string, i: number) => (
                  <li key={i} className="text-sm text-[var(--text-primary)]">{q}</li>
                ))}
              </ol>
            </div>
          )}

          {report.key_takeaways?.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Key Takeaways</h2>
              <div className="flex flex-wrap gap-2">
                {report.key_takeaways.map((t: string, i: number) => (
                  <span key={i} className="badge text-xs bg-brand-600/20 text-brand-400">{t}</span>
                ))}
              </div>
            </div>
          )}

          {report.government_scheme_alignment?.length > 0 && (
            <div className="card border-emerald-600/30 bg-emerald-600/5">
              <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">Government Scheme Alignment</h2>
              <div className="flex flex-wrap gap-2">
                {report.government_scheme_alignment.map((s: string, i: number) => (
                  <span key={i} className="badge text-xs bg-emerald-600/20 text-emerald-400">{s}</span>
                ))}
              </div>
            </div>
          )}

          {report.references?.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">References</h2>
              <ul className="space-y-1">
                {report.references.map((r: string, i: number) => (
                  <li key={i} className="text-xs text-[var(--text-muted)]">• {r}</li>
                ))}
              </ul>
            </div>
          )}

          {report.keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {report.keywords.map((k: string, i: number) => (
                <span key={i} className="badge text-[10px] bg-[var(--bg-hover)] text-[var(--text-secondary)]">{k}</span>
              ))}
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button onClick={() => handleExport('docx')} disabled={!!processing} className="btn-primary">
              {processing === 'Download DOCX' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download DOCX
            </button>
            <button onClick={() => handleExport('pdf')} disabled={!!processing} className="btn-primary">
              {processing === 'Download PDF' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download PDF
            </button>
          </div>
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

function Loading() {
  return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={24} className="animate-spin text-brand-400" /></div>;
}

function NotFound() {
  return <div className="text-center py-12"><p className="text-[var(--text-secondary)] mb-4">Project not found</p><Link href="/projects" className="btn-primary">Back to Projects</Link></div>;
}
