'use client';

export default function HeroVisual() {
  return (
    <svg viewBox="0 0 600 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-lg mx-auto">
      <defs>
        <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="300" cy="140" rx="220" ry="110" fill="url(#glow)" />

      {[60, 150, 240, 330, 420].map((cx) => (
        <circle key={`bg-${cx}`} cx={cx + 60} cy={140} r="30" fill="#d97706" fillOpacity="0.03" />
      ))}

      <line x1="165" y1="140" x2="250" y2="140" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
      <line x1="350" y1="140" x2="435" y2="140" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />

      <line x1="95" y1="140" x2="160" y2="140" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
      <line x1="440" y1="140" x2="505" y2="140" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />

      {[
        { cx: 60, ry: 90, label: 'Idea', sub: null },
        { cx: 205, ry: 90, label: 'Scout', sub: 'Opportunity' },
        { cx: 300, ry: 90, label: 'IP', sub: 'Strategist' },
        { cx: 395, ry: 90, label: 'Business', sub: 'Architect' },
        { cx: 540, ry: 90, label: 'Report', sub: 'Generator' },
      ].map((node, i) => (
        <g key={node.label}>
          {i === 0 ? (
            <rect x={node.cx - 22} y={node.ry - 22} width="44" height="44" rx="12" fill="#d97706" fillOpacity="0.15" stroke="#fbbf24" strokeWidth="1.5" />
          ) : (
            <circle cx={node.cx} cy={node.ry} r="22" fill="#d97706" fillOpacity="0.15" stroke="#fbbf24" strokeWidth="1.5" />
          )}
          <text x={node.cx} y={node.ry + (i === 0 ? 5 : 5)} textAnchor="middle" fill="#fbbf24" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">
            {i === 0 ? '?' : i}
          </text>
          <text x={node.cx} y={node.ry + 38} textAnchor="middle" fill="#a0a0b8" fontSize="10" fontFamily="Inter, sans-serif">
            {node.label}
          </text>
          {node.sub && (
            <text x={node.cx} y={node.ry + 50} textAnchor="middle" fill="#6b6b80" fontSize="9" fontFamily="Inter, sans-serif">
              {node.sub}
            </text>
          )}
        </g>
      ))}

      {[
        { x1: 82, y1: 90, x2: 183, y2: 90 },
        { x1: 227, y1: 90, x2: 278, y2: 90 },
        { x1: 322, y1: 90, x2: 373, y2: 90 },
        { x1: 417, y1: 90, x2: 518, y2: 90 },
      ].map((arrow, i) => (
        <g key={`arrow-${i}`}>
          <line x1={arrow.x1} y1={arrow.y1} x2={arrow.x2} y2={arrow.y1} stroke="#6b6b80" strokeWidth="1" markerEnd="url(#arrowhead)" />
          <polygon points={`${arrow.x2},${arrow.y1 - 4} ${arrow.x2 + 6},${arrow.y1} ${arrow.x2},${arrow.y1 + 4}`} fill="#6b6b80" opacity="0.5" />
        </g>
      ))}
    </svg>
  );
}
