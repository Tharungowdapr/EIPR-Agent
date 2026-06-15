'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Loader2, Lightbulb, Shield, Briefcase, TrendingUp,
  FileText, Check, Sparkles, Trash2, ArrowRight,
} from 'lucide-react';
import { ComplianceChecklist } from '@/components/ui/ComplianceChecklist';
import { projectsAPI } from '@/services/api';
import { useToastStore } from '@/store/useToastStore';
import { useProjectData } from '@/hooks/useProjectData';
import { formatDistanceToNow } from 'date-fns';

const STAGES = [
  { id: 'opportunities', label: 'Opportunities', icon: Lightbulb, unit: 'Unit I & II', desc: 'Market gaps, entrepreneur types, feasibility' },
  { id: 'ip', label: 'IP Analysis', icon: Shield, unit: 'Unit IV & V', desc: 'Patents, trademarks, copyright under Indian law' },
  { id: 'strategy', label: 'Strategy', icon: Briefcase, unit: 'Unit II & III', desc: 'SWOC, Porter, 4Ps, India business plan' },
  { id: 'finance', label: 'Finance', icon: TrendingUp, unit: 'Unit III', desc: 'Startup costs, revenue, funding in INR' },
  { id: 'report', label: 'Report', icon: FileText, unit: 'All Units', desc: 'EIPR case study with India context' },
];

function StageCard({ stage, project, outputs, isCurrent }: { stage: typeof STAGES[0]; project: any; outputs: any; isCurrent: boolean }) {
  const hasData = {
    opportunities: (outputs.opportunities?.opportunities || []).length > 0,
    ip: !!outputs[`ip_analysis_0`],
    strategy: !!outputs[`business_plan_0`],
    finance: !!outputs[`financial_0`],
    report: !!outputs.report,
  }[stage.id];

  const Icon = stage.icon;

  return (
    <Link
      href={`/projects/${project.id}/${stage.id}`}
      className={`card flex items-center gap-4 py-4 px-5 transition-all group ${
        isCurrent ? 'border-brand-500 ring-1 ring-brand-500/30' : 'hover:border-brand-600/40'
      }`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
        hasData ? 'bg-emerald-600/20 text-emerald-400' : isCurrent ? 'bg-brand-600/20 text-brand-400' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
      }`}>
        {hasData ? <Check size={18} /> : <Icon size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`font-semibold text-sm ${hasData ? 'text-emerald-400' : isCurrent ? 'text-brand-400' : 'text-[var(--text-primary)]'}`}>
            {stage.label}
          </h3>
          <span className="text-[10px] text-[var(--text-muted)]">{stage.unit}</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{hasData ? 'Completed' : stage.desc}</p>
      </div>
      <ArrowRight size={16} className="text-[var(--text-muted)] group-hover:text-brand-400 transition-colors shrink-0" />
    </Link>
  );
}

export default function ProjectHubPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { project, outputs, loading, refresh } = useProjectData(params.id);
  const { addToast } = useToastStore();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this project and all its analysis data? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await projectsAPI.delete(params.id);
      addToast('Project deleted', 'success');
      router.push('/projects');
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to delete project', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-brand-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-secondary)] mb-4">Project not found</p>
        <Link href="/projects" className="btn-primary">Back to Projects</Link>
      </div>
    );
  }

  const currentIdx = STAGES.findIndex((s) => s.id === project.current_stage);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/projects" className="btn-ghost p-2">
          <ChevronLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{project.title}</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {project.domain} · Created {project.created_at ? formatDistanceToNow(new Date(project.created_at), { addSuffix: true }) : ''}
          </p>
        </div>
        <button onClick={handleDelete} disabled={deleting} className="btn-ghost text-xs text-red-400 hover:text-red-300">
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Delete
        </button>
      </div>

      <div className="mb-8">
        <p className="text-sm text-[var(--text-primary)] mb-1 font-medium">Analysis Progress</p>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          Each stage covers specific EIPR curriculum units. Start from Opportunities and proceed sequentially.
        </p>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {STAGES.map((s, i) => {
            const isActive = project.current_stage === s.id;
            const isDone = {
              opportunities: (outputs.opportunities?.opportunities || []).length > 0,
              ip: !!outputs[`ip_analysis_0`],
              strategy: !!outputs[`business_plan_0`],
              finance: !!outputs[`financial_0`],
              report: !!outputs.report,
            }[s.id];
            const Icon = s.icon;
            return (
              <Link key={s.id} href={`/projects/${project.id}/${s.id}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive ? 'bg-brand-600/20 text-brand-400' : isDone ? 'text-emerald-400' : 'text-[var(--text-muted)]'
                }`}
              >
                {isDone ? <Check size={12} /> : <Icon size={12} />}
                <span>{s.label}</span>
                {i < STAGES.length - 1 && <ChevronRight size={10} className="opacity-30" />}
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STAGES.map((s, i) => (
            <StageCard
              key={s.id}
              stage={s}
              project={project}
              outputs={outputs}
              isCurrent={i === currentIdx || (i <= currentIdx && !outputs[s.id === 'finance' ? 'financial_0' : s.id === 'strategy' ? 'business_plan_0' : s.id === 'ip' ? 'ip_analysis_0' : s.id === 'opportunities' ? 'opportunities' : 'report'])}
            />
          ))}
        </div>
      </div>

      {project.input_text && (
        <div className="card">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Original Description</p>
          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{project.input_text}</p>
          {project.user_context && (
            <>
              <div className="border-t border-[var(--border)] my-3" />
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">User Context</p>
              <p className="text-sm text-[var(--text-primary)]">{project.user_context}</p>
            </>
          )}
        </div>
      )}

      <div className="card mt-4">
        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Quick Tips</p>
        <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
          <li className="flex items-start gap-2">
            <Sparkles size={12} className="text-brand-400 mt-0.5 shrink-0" />
            Click any stage card above to start or continue the analysis
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight size={12} className="text-brand-400 mt-0.5 shrink-0" />
            Complete stages in order — each builds on the previous
          </li>
          <li className="flex items-start gap-2">
            <FileText size={12} className="text-brand-400 mt-0.5 shrink-0" />
            Download your final report as DOCX or PDF from the Report stage
          </li>
        </ul>
      </div>

      {project.domain && (
        <div className="mt-4">
          <ComplianceChecklist domain={project.domain} />
        </div>
      )}
    </div>
  );
}