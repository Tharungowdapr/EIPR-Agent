'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen, ChevronRight, Clock, Lightbulb, Shield, Briefcase, FileText, TrendingUp, Settings, Key } from 'lucide-react';
import { projectsAPI, mlopsAPI } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';

const STAGE_ICONS: Record<string, React.ElementType> = {
  opportunities: Lightbulb, ip: Shield, strategy: Briefcase, finance: TrendingUp, report: FileText,
};

const STAGE_LABELS: Record<string, string> = {
  opportunities: 'Opportunities', ip: 'IP Analysis', strategy: 'Strategy', finance: 'Finance', report: 'Report',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    Promise.all([
      projectsAPI.list(),
      mlopsAPI.getStats().catch(() => null),
    ]).then(([p, s]) => {
      setProjects(p);
      setStats(s);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Discover opportunities, analyze IP, and generate EIPR case studies.
        </p>
      </div>

      {mounted && user && !user.has_api_keys && (
        <div className="mb-6 card bg-amber-600/[0.06] border border-amber-600/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600/20 flex-shrink-0 mt-0.5">
                <Key size={18} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-400 text-sm">Configure Your AI Provider</h3>
                <p className="text-xs text-amber-400/70 mt-1 max-w-md">
                  AI agents need an LLM provider to run. Add a free Groq API key to enable analysis and report generation.
                </p>
              </div>
            </div>
            <Link href="/settings/llm" className="btn-primary text-sm whitespace-nowrap flex-shrink-0 w-full sm:w-auto text-center">
              <Settings size={14} /> Configure Now
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link href="/projects/new" className="card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600/20">
              <Plus size={18} className="text-brand-400" />
            </div>
            <span className="font-medium text-[var(--text-primary)]">New Analysis</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Start with a domain or idea
          </p>
        </Link>
        <div className="kpi-card">
          <div className="kpi-value">{stats?.total_runs || 0}</div>
          <div className="kpi-label">Total Agent Runs</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{stats?.success_rate || 0}%</div>
          <div className="kpi-label">Success Rate</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{projects.length}</div>
          <div className="kpi-label">Projects</div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--text-primary)]">Recent Projects</h2>
          <Link href="/projects" className="text-xs text-brand-400 hover:text-brand-300">View all</Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse h-20 opacity-50" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="card text-center py-12">
            <FolderOpen size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-secondary)]">No projects yet</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Create your first EIPR analysis to get started</p>
            <Link href="/projects/new" className="btn-primary mt-4 inline-flex">
              <Plus size={14} /> New Analysis
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 5).map((project) => {
              const StageIcon = STAGE_ICONS[project.current_stage] || Lightbulb;
              const stageLabel = STAGE_LABELS[project.current_stage] || project.current_stage;
              return (
                <Link key={project.id} href={`/projects/${project.id}`}
                  className="card flex items-center gap-4 hover:border-brand-500/30 hover:bg-[var(--bg-hover)] transition-all cursor-pointer group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10 flex-shrink-0">
                    <StageIcon size={16} className="text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[var(--text-primary)] truncate">{project.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="badge-brand">{stageLabel}</span>
                      <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <Clock size={10} />
                        {project.updated_at
                          ? formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })
                          : 'recently'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:text-brand-400 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {stats?.agent_breakdown && stats.agent_breakdown.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">Agent Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {stats.agent_breakdown.map((agent: any) => (
              <div key={agent.agent_name} className="card text-center">
                <p className="text-lg font-bold text-brand-400">{agent.runs}</p>
                <p className="text-xs text-[var(--text-muted)] capitalize">{agent.agent_name.replace(/_/g, ' ')}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{agent.avg_latency_ms}ms avg</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
