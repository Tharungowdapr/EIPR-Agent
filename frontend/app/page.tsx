import Link from 'next/link';
import { Search, Shield, Briefcase, BarChart3, FileText, ArrowRight, Key, UserPlus, MessageSquare } from 'lucide-react';
import HeroVisual from '@/components/landing/HeroVisual';

const STEPS = [
  { icon: MessageSquare, title: 'Describe Your Idea', desc: 'Enter a business domain, product concept, or market problem. The more context you provide, the deeper the analysis.' },
  { icon: Search, title: 'Opportunity Scout', desc: 'AI scans for market gaps, unmet needs, and entrepreneurial opportunities using PESTEL and SWOT frameworks.' },
  { icon: Shield, title: 'IP Strategist', desc: 'Patent, trademark, copyright, and trade secret analysis mapped to EIPR curriculum concepts.' },
  { icon: Briefcase, title: 'Strategy & Finance', desc: 'SWOC, Porter\'s Five Forces, 4Ps, STP, UVP analysis plus financial feasibility and 3-year projections.' },
  { icon: FileText, title: 'Report Generator', desc: 'Compiles all agent outputs into a structured EIPR case study ready for PDF or DOCX export.' },
];

const FEATURES = [
  { icon: Search, label: 'Opportunity Scout', desc: 'Identifies market gaps and opportunities using structured frameworks like PESTEL and SWOT with actionable recommendations.' },
  { icon: Shield, label: 'IP Strategist', desc: 'Analyzes patents, trademarks, copyrights, and trade secrets. Maps findings to EIPR curriculum.' },
  { icon: Briefcase, label: 'Business Architect', desc: 'Delivers SWOC, Porter\'s Five Forces, 4Ps, STP, and UVP analysis with competitive positioning.' },
  { icon: BarChart3, label: 'Financial Analyst', desc: 'Revenue models, cost analysis, breakeven calculation, funding needs, and 3-year financial projections.' },
  { icon: FileText, label: 'Report Generator', desc: 'Produces a comprehensive EIPR case study report with all agent outputs in one document.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <header className="border-b border-[var(--border)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white text-sm font-bold">E</div>
            <span className="font-semibold text-[var(--text-primary)]">EIPR-Agent</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost">Sign In</Link>
            <Link href="/auth/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--brand)_0%,_transparent_70%)] opacity-[0.03] pointer-events-none" />
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-600/30 bg-brand-600/10 px-4 py-1.5 text-sm text-brand-400 mb-6">
                  AI-Powered EIPR Analysis Platform
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4 leading-tight">
                  Entrepreneurship & IP Rights
                  <span className="text-brand-400"> Intelligent Analysis</span>
                </h1>
                <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-xl mb-8">
                  Discover business opportunities, analyze intellectual property landscapes,
                  and generate EIPR-aligned case studies — all powered by a multi-agent AI system.
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <Link href="/auth/register" className="btn-primary text-base px-8 py-3 w-full sm:w-auto text-center">
                    Start Analyzing <ArrowRight size={16} />
                  </Link>
                  <Link href="/auth/login" className="btn-secondary text-base px-8 py-3 w-full sm:w-auto text-center">
                    Sign In
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <HeroVisual />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-t border-[var(--border)] py-16 md:py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">How It Works</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-3 max-w-2xl mx-auto">
                Five specialized AI agents work in sequence to transform your raw business idea into a structured EIPR case study.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {STEPS.map((step, i) => (
                <div key={step.title} className="card text-center group hover:border-brand-500/30 transition-all">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-600/10 flex items-center justify-center group-hover:bg-brand-600/20 transition-colors">
                      <step.icon size={22} className="text-brand-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold text-brand-400/60 uppercase tracking-wider">Step {i + 1}</span>
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-2">{step.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-[var(--border)] py-16 md:py-20 px-6 bg-[var(--bg-secondary)]/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Five Specialized Agents</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-3 max-w-2xl mx-auto">
                Each agent focuses on a distinct aspect of EIPR analysis, from opportunity identification to final report generation.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {FEATURES.map((item) => (
                <div key={item.label} className="card text-left group hover:border-brand-500/30 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-brand-600/10 flex items-center justify-center mb-4 group-hover:bg-brand-600/20 transition-colors">
                    <item.icon size={20} className="text-brand-400" />
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-2">{item.label}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="border-t border-[var(--border)] py-16 md:py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Getting Started</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-3 max-w-xl mx-auto">
                Everything you need to begin your first EIPR analysis. Free to use — no credit card required.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="card text-center group hover:border-brand-500/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-brand-600/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-600/20 transition-colors">
                  <UserPlus size={22} className="text-brand-400" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">1. Create Account</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Sign up with your email and password. Takes less than a minute.
                </p>
              </div>
              <div className="card text-center group hover:border-brand-500/30 transition-all relative">
                <div className="absolute -top-2 -right-2">
                  <span className="badge-warning text-[10px]">Required</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-600/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-600/20 transition-colors">
                  <Key size={22} className="text-brand-400" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">2. Add API Key</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Configure a free Groq API key (or any LLM provider) to power the AI agents.
                </p>
              </div>
              <div className="card text-center group hover:border-brand-500/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-brand-600/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-600/20 transition-colors">
                  <MessageSquare size={22} className="text-brand-400" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">3. Create Project</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Enter your business idea or domain and let the agents do the rest.
                </p>
              </div>
            </div>
            <div className="card bg-brand-600/[0.04] border-brand-600/20">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-semibold text-[var(--text-primary)]">Ready to start analyzing?</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Sign up free. Configure a free Groq API key. Create your first project in minutes.
                  </p>
                </div>
                <Link href="/auth/register" className="btn-primary flex-shrink-0 w-full sm:w-auto text-center">
                  Create Free Account <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-xs text-[var(--text-muted)]">
            Aligned with EIPR Curriculum &middot; 5 Units &middot; Multi-Agent AI
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} EIPR-Agent
          </div>
        </div>
      </footer>
    </div>
  );
}
