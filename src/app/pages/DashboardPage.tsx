import { useOutletContext, useNavigate } from 'react-router';
import { useState } from 'react';
import { SummaryCards } from '../components/SummaryCards';
import { SessionChart } from '../components/SessionChart';
import { MOCK_ACTIVITIES, ActionBadge } from '../components/ActivityTable';
import { ENDPOINTS_DATA } from './EndpointsPage';
import { DashboardVariants } from '../components/DashboardVariants';
import { Button } from '../components/ui/button';
import { Download, Shield, Globe, ChevronRight, Activity, Monitor, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LifecycleStage } from '../components/TopBar';
import { useTenant } from '../contexts/TenantContext';
import { PageHeader } from '../components/PageHeader';

interface OutletContext {
  lifecycleStage: LifecycleStage;
  showClientDownloadModal: boolean;
  setShowClientDownloadModal: (show: boolean) => void;
}

// ── Widget data ────────────────────────────────────────────────────────────────

function genSeries(seed: number, base: number, amp: number): number[] {
  let s = seed;
  const out: number[] = [];
  for (let i = 0; i < 30; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const r = s / 0x7fffffff;
    const weekend = i % 7 === 5 || i % 7 === 6 ? 0.62 : 1;
    const drift = 1 + (i / 29) * 0.18;
    out.push(Math.max(0, Math.round((base * weekend * drift) + (r - 0.5) * amp)));
  }
  return out;
}

const TENANT_DOMAIN_DAILY = genSeries(17, 50, 20);
const TENANT_DEVICE_DAILY = genSeries(99, 0, 2).map(v => Math.max(0, v));
const TENANT_DOMAIN_TOTAL = 1_473;
const TENANT_DEVICE_TOTAL = 13;

function TenantThreatsHistogram() {
  const W = 740, H = 190;
  const padL = 42, padR = 8, padT = 8, padB = 22;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = 30;
  const gap = 2;
  const barW = Math.floor(innerW / n) - gap;

  const maxVal = Math.max(...TENANT_DOMAIN_DAILY.map((d, i) => d + TENANT_DEVICE_DAILY[i]));
  const yMax = Math.ceil(maxVal / 10) * 10;

  return (
    <div className="flex flex-col h-full px-5 pt-4 pb-4">
      {/* Stat cards */}
      <div className="flex items-stretch gap-5 mb-4 shrink-0">
        <div>
          <div className="text-[22px] font-extrabold text-foreground tabular-nums leading-none">
            {TENANT_DOMAIN_TOTAL.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 leading-snug">Stopped before device</div>
        </div>
        <div className="w-px self-stretch bg-border shrink-0" />
        <div>
          <div className="text-[22px] font-extrabold tabular-nums leading-none" style={{ color: '#d4183d' }}>
            {TENANT_DEVICE_TOTAL.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Device threats</div>
        </div>
        <div className="w-px self-stretch bg-border shrink-0" />
        <div>
          <div className="text-[22px] font-extrabold text-foreground tabular-nums leading-none">
            {(TENANT_DOMAIN_TOTAL + TENANT_DEVICE_TOTAL).toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Total threats</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-2 shrink-0">
        {([['#0066cc', 'Blocked domain threats'], ['#d4183d', 'Device threats']] as [string, string][]).map(([color, label]) => (
          <span key={label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="inline-block w-3 h-2 rounded-sm shrink-0" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      {/* Histogram */}
      <div className="flex-1 min-h-0">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
          {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
            const val = Math.round(yMax * frac);
            const yy = padT + innerH * (1 - frac);
            return (
              <g key={i}>
                <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="#f1f5f9" strokeWidth={1} />
                <text x={padL - 5} y={yy + 3} textAnchor="end" style={{ fontSize: 9, fill: '#717182' }}>
                  {val}
                </text>
              </g>
            );
          })}
          {([0, 9, 19, 29] as number[]).map(i => (
            <text key={i} x={padL + (i + 0.5) * (innerW / n)} y={H - 5} textAnchor="middle" style={{ fontSize: 9, fill: '#717182' }}>
              D{i + 1}
            </text>
          ))}
          {TENANT_DOMAIN_DAILY.map((dv, i) => {
            const dev = TENANT_DEVICE_DAILY[i];
            const x = padL + i * (innerW / n) + gap / 2;
            const domH = Math.max(0, (dv / yMax) * innerH);
            const devH = dev > 0 ? Math.max(3, (dev / yMax) * innerH) : 0;
            return (
              <g key={i}>
                <rect x={x} y={padT + innerH - domH} width={barW} height={domH} fill="#0066cc" rx={1} />
                {devH > 0 && (
                  <rect x={x} y={padT + innerH - domH - devH} width={barW} height={devH} fill="#d4183d" rx={1} />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

const TOP_DOMAINS = [
  { domain: 'office365.com',  badge: 'Known',     requests: '402,031', trend: 6,  dir: 'up'   },
  { domain: 'salesforce.com', badge: 'Known',     requests: '151,090', trend: 11, dir: 'up'   },
  { domain: 'dentrix.com',    badge: 'Known',     requests: '84,112',  trend: 3,  dir: 'down' },
  { domain: 'quickbooks.com', badge: 'Known',     requests: '58,447',  trend: 0,  dir: 'flat' },
  { domain: 'zoom.us',        badge: 'Known',     requests: '41,880',  trend: 8,  dir: 'up'   },
  { domain: 'slack.com',      badge: 'Known',     requests: '38,300',  trend: 5,  dir: 'up'   },
];


const SEV_COLOR: Record<string, string> = { Critical: '#d4183d', High: '#d97706', Medium: '#ca8a04' };

function TrendBadge({ trend, dir }: { trend: number; dir: string }) {
  if (dir === 'up')   return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-red-600"><TrendingUp className="w-3 h-3" />+{trend}%</span>;
  if (dir === 'down') return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-green-600"><TrendingDown className="w-3 h-3" />-{trend}%</span>;
  return <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-400"><Minus className="w-3 h-3" />Stable</span>;
}

type Period = 'last15' | 'last7' | 'yesterday';

const PERIOD_LABELS: Record<Period, string> = {
  last15:    'Last 15 days',
  last7:     'Last 7 days',
  yesterday: 'Yesterday',
};

const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`;

function PeriodSelect({ value, onChange }: { value: Period; onChange: (v: Period) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as Period)}
      style={{
        fontSize: '11px',
        fontWeight: 500,
        color: '#1a1a1a',
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '8px',
        padding: '4px 24px 4px 10px',
        cursor: 'pointer',
        outline: 'none',
        appearance: 'none',
        backgroundImage: CHEVRON_SVG,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 6px center',
        backgroundSize: '12px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {(Object.keys(PERIOD_LABELS) as Period[]).map(k => (
        <option key={k} value={k}>{PERIOD_LABELS[k]}</option>
      ))}
    </select>
  );
}

export function DashboardPage() {
  const { lifecycleStage, showClientDownloadModal, setShowClientDownloadModal } = useOutletContext<OutletContext>();
  const { currentTenant, getTenantData } = useTenant();
  const navigate = useNavigate();
  const [dashboardVariant, setDashboardVariant] = useState<'standard' | 'sidebar'>('standard');
  const [showOnboardingCards, setShowOnboardingCards] = useState(true);
  const [threatsPeriod,   setThreatsPeriod]   = useState<Period>('last15');
  const [domainsPeriod,   setDomainsPeriod]   = useState<Period>('last15');
  const [activityPeriod,  setActivityPeriod]  = useState<Period>('last15');
  const [endpointsPeriod, setEndpointsPeriod] = useState<Period>('last15');

  const tenantData = getTenantData();

  return (
    <>
      <PageHeader
        title="Zero Trust Dashboard"
        subtitle="Monitor and manage your zero trust security posture"
      />

      <DashboardVariants
        variant={dashboardVariant}
        showOnboarding={showOnboardingCards}
        onDismissOnboarding={() => setShowOnboardingCards(false)}
        onAdvancedSettings={() => {}}
      />

      <SessionChart />

      {/* ── Activity Log + Top Domains — side by side ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Activity Log widget */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[340px]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Activity Log</span>
            </div>
            <PeriodSelect value={activityPeriod} onChange={setActivityPeriod} />
          </div>
          <div className="flex items-center gap-3 px-5 py-2 bg-gray-50 border-b border-gray-100 shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-gray-400 w-[150px] shrink-0">Source</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-gray-400 flex-1">Destination</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-gray-400 w-[64px] shrink-0">Action</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-gray-400 w-[80px] shrink-0 text-right">Time</span>
          </div>
          <div className="divide-y divide-gray-50 flex-1 overflow-hidden">
            {MOCK_ACTIVITIES.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                <span className="text-[13px] text-gray-800 w-[150px] shrink-0 truncate">{a.source}</span>
                <span className="text-[13px] text-gray-500 flex-1 truncate">{a.destination}</span>
                <div className="w-[64px] shrink-0"><ActionBadge action={a.action} /></div>
                <span className="text-xs text-gray-400 w-[80px] shrink-0 text-right">{a.timeAgo}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end px-5 py-3 border-t border-gray-100 shrink-0">
            <button
              onClick={() => navigate('/tenant-activity-log')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#0066cc] hover:underline"
            >
              View Details <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Top Domains widget */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[340px]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-[#0066cc]" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Top Domains</span>
            </div>
            <PeriodSelect value={domainsPeriod} onChange={setDomainsPeriod} />
          </div>
          <div className="divide-y divide-gray-50 flex-1 overflow-hidden">
            {TOP_DOMAINS.map(d => (
              <div key={d.domain} className="flex items-center justify-between px-5 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  <span className="text-[13px] text-gray-800 truncate">{d.domain}</span>
                  {d.badge === 'Shadow IT' && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">Shadow IT</span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-[12px] font-medium text-gray-700 tabular-nums">{d.requests}</span>
                  <TrendBadge trend={d.trend} dir={d.dir} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end px-5 py-3 border-t border-gray-100 shrink-0">
            <button
              onClick={() => navigate('/tenant-top-domains')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#0066cc] hover:underline"
            >
              View Details <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* ── Combined Threats widget — full width ─────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-[#d4183d]" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Threats</span>
          </div>
          <PeriodSelect value={threatsPeriod} onChange={setThreatsPeriod} />
        </div>

        {/* Body — three equal panels */}
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 300 }}>

          {/* Panel 1 — Threats histogram */}
          <div className="flex-1 overflow-hidden">
            <TenantThreatsHistogram />
          </div>

          {/* Divider */}
          <div style={{ width: '1px', background: 'rgba(0,0,0,0.08)', flexShrink: 0, alignSelf: 'stretch', margin: '12px 0' }} />

          {/* Panel 2 — Severity */}
          <div className="flex-1 px-5 py-4 flex flex-col gap-3 overflow-hidden">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#717182]">Severity</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flex: 1 }}>
              {([
                { label: 'Critical', value: 312,  display: '312', color: '#d4183d' },
                { label: 'High',     value: 800,  display: '800', color: '#f97316' },
                { label: 'Medium',   value: 160,  display: '160', color: '#d97706' },
                { label: 'Low',      value: 530,  display: '530', color: '#16a34a' },
              ] as const).map(({ label, value, display, color }) => {
                const pct = Math.round((value / 800) * 100);
                return (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: 1 }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color }}>{display}</span>
                    <div style={{ width: '100%', height: '80px', display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{ width: '100%', height: `${pct}%`, minHeight: '3px', background: color, borderRadius: '3px 3px 0 0' }} />
                    </div>
                    <span style={{ fontSize: '10px', color: '#717182', fontWeight: 500 }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', background: 'rgba(0,0,0,0.08)', flexShrink: 0, alignSelf: 'stretch', margin: '12px 0' }} />

          {/* Panel 3 — Status */}
          <div className="flex-1 px-5 py-4 flex flex-col gap-3 overflow-hidden">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#717182]">Status</span>
            <div className="flex flex-col gap-[9px] flex-1 justify-center">
              {([
                { label: 'Not Quarantined', value: 3,  total: 23, color: '#d97706' },
                { label: 'Process Killed',  value: 14, total: 23, color: '#16a34a' },
                { label: 'Quarantined',     value: 6,  total: 23, color: '#0066cc' },
              ] as const).map(({ label, value, total, color }) => {
                const pct = Math.round((value / total) * 100);
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#717182' }}>{label}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color }}>{value}</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '999px', background: '#ececf0', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '999px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 px-5 py-3 border-t border-gray-100 shrink-0">
          <button
            onClick={() => navigate('/threats')}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#0066cc] hover:underline"
          >
            View Threats <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 m-0 mb-0.5">Download Unified Client</h3>
            <p className="text-xs text-gray-500 m-0">
              Deploy the unified security agent to all enabled tenants to ensure full zero trust compliance.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 text-xs"
          onClick={() => setShowClientDownloadModal(true)}
        >
          View Details
        </Button>
      </div>

    </>
  );
}