'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { projectsAPI } from '@/services/api';
import { useToastStore } from '@/store/useToastStore';
import { Loader2, Sparkles, FlaskConical, Layers } from 'lucide-react';

const SAMPLE_TOPICS = [
  {
    title: 'AI-Powered Healthcare Diagnostics',
    domain: 'HealthTech',
    inputText: 'I want to build an AI-powered diagnostic platform that helps doctors detect diseases from medical images (X-rays, MRIs, CT scans) with high accuracy, especially in rural areas where radiologists are scarce. The platform should integrate with existing hospital systems and work offline.',
    userContext: 'Team of 2 ML engineers and 1 doctor. Have access to anonymized medical imaging dataset from partner hospitals. Initial funding of $100K from health-tech accelerator. Based in Bangalore.',
    explanation: 'Tests the full pipeline on a deep-tech healthcare product. The AI will identify multiple business opportunities (B2B hospital SaaS, B2C patient app, tele-radiology service), analyze patent landscapes for medical AI algorithms, build a regulatory-compliant business strategy, project costs for clinical validation and FDA/ICMR approval, and generate an EIPR case study covering medical AI ethics.',
  },
  {
    title: 'Sustainable Packaging for E-Commerce',
    domain: 'CleanTech',
    inputText: 'An eco-friendly packaging solution for e-commerce companies using biodegradable materials made from agricultural waste. The packaging needs to be cost-competitive with plastic, water-resistant, and customizable for different product sizes.',
    userContext: 'Materials science researcher with 2 years of R&D on biopolymers. Have a patent-pending formulation. Need manufacturing partner. Located in Pune with access to agricultural waste supply chains.',
    explanation: 'Tests how the pipeline handles a materials-science innovation with existing IP. Good for demonstrating IP strategy (patent-pending technology, trade secrets for formulation), manufacturing-focused business planning, and financial analysis with R&D-heavy cost structures. Demonstrates Make in India / Atmanirbhar Bharat alignment.',
  },
  {
    title: 'Fintech for Gig Economy Workers',
    domain: 'FinTech',
    inputText: 'A financial platform for gig economy workers (delivery partners, freelancers, contract workers) that provides income smoothing loans, tax assistance, insurance, and savings tools. Most gig workers lack access to traditional banking due to irregular income.',
    userContext: 'Former delivery platform manager + fintech product manager. Understand gig worker pain points deeply. Have initial partnerships with 2 delivery platforms. Seeking ₹2 Cr seed funding.',
    explanation: 'Tests pipeline with a service-oriented platform business (vs deep-tech). Shows how the agents handle regulatory analysis (RBI compliance, NBFC licensing), partnership-based business models, and financial projections with unit economics (CAC, LTV, default rates). Good for understanding how user background/constraints influence opportunity recommendations.',
  },
  {
    title: 'Smart Water Management for Agriculture',
    domain: 'AgriTech',
    inputText: 'An IoT-based smart irrigation system that uses soil moisture sensors, weather data, and ML to optimize water usage for farms. Aims to reduce water consumption by 30-40% while increasing crop yield. Solar-powered for off-grid rural areas.',
    userContext: 'Team of agricultural engineers and IoT developers. Field-tested prototype on 5 farms in Maharashtra. Received grant from agricultural innovation fund. Need manufacturing and distribution partners.',
    explanation: 'Tests the pipeline with a hardware + IoT + ML product (multi-technology integration). Showcases how the agents analyze patent landscapes for IoT sensors and irrigation algorithms, build hardware manufacturing business plans, and create financial models with hardware BOM costs, installation revenue, and SaaS recurring revenue.',
  },
  {
    title: 'AI-Powered Plagiarism Detection for Academia',
    domain: 'EdTech',
    inputText: 'An advanced plagiarism detection tool for academic institutions that goes beyond text matching — it detects paraphrased content, AI-generated text, code plagiarism, and cross-language plagiarism. Designed specifically for Indian universities with support for regional languages.',
    userContext: 'Computer science PhD student with background in NLP. Have a working prototype tested on 10K research papers. Want to commercialize as a SaaS product for universities. Team of 3.',
    explanation: 'Tests the pipeline on a SaaS product with strong NLP/AI components. Good for demonstrating white-space IP analysis (what patents exist in AI-detection space), B2B sales-focused business strategy, and subscription-based financial modeling. The regional language aspect tests the agents\' ability to handle market-specific differentiation.',
  },
];

type SampleTopic = typeof SAMPLE_TOPICS[0];

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [inputText, setInputText] = useState('');
  const [userContext, setUserContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const { addToast } = useToastStore();
  const [batchLines, setBatchLines] = useState('');

  const loadSample = (topic: SampleTopic) => {
    setTitle(topic.title);
    setDomain(topic.domain);
    setInputText(topic.inputText);
    setUserContext(topic.userContext);
  };

  const toggleExpand = (title: string) => {
    setExpandedTopic(expandedTopic === title ? null : title);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchMode) {
      if (!batchLines.trim()) return;
      const domains = batchLines.split('\n').map(l => l.trim()).filter(Boolean);
      if (domains.length === 0) return;
      setLoading(true);
      setError('');
      const created: string[] = [];
      try {
        for (const d of domains) {
          const p = await projectsAPI.create(d.slice(0, 60), d.split(/[,|]/)[0]?.trim() || 'General', d, '');
          created.push(p.id);
        }
        if (created.length > 0) {
          addToast(`Created ${created.length} project${created.length > 1 ? 's' : ''}`, 'success');
          router.push(`/projects/${created[created.length - 1]}`);
        }
      } catch (err: any) {
        setError(err?.response?.data?.detail || `Batch creation failed after ${created.length} projects`);
      } finally {
        setLoading(false);
      }
    } else {
      if (!title.trim() || !inputText.trim()) return;
      setLoading(true);
      setError('');
      try {
        const project = await projectsAPI.create(title, domain, inputText, userContext || undefined);
        router.push(`/projects/${project.id}`);
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to create project');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">New EIPR Analysis</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Enter a domain or idea, and EIPR-Agent will analyze opportunities, IP landscape, and generate a complete case study.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical size={14} className="text-brand-400" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Sample Topics</span>
          <span className="text-xs text-[var(--text-muted)]">— click to auto-fill the form</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SAMPLE_TOPICS.map((topic) => {
            const isExpanded = expandedTopic === topic.title;
            return (
              <div
                key={topic.title}
                className="text-left card card-hover p-3 border border-[var(--border)] hover:border-brand-600/50 transition-colors"
              >
                <button type="button" onClick={() => { loadSample(topic); toggleExpand(topic.title); }} className="w-full text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-brand-400 uppercase tracking-wider">{topic.domain}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">click to load</span>
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5">{topic.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{topic.inputText}</p>
                </button>
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{topic.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mb-3">
        <button
          type="button"
          onClick={() => setBatchMode(!batchMode)}
          className={`btn-ghost text-xs ${batchMode ? 'text-brand-400' : ''}`}
        >
          <Layers size={12} />
          {batchMode ? 'Switch to Single Mode' : 'Batch Mode (multiple domains)'}
        </button>
      </div>

      {batchMode ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card space-y-5">
            <div>
              <label className="label">Enter multiple domains/ideas (one per line)</label>
              <textarea
                className="textarea min-h-[200px]"
                placeholder={`AI-powered healthcare diagnostics
  sustainable packaging for e-commerce
  fintech for gig economy workers
  smart water management for agriculture`}
                value={batchLines} onChange={(e) => setBatchLines(e.target.value)} required
              />
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                Each line will create a separate project. We&apos;ll run opportunity discovery on each one.
              </p>
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="btn-primary w-full justify-center text-base py-3" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Layers size={18} />}
            {loading ? 'Creating Projects...' : `Create ${batchLines.split('\n').filter(Boolean).length || ''} Projects`}
          </button>
        </form>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-5">
          <div>
            <label className="label">Project Title</label>
            <input
              type="text" className="input" placeholder="e.g., AI-Powered Healthcare Platform"
              value={title} onChange={(e) => setTitle(e.target.value)} required
            />
          </div>

          <div>
            <label className="label">Domain / Industry</label>
            <input
              type="text" className="input" placeholder="e.g., Healthcare, Fintech, EdTech, CleanTech"
              value={domain} onChange={(e) => setDomain(e.target.value)}
            />
          </div>

          <div>
            <label className="label">
              Describe your domain or idea
              <span className="text-[var(--text-muted)] font-normal ml-1">— be as specific as possible</span>
            </label>
            <textarea
              className="textarea min-h-[160px]"
              placeholder={`Examples:
• "I want to explore opportunities in the online education space for professional certification in India"
• "An AI-powered plagiarism detection tool for academic institutions"
• "I have skills in machine learning and healthcare - what opportunities exist at this intersection?"
• "Sustainable packaging solutions for e-commerce"`}
              value={inputText} onChange={(e) => setInputText(e.target.value)} required
            />
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              Don&apos;t have a specific idea? Just describe a domain and we&apos;ll discover opportunities for you.
            </p>
          </div>

          <div>
            <label className="label">
              Your background / constraints (optional)
              <span className="text-[var(--text-muted)] font-normal ml-1">— helps personalize suggestions</span>
            </label>
            <textarea
              className="textarea min-h-[80px]"
              placeholder="e.g., I'm a computer science student with web dev skills, have $5K budget, team of 3 people"
              value={userContext} onChange={(e) => setUserContext(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" className="btn-primary w-full justify-center text-base py-3" disabled={loading}>
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Sparkles size={18} />
          )}
          {loading ? 'Analyzing...' : 'Discover Opportunities'}
        </button>

        <div className="text-center text-xs text-[var(--text-muted)]">
          <p>Analysis covers all 5 EIPR units: Entrepreneurship → Opportunity → Strategy → IP → Report</p>
        </div>
      </form>
      )}
    </div>
  );
}
