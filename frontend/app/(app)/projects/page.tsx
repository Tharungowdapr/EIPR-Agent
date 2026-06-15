'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FolderOpen, ChevronRight, Clock, Lightbulb, Shield, Briefcase, TrendingUp, FileText, Search } from 'lucide-react';
import { projectsAPI } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

const STAGE_ICONS: Record<string, React.ElementType> = {
  opportunities: Lightbulb, ip: Shield, strategy: Briefcase, finance: TrendingUp, report: FileText,
};
const STAGE_LABELS: Record<string, string> = {
  opportunities: 'Opportunities', ip: 'IP Analysis', strategy: 'Strategy', finance: 'Finance', report: 'Report',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    projectsAPI.list()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Projects</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your EIPR analysis projects</p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          <Plus size={14} /> New Analysis
        </Link>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text" className="input pl-9" placeholder="Search projects..."
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-20 opacity-50" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <FolderOpen size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-secondary)]">No projects found</p>
          <Link href="/projects/new" className="btn-primary mt-4 inline-flex">
            <Plus size={14} /> New Analysis
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => {
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
                    <span className="text-xs text-[var(--text-muted)]">{project.domain}</span>
                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Clock size={10} />
                      {project.updated_at ? formatDistanceToNow(new Date(project.updated_at), { addSuffix: true }) : ''}
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
  );
}
