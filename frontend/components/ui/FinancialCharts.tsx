'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#eab308', '#22c55e', '#3b82f6', '#ef4444', '#a855f7', '#f97316', '#06b6d4', '#84cc16'];

function parseNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  let s = String(v).replace(/[₹,\s]/g, '');
  const lower = s.toLowerCase();
  if (lower.endsWith('cr')) {
    return parseFloat(lower.replace('cr', '')) * 10000000;
  }
  if (lower.endsWith('l')) {
    return parseFloat(lower.replace('l', '')) * 100000;
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function fmtNum(v: unknown): string {
  const n = parseNum(v);
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(0)}L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function collectBreakdowns(costs: any): { name: string; value: number }[] {
  const result: { name: string; value: number }[] = [];

  if (costs?.cost_breakdown?.length) {
    return costs.cost_breakdown.map((c: any) => ({ name: c.category || c.item || '-', value: parseNum(c.amount || c.cost) }));
  }

  for (const key of ['development_costs', 'marketing_costs', 'operations_personnel', 'legal_ip_costs', 'office_infrastructure']) {
    const section = costs?.[key];
    if (section?.breakdown?.length) {
      for (const item of section.breakdown) {
        result.push({ name: item.item || item.category || key.replace('_costs', '').replace('_', ' '), value: parseNum(item.amount || item.cost) });
      }
    } else if (section?.total) {
      result.push({ name: key.replace('_costs', '').replace(/_/g, ' ').trim(), value: parseNum(section.total) });
    }
  }

  const total = parseNum(costs?.total_initial_investment);
  if (total && !result.length) {
    for (const key of ['development', 'marketing', 'operations', 'legal_ip', 'office_infrastructure']) {
      const v = parseNum(costs?.[key]);
      if (v) result.push({ name: key.replace('_', ' '), value: v });
    }
    if (!result.length) {
      result.push({ name: 'Total Investment', value: total });
    }
  }

  return result;
}

export function RevenueChart({ revenue }: { revenue: any }) {
  const data = [
    { year: 'Year 1', ARR: parseNum(revenue?.year_1?.arr) },
    { year: 'Year 2', ARR: parseNum(revenue?.year_2?.arr) },
    { year: 'Year 3', ARR: parseNum(revenue?.year_3?.arr) },
  ];
  const maxVal = Math.max(...data.map(d => d.ARR), 1);
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Revenue Projections (INR)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="year" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
          <YAxis domain={[0, maxVal * 1.15]} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={fmtNum} />
          <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} formatter={fmtNum} />
          <Bar dataKey="ARR" fill="#eab308" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function QuarterlyChart({ quarterly }: { quarterly: any[] }) {
  if (!quarterly?.length) return null;
  const data = quarterly.map(q => ({ ...q, revenue: parseNum(q.revenue) }));
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Year 1 Quarterly Revenue</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="q" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={fmtNum} />
          <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} formatter={fmtNum} />
          <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CostBreakdownChart({ costs }: { costs: any }) {
  const data = collectBreakdowns(costs);
  if (!data.length) return null;

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Cost Breakdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
            {data.map((_: any, i: number) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={fmtNum} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
