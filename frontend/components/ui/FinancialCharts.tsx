'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#eab308', '#22c55e', '#3b82f6', '#ef4444', '#a855f7', '#f97316'];

function fmt(v: unknown): string {
  if (typeof v === 'number') return `₹${v.toLocaleString('en-IN')}`;
  return String(v);
}

function fmtL(v: unknown): string {
  if (typeof v === 'number') return `₹${(v / 100000).toFixed(0)}L`;
  return String(v);
}

export function RevenueChart({ revenue }: { revenue: any }) {
  const data = [
    { year: 'Year 1', ARR: revenue?.year_1?.arr || 0 },
    { year: 'Year 2', ARR: revenue?.year_2?.arr || 0 },
    { year: 'Year 3', ARR: revenue?.year_3?.arr || 0 },
  ];
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Revenue Projections (INR)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="year" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={fmtL} />
          <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} formatter={fmt} />
          <Bar dataKey="ARR" fill="#eab308" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function QuarterlyChart({ quarterly }: { quarterly: any[] }) {
  if (!quarterly?.length) return null;
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Year 1 Quarterly Revenue</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={quarterly}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="q" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={fmtL} />
          <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} formatter={fmt} />
          <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CostBreakdownChart({ costs }: { costs: any }) {
  if (!costs?.cost_breakdown?.length) return null;
  const data = costs.cost_breakdown.map((c: any) => ({ name: c.category, value: c.amount }));
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Cost Breakdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
            {data.map((_: any, i: number) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={fmt} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
