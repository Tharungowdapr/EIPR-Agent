import Link from 'next/link';

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

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-600/30 bg-brand-600/10 px-4 py-1.5 text-sm text-brand-400 mb-8">
          AI-Powered EIPR Analysis Platform
        </div>
        <h1 className="text-5xl font-bold text-[var(--text-primary)] mb-4 leading-tight">
          Entrepreneurship & IP Rights
          <span className="text-brand-400"> Intelligent Analysis</span>
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mb-10">
          Discover business opportunities, analyze intellectual property landscapes, and generate EIPR-aligned case studies — all powered by a multi-agent AI system.
        </p>
        <div className="grid grid-cols-3 gap-6 w-full max-w-3xl mb-12">
          {[
            { label: 'Opportunity Discovery', desc: 'AI identifies market gaps and entrepreneurial opportunities', icon: '🔍' },
            { label: 'IP Strategy', desc: 'Patent, trademark & copyright analysis via MCP integration', icon: '🛡️' },
            { label: 'Business Planning', desc: 'SWOC, Porter\'s, 4Ps, STP, UVP & financial feasibility', icon: '📊' },
          ].map((item) => (
            <div key={item.label} className="card text-left">
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">{item.label}</h3>
              <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/register" className="btn-primary text-base px-8 py-3">
            Start Analyzing
          </Link>
          <Link href="/auth/login" className="btn-secondary text-base px-8 py-3">
            Watch Demo
          </Link>
        </div>
        <div className="mt-12 text-xs text-[var(--text-muted)]">
          Aligned with EIPR Curriculum • 5 Units • Multi-Agent AI • MCP-Integrated
        </div>
      </main>
    </div>
  );
}
