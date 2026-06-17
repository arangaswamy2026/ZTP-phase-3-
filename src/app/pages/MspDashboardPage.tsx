import { useMemo, useState } from 'react';
import {
  Download,
  Users,
  Globe,
  Shield,
  Monitor,
  Box,
  ArrowRight,
} from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────

const STAT_CARDS = [
  { icon: Users,   label: 'Active Tenants',    value: '4',     unit: '/ 5',  sub: '1 pending setup' },
  { icon: Globe,   label: 'Total Web Traffic', tag: '30D', value: '13.7M', trend: { text: '24% vs prior period', up: true, good: true } },
  { icon: Shield,  label: 'Threats Blocked',   tag: '30D', value: '1,730', accent: true, trend: { text: '14% vs prior period', up: true, good: false } },
  { icon: Monitor, label: 'Endpoints Online',  value: '49',    unit: '/ 72', sub: '68% coverage' },
  { icon: Box,     label: 'Licenses',          value: '290',   sub: 'across 5 tenants' },
];

const THREAT_BREAKDOWN = [
  { label: 'Unauthorized Access Attempt',      count: 584, severity: 'HIGH',     color: '#f97316' },
  { label: 'Non-Compliant Device Blocked',     count: 449, severity: 'MEDIUM',   color: '#f97316' },
  { label: 'C2 Attempts',                      count: 51,  severity: 'CRITICAL', color: '#ef4444' },
  { label: 'Port Scanning / Lateral Movement', count: 32,  severity: 'CRITICAL', color: '#ef4444' },
  { label: 'DNS-Based Threat',                 count: 201, severity: 'MEDIUM',   color: '#d97706' },
  { label: 'MFA Challenge Failed / Bypassed',  count: 229, severity: 'HIGH',     color: '#f97316' },
  { label: 'Geo / Location-Based Block',       count: 184, severity: 'MEDIUM',   color: '#d97706' },
];

const TOP_TENANTS = [
  { name: 'Acme Corporation',      color: '#6366f1', total: 1237, critical: 47, high: 583, medium: 607 },
  { name: 'Enterprise Solutions',  color: '#0ea5e9', total: 248,  critical: 18, high: 116, medium: 114 },
  { name: 'Global Services LLC',   color: '#10b981', total: 156,  critical: 11, high: 76,  medium: 69  },
  { name: 'Riverside Dental Office', color: '#f59e0b', total: 89, critical: 7,  high: 38,  medium: 44  },
  { name: 'Cloud Innovations',     color: '#9ca3af', total: 0,    critical: 0,  high: 0,   medium: 0   },
];

// Deterministic 30-day daily web-traffic series per tenant (LCG-seeded so the
// chart is stable across re-renders). Values are request counts per day.
function genSeries(seed: number, base: number, amp: number): number[] {
  let s = seed;
  const out: number[] = [];
  for (let i = 0; i < 30; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const r = s / 0x7fffffff;
    const weekend = i % 7 === 5 || i % 7 === 6 ? 0.62 : 1;       // dip on weekends
    const drift = 1 + (i / 29) * 0.18;                          // gentle upward trend
    out.push(Math.max(0, Math.round((base * weekend * drift) + (r - 0.5) * amp)));
  }
  return out;
}

const TRAFFIC_SERIES = [
  { name: 'Global Services LLC',    color: '#10b981', data: genSeries(7, 168000, 52000) },
  { name: 'Enterprise Solutions',  color: '#0ea5e9', data: genSeries(23, 138000, 44000) },
  { name: 'Acme Corporation',      color: '#6366f1', data: genSeries(41, 101000, 38000) },
  { name: 'Riverside Dental Office', color: '#f59e0b', data: genSeries(59, 41000, 16000) },
  { name: 'Cloud Innovations',     color: '#9ca3af', data: new Array(30).fill(0) },
];

const TOP_DOMAINS = [
  { domain: 'office365.com',   badge: 'Known',     requests: '1,402,031', tenants: 4, trend: '6%',  dir: 'up'     },
  { domain: 'salesforce.com',  badge: 'Known',     requests: '551,090',   tenants: 2, trend: '11%', dir: 'up'     },
  { domain: 'dentrix.com',     badge: 'Known',     requests: '234,112',   tenants: 1, trend: '3%',  dir: 'down'   },
  { domain: 'quickbooks.com',  badge: 'Known',     requests: '198,447',   tenants: 3, trend: 'stable', dir: 'flat' },
  { domain: 'dropbox.com',     badge: 'Shadow IT', requests: '162,120',   tenants: 3, trend: '42%', dir: 'up'     },
];

const INVENTORY = [
  { name: 'Acme Corporation',       tier: 'Premier',   licenses: 50,  expiry: '09 Jul 2026', renew: 'Renew · 35d left', expiryRed: false, firmware: '7.1.2' },
  { name: 'Enterprise Solutions',   tier: 'Advanced',  licenses: 120, expiry: '18 Jun 2026', renew: 'Renew · 14d left', expiryRed: true,  firmware: '7.1.2' },
  { name: 'Global Services LLC',    tier: 'Advanced',  licenses: 80,  expiry: '12 Aug 2026', renew: '',                 expiryRed: false, firmware: 'Unknown' },
  { name: 'Riverside Dental Office', tier: 'Essential', licenses: 20, expiry: '02 May 2026', renew: '', expired: true,  expiryRed: false, firmware: '7.0.9' },
];

const TIER_STYLE: Record<string, string> = {
  Premier:   'bg-yellow-50 text-yellow-700',
  Advanced:  'bg-purple-50 text-purple-700',
  Essential: 'bg-blue-50 text-blue-700',
};

const TENANT_BREAKDOWN = [
  { name: 'Acme Corporation',       status: 'Active',        endpoints: '12 / 18', policies: 10, traffic: '3,084,358', threats: '1,237', activity: '2 hrs ago',  action: 'View' },
  { name: 'Enterprise Solutions',   status: 'Active',        endpoints: '18 / 22', policies: 14, traffic: '4,201,740', threats: '248',   activity: '5 min ago',  action: 'View' },
  { name: 'Global Services LLC',    status: 'Active',        endpoints: '12 / 20', policies: 14, traffic: '5,129,002', threats: '156',   activity: '18 min ago', action: 'View' },
  { name: 'Riverside Dental Office', status: 'Active',       endpoints: '7 / 12',  policies: 6,  traffic: '1,250,400', threats: '89',    activity: '42 min ago', action: 'View' },
  { name: 'Cloud Innovations',      status: 'Pending Setup', endpoints: '— / —',   policies: '—', traffic: '—',       threats: '—',     activity: '—',          action: 'Continue Setup' },
];

// ── Sub-components ──────────────────────────────────────────────────────────────

function SectionHeader({ title, sub, link }: { title: string; sub?: string; link?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold text-gray-900">
        {title}{sub && <span className="ml-2 text-xs font-normal text-gray-400">{sub}</span>}
      </h2>
      {link && (
        <button className="text-sm font-medium text-blue-600 hover:underline inline-flex items-center gap-1">
          {link} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function SevPill({ severity }: { severity: string }) {
  const style =
    severity === 'CRITICAL' ? 'bg-red-50 text-red-600' :
    severity === 'HIGH'     ? 'bg-orange-50 text-orange-700' :
                              'bg-yellow-50 text-yellow-700';
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${style} w-16 text-center`}>
      {severity}
    </span>
  );
}

function TrendCell({ trend, dir }: { trend: string; dir: string }) {
  if (dir === 'up')   return <span className="text-xs font-semibold text-red-500">▲ {trend}</span>;
  if (dir === 'down') return <span className="text-xs font-semibold text-green-600">▼ {trend}</span>;
  return <span className="text-xs font-medium text-gray-400">— {trend}</span>;
}

function DonutChart() {
  // 89% allowed (green), 11% blocked (red). Circumference for r=40 ≈ 251.33.
  const r = 40;
  const c = 2 * Math.PI * r;
  const allowed = 0.89;
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#ef4444" strokeWidth="10" />
      <circle
        cx="48" cy="48" r={r} fill="none" stroke="#22c55e" strokeWidth="10"
        strokeDasharray={`${c * allowed} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
      />
      <text x="48" y="53" textAnchor="middle" className="fill-gray-900" style={{ fontSize: 18, fontWeight: 700 }}>
        89%
      </text>
    </svg>
  );
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function TrafficLineChart() {
  const [hover, setHover] = useState<number | null>(null);

  const W = 820, H = 300;
  const padL = 52, padR = 16, padT = 16, padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const days = 30;

  const maxY = useMemo(() => {
    const peak = Math.max(...TRAFFIC_SERIES.flatMap((s) => s.data));
    return Math.ceil(peak / 50000) * 50000; // round up to nearest 50k
  }, []);

  const x = (i: number) => padL + (i / (days - 1)) * innerW;
  const y = (v: number) => padT + innerH - (v / maxY) * innerH;

  const yTicks = 4;
  const xLabels = [0, 4, 9, 14, 19, 24, 29];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="text-sm font-bold text-gray-900">
          Web Traffic Trend <span className="text-xs font-normal text-gray-400">· requests / day · last 30 days</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {TRAFFIC_SERIES.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-3 h-0.5 rounded-full" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 300 }}>
          {/* horizontal gridlines + y labels */}
          {Array.from({ length: yTicks + 1 }, (_, i) => {
            const val = (maxY / yTicks) * i;
            const yy = y(val);
            return (
              <g key={i}>
                <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="#f1f5f9" strokeWidth={1} />
                <text x={padL - 8} y={yy + 3.5} textAnchor="end" className="fill-gray-400" style={{ fontSize: 10 }}>
                  {fmtK(val)}
                </text>
              </g>
            );
          })}

          {/* x labels */}
          {xLabels.map((i) => (
            <text key={i} x={x(i)} y={H - 10} textAnchor="middle" className="fill-gray-400" style={{ fontSize: 10 }}>
              Day {i + 1}
            </text>
          ))}

          {/* lines */}
          {TRAFFIC_SERIES.map((s) => {
            if (s.data.every((d) => d === 0)) return null; // skip flat-zero (pending tenant)
            const d = s.data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
            return <path key={s.name} d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />;
          })}

          {/* hover guide + dots */}
          {hover !== null && (
            <>
              <line x1={x(hover)} y1={padT} x2={x(hover)} y2={padT + innerH} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />
              {TRAFFIC_SERIES.filter((s) => !s.data.every((d) => d === 0)).map((s) => (
                <circle key={s.name} cx={x(hover)} cy={y(s.data[hover])} r={3.5} fill="#fff" stroke={s.color} strokeWidth={2} />
              ))}
            </>
          )}

          {/* hover capture overlay */}
          <rect
            x={padL} y={padT} width={innerW} height={innerH} fill="transparent"
            onMouseMove={(e) => {
              const rect = (e.target as SVGRectElement).getBoundingClientRect();
              const rel = (e.clientX - rect.left) / rect.width;
              setHover(Math.max(0, Math.min(days - 1, Math.round(rel * (days - 1)))));
            }}
            onMouseLeave={() => setHover(null)}
          />
        </svg>

        {/* tooltip */}
        {hover !== null && (
          <div
            className="absolute top-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2.5 pointer-events-none z-10"
            style={{ left: `${(((padL + (hover / (days - 1)) * innerW) / W) * 100)}%`, transform: 'translateX(-50%)' }}
          >
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Day {hover + 1}</div>
            <div className="space-y-1">
              {TRAFFIC_SERIES.filter((s) => !s.data.every((d) => d === 0)).map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-xs whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-gray-500 flex-1">{s.name}</span>
                  <span className="font-semibold text-gray-900 tabular-nums">{fmtK(s.data[hover])}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────

export function MspDashboardPage() {
  const maxThreat = Math.max(...THREAT_BREAKDOWN.map((t) => t.count));
  const maxTenant = Math.max(...TOP_TENANTS.map((t) => t.total), 1);

  return (
    <div className="space-y-7 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">MSP Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Consolidated Zero Trust posture across all managed tenants</p>
      </div>

      {/* Download banner */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">Download Unified Client</div>
            <div className="text-xs text-gray-500 mt-0.5">Deploy the unified security agent to all enabled tenants to ensure full zero trust compliance.</div>
          </div>
        </div>
        <button className="h-9 px-4 text-sm font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors whitespace-nowrap">
          View Details
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                <Icon className="w-3.5 h-3.5" />
                {card.label}
                {card.tag && <span className="text-gray-300 normal-case font-medium">{card.tag}</span>}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className={`text-[28px] font-bold leading-none ${card.accent ? 'text-red-500' : 'text-gray-900'}`}>{card.value}</span>
                {card.unit && <span className="text-base font-medium text-gray-400">{card.unit}</span>}
              </div>
              {card.trend && (
                <div className={`text-xs font-medium mt-1.5 ${card.trend.good ? 'text-green-600' : 'text-red-500'}`}>
                  {card.trend.up ? '↑' : '↓'} {card.trend.text}
                </div>
              )}
              {card.sub && <div className="text-xs text-gray-400 mt-1.5">{card.sub}</div>}
            </div>
          );
        })}
      </div>

      {/* Web Traffic Trend */}
      <TrafficLineChart />

      {/* Blocked Threats */}
      <div>
        <SectionHeader title="Blocked Threats" sub="Last 30 days" link="View all threats" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Threat type breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-sm font-bold text-gray-900 mb-4">
              Threat Type Breakdown <span className="text-xs font-normal text-gray-400">· all tenants</span>
            </div>
            <div className="space-y-3">
              {THREAT_BREAKDOWN.map((t) => (
                <div key={t.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-700 w-52 shrink-0 leading-snug">{t.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.round((t.count / maxThreat) * 100)}%`, background: t.color }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-800 w-8 text-right tabular-nums">{t.count}</span>
                  <SevPill severity={t.severity} />
                </div>
              ))}
            </div>
          </div>

          {/* Top tenants by volume */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-900">Top Tenants by Volume</span>
              <div className="flex gap-3 text-xs text-gray-400">
                {[['#ef4444', 'Critical'], ['#f97316', 'High'], ['#d97706', 'Medium']].map(([color, label]) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />{label}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {TOP_TENANTS.map((t) => {
                if (t.total === 0) {
                  return (
                    <div key={t.name} className="opacity-50 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                          <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />{t.name}
                        </span>
                        <span className="text-xs text-gray-400">—</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded" />
                      <div className="text-[11px] text-gray-400">No blocked threats in this period</div>
                    </div>
                  );
                }
                const barW = Math.max(10, Math.round((t.total / maxTenant) * 100));
                return (
                  <div key={t.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <button className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline">
                        <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />{t.name}
                      </button>
                      <span className="text-xs font-bold text-gray-900 tabular-nums">{t.total.toLocaleString()}</span>
                    </div>
                    <div className="flex h-3 rounded overflow-hidden bg-gray-100" style={{ width: `${barW}%` }}>
                      <div className="h-full" style={{ width: `${(t.critical / t.total) * 100}%`, background: '#ef4444' }} />
                      <div className="h-full" style={{ width: `${(t.high / t.total) * 100}%`, background: '#f97316' }} />
                      <div className="h-full" style={{ width: `${(t.medium / t.total) * 100}%`, background: '#d97706' }} />
                    </div>
                    <div className="flex gap-3 text-[11px] text-gray-400">
                      <span className="text-red-500 font-semibold">{t.critical} critical</span>
                      <span>{t.high} high</span>
                      <span>{t.medium} medium</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top Domains & Traffic */}
      <div>
        <SectionHeader title="Top Domains & Traffic" link="View all domains" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Domains table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Domain / Destination', 'Requests', 'Tenants', 'Trend'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOP_DOMAINS.map((d) => (
                  <tr key={d.domain} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-800">{d.domain}</span>
                      <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${d.badge === 'Shadow IT' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>{d.badge}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 tabular-nums">{d.requests}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{d.tenants}</td>
                    <td className="px-4 py-3"><TrendCell trend={d.trend} dir={d.dir} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-sm font-bold text-gray-900 mb-4">
              Actions Breakdown <span className="text-xs font-normal text-gray-400">30d</span>
            </div>
            <div className="flex items-center gap-5">
              <DonutChart />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-sm bg-green-500" />
                  <span className="font-bold text-gray-900">13.7M</span>
                  <span className="text-gray-500">Allowed (89%)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                  <span className="font-bold text-gray-900">1.73M</span>
                  <span className="text-gray-500">Blocked (11%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory & Licensing */}
      <div>
        <SectionHeader title="Inventory & Licensing" link="View full inventory" />
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Tenant', 'Tier', 'Licenses', 'Support Expiry', 'Firmware'].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INVENTORY.map((row) => (
                  <tr key={row.name} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-gray-800">{row.name}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded ${TIER_STYLE[row.tier]}`}>{row.tier}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">{row.licenses}</td>
                    <td className="px-5 py-4">
                      {row.expired ? (
                        <>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-600">Expired</span>
                          <div className="text-xs text-gray-400 mt-1">{row.expiry}</div>
                        </>
                      ) : (
                        <>
                          <div className={`text-sm ${row.expiryRed ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>{row.expiry}</div>
                          {row.renew && <div className="text-xs text-orange-500 mt-0.5">{row.renew}</div>}
                        </>
                      )}
                    </td>
                    <td className={`px-5 py-4 text-sm ${row.firmware === 'Unknown' ? 'text-gray-400' : 'text-gray-700'}`}>{row.firmware}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
            4 active ZTP subscriptions · <span className="text-orange-500 font-medium">3 need renewal within 60 days</span>
          </div>
        </div>
      </div>

      {/* Tenant Breakdown */}
      <div>
        <SectionHeader title="Tenant Breakdown" link="Manage tenants" />
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Tenant', 'Status', 'Endpoints', 'Policies', 'Web Traffic (30D)', 'Threats Blocked', 'Last Activity', ''].map((h, i) => (
                    <th key={i} className="px-5 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TENANT_BREAKDOWN.map((t) => (
                  <tr key={t.name} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-gray-800">{t.name}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${t.status === 'Active' ? 'text-green-600' : 'text-orange-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'Active' ? 'bg-green-500' : 'bg-orange-400'}`} />
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">{t.endpoints}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{t.policies}</td>
                    <td className="px-5 py-4 text-sm text-gray-700 tabular-nums">{t.traffic}</td>
                    <td className="px-5 py-4 text-sm text-gray-700 tabular-nums">{t.threats}</td>
                    <td className="px-5 py-4 text-sm text-gray-400">{t.activity}</td>
                    <td className="px-5 py-4 text-right">
                      <button className={`text-sm font-medium hover:underline inline-flex items-center gap-1 ${t.action === 'View' ? 'text-blue-600' : 'text-orange-500'}`}>
                        {t.action} {t.action === 'View' && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">Showing 5 of 5 tenants</div>
        </div>
      </div>
    </div>
  );
}
