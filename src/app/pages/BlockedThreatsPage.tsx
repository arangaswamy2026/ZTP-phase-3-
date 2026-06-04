import { useState, useMemo, useCallback } from 'react';
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────

const THREAT_TYPES = [
  { key: 'unauthorized', label: 'Unauthorized Access',          display: 'Unauthorized Access Attempt',       severity: 'High',     sevStyle: 'bg-orange-50 text-orange-700',   barColor: '#f97316' },
  { key: 'posture',      label: 'Device Posture Failure',       display: 'Non-Compliant Device Blocked',      severity: 'Medium',   sevStyle: 'bg-yellow-50 text-yellow-700',   barColor: '#f59e0b' },
  { key: 'c2',           label: 'C2 attempts',                  display: 'C2 Attempts',                       severity: 'Critical', sevStyle: 'bg-red-50 text-red-600',         barColor: '#ef4444' },
  { key: 'lateral',      label: 'Lateral Movement',             display: 'Port Scanning / Lateral Movement',  severity: 'Critical', sevStyle: 'bg-red-50 text-red-600',         barColor: '#ef4444' },
  { key: 'dns',          label: 'Malicious DNS',                display: 'DNS-Based Threat',                  severity: 'Medium',   sevStyle: 'bg-yellow-50 text-yellow-700',   barColor: '#f59e0b' },
  { key: 'mfa',          label: 'MFA Failure',                  display: 'MFA Challenge Failed / Bypassed',   severity: 'High',     sevStyle: 'bg-orange-50 text-orange-700',   barColor: '#f97316' },
  { key: 'geo',          label: 'Geo Block',                    display: 'Geo / Location-Based Block',        severity: 'Medium',   sevStyle: 'bg-yellow-50 text-yellow-700',   barColor: '#f59e0b' },
] as const;

type ThreatKey = typeof THREAT_TYPES[number]['key'];

const RANGE_MULT: Record<string, number> = { '24h': 0.14, '7d': 1, '30d': 4.3, custom: 1 };

interface TenantData {
  id: string;
  name: string;
  color: string;
  counts: Record<ThreatKey, number>;
}

const TENANTS: TenantData[] = [
  { id: 'riverside',  name: 'Riverside Dental Office',   color: '#4f46e5', counts: { unauthorized:412,posture:340,c2:29,lateral:18,dns:126,mfa:171,geo:141 } },
  { id: 'bayarea',    name: 'Bay Area Ortho Group',       color: '#0ea5e9', counts: { unauthorized:87, posture:54, c2:11,lateral:7, dns:38, mfa:29, geo:22  } },
  { id: 'sunstate',   name: 'SunState Insurance LLC',     color: '#10b981', counts: { unauthorized:63, posture:41, c2:7, lateral:4, dns:19, mfa:13, geo:9   } },
  { id: 'pinehurst',  name: 'Pinehurst Law Partners',     color: '#f59e0b', counts: { unauthorized:22, posture:14, c2:0, lateral:0, dns:8,  mfa:6,  geo:4   } },
  { id: 'clearwater', name: 'Clearwater Tech (inactive)', color: '#9ca3af', counts: { unauthorized:0,  posture:0,  c2:0, lateral:0, dns:0,  mfa:0,  geo:0   } },
  { id: 'northridge', name: 'Northridge Medical Group',   color: '#8b5cf6', counts: { unauthorized:0,  posture:0,  c2:0, lateral:0, dns:0,  mfa:0,  geo:0   } },
];

interface ThreatEvent {
  ts: string; type: string; user: string; ip: string;
  app: string; policy: string; severity: string; action: string;
}

const EVENTS_BY_TENANT: Record<string, ThreatEvent[]> = {
  riverside: [
    { ts:'2026-05-29 08:42', type:'C2 attempts',            user:'mark@riversidedental.com',         ip:'192.168.1.42',  app:'Dentrix Cloud',       policy:'C2 Block — Private App',       severity:'Critical', action:'Blocked' },
    { ts:'2026-05-29 08:31', type:'Unauthorized Access',    user:'unknown@extern.com',                ip:'203.0.113.17',  app:'HR Records Portal',   policy:'Engineering to HR Policy',     severity:'High',     action:'Blocked' },
    { ts:'2026-05-29 08:19', type:'MFA Failure',            user:'jessica@riversidedental.com',      ip:'10.0.0.88',     app:'Microsoft 365',        policy:'MFA Enforcement Policy',       severity:'High',     action:'Blocked' },
    { ts:'2026-05-29 07:58', type:'Lateral Movement',       user:'mark@riversidedental.com',         ip:'192.168.1.42',  app:'Storage Server',       policy:'IoT to Storage Policy',        severity:'Critical', action:'Blocked' },
    { ts:'2026-05-29 07:44', type:'Malicious DNS',          user:'admin@riversidedental.com',        ip:'10.0.1.5',      app:'—',                    policy:'DNS Threat Block',             severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-29 07:33', type:'Unauthorized Access',    user:'temp.vendor@extern.com',            ip:'198.51.100.44', app:'QuickBooks',           policy:'Vendor Access Policy',         severity:'High',     action:'Blocked' },
    { ts:'2026-05-29 07:21', type:'Device Posture Failure', user:'maria@riversidedental.com',        ip:'10.0.0.21',     app:'Dentrix Cloud',        policy:'Device Trust Policy',          severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-29 07:10', type:'Geo Block',              user:'jessica@riversidedental.com',      ip:'91.108.4.12',   app:'Microsoft 365',        policy:'Geo Restriction Policy',       severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-29 06:55', type:'MFA Failure',            user:'mark@riversidedental.com',         ip:'10.0.0.88',     app:'QuickBooks',           policy:'MFA Enforcement Policy',       severity:'High',     action:'Blocked' },
    { ts:'2026-05-29 06:42', type:'C2 attempts',            user:'jessica@riversidedental.com',      ip:'192.168.1.51',  app:'Dentrix Cloud',        policy:'C2 Block — Private App',       severity:'Critical', action:'Blocked' },
    { ts:'2026-05-28 17:12', type:'Unauthorized Access',    user:'unknown@extern.com',                ip:'203.0.113.22',  app:'Patient Records DB',   policy:'Engineering to HR Policy',     severity:'High',     action:'Blocked' },
    { ts:'2026-05-28 16:55', type:'Malicious DNS',          user:'admin@riversidedental.com',        ip:'10.0.1.5',      app:'—',                    policy:'DNS Threat Block',             severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-28 15:33', type:'Device Posture Failure', user:'mark@riversidedental.com',         ip:'10.0.0.88',     app:'Microsoft 365',        policy:'Device Trust Policy',          severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-28 14:20', type:'MFA Failure',            user:'jessica@riversidedental.com',      ip:'10.0.0.51',     app:'QuickBooks',           policy:'MFA Enforcement Policy',       severity:'High',     action:'Blocked' },
    { ts:'2026-05-28 13:07', type:'Geo Block',              user:'dr.henderson@riversidedental.com', ip:'77.88.8.1',     app:'Dentrix Cloud',        policy:'Geo Restriction Policy',       severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-27 10:44', type:'Lateral Movement',       user:'mark@riversidedental.com',         ip:'192.168.1.42',  app:'File Server',          policy:'IoT to Storage Policy',        severity:'Critical', action:'Blocked' },
    { ts:'2026-05-27 09:22', type:'Unauthorized Access',    user:'temp.vendor2@extern.com',           ip:'198.51.100.77', app:'HR Records Portal',   policy:'Engineering to HR Policy',     severity:'High',     action:'Blocked' },
    { ts:'2026-05-26 15:11', type:'C2 attempts',            user:'mark@riversidedental.com',         ip:'192.168.1.42',  app:'Dentrix Cloud',        policy:'C2 Block — Private App',       severity:'Critical', action:'Blocked' },
    { ts:'2026-05-26 11:03', type:'MFA Failure',            user:'maria@riversidedental.com',        ip:'10.0.0.21',     app:'Microsoft 365',        policy:'MFA Enforcement Policy',       severity:'High',     action:'Blocked' },
    { ts:'2026-05-25 16:48', type:'Malicious DNS',          user:'jessica@riversidedental.com',      ip:'10.0.0.51',     app:'—',                    policy:'DNS Threat Block',             severity:'Medium',   action:'Blocked' },
  ],
  bayarea: [
    { ts:'2026-05-29 09:11', type:'C2 attempts',            user:'user1@bayareaortho.com',           ip:'10.1.0.5',      app:'Ortho EHR',            policy:'C2 Block — Private App',       severity:'Critical', action:'Blocked' },
    { ts:'2026-05-29 08:50', type:'Unauthorized Access',    user:'extern@unknown.net',                ip:'185.220.101.5', app:'Billing Portal',       policy:'Vendor Access Policy',         severity:'High',     action:'Blocked' },
    { ts:'2026-05-28 14:22', type:'MFA Failure',            user:'receptionist@bayareaortho.com',    ip:'10.1.0.12',     app:'Microsoft 365',        policy:'MFA Enforcement Policy',       severity:'High',     action:'Blocked' },
    { ts:'2026-05-27 11:05', type:'Device Posture Failure', user:'dr.kim@bayareaortho.com',          ip:'10.1.0.7',      app:'Ortho EHR',            policy:'Device Trust Policy',          severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-27 09:33', type:'Geo Block',              user:'user2@bayareaortho.com',           ip:'84.17.52.3',    app:'Billing Portal',       policy:'Geo Restriction Policy',       severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-26 16:44', type:'Malicious DNS',          user:'admin@bayareaortho.com',           ip:'10.1.0.1',      app:'—',                    policy:'DNS Threat Block',             severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-25 10:12', type:'Lateral Movement',       user:'user1@bayareaortho.com',           ip:'10.1.0.5',      app:'File Server',          policy:'IoT to Storage Policy',        severity:'Critical', action:'Blocked' },
  ],
  sunstate: [
    { ts:'2026-05-29 07:55', type:'Unauthorized Access',    user:'agent@sunstateins.com',            ip:'10.2.0.18',     app:'Policy Portal',        policy:'Agent Access Policy',          severity:'High',     action:'Blocked' },
    { ts:'2026-05-28 13:44', type:'C2 attempts',            user:'server@sunstateins.com',           ip:'10.2.0.5',      app:'Claims System',        policy:'C2 Block — Private App',       severity:'Critical', action:'Blocked' },
    { ts:'2026-05-27 11:22', type:'MFA Failure',            user:'manager@sunstateins.com',          ip:'10.2.0.22',     app:'Microsoft 365',        policy:'MFA Enforcement Policy',       severity:'High',     action:'Blocked' },
    { ts:'2026-05-26 09:10', type:'Device Posture Failure', user:'agent2@sunstateins.com',           ip:'10.2.0.19',     app:'Policy Portal',        policy:'Device Trust Policy',          severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-25 14:05', type:'Malicious DNS',          user:'admin@sunstateins.com',            ip:'10.2.0.1',      app:'—',                    policy:'DNS Threat Block',             severity:'Medium',   action:'Blocked' },
  ],
  pinehurst: [
    { ts:'2026-05-29 10:05', type:'Unauthorized Access',    user:'extern@unknown.net',                ip:'45.33.32.156',  app:'Legal Doc Vault',      policy:'Vendor Access Policy',         severity:'High',     action:'Blocked' },
    { ts:'2026-05-28 15:30', type:'MFA Failure',            user:'paralegal@pinehurst.law',          ip:'10.3.0.9',      app:'Microsoft 365',        policy:'MFA Enforcement Policy',       severity:'High',     action:'Blocked' },
    { ts:'2026-05-27 12:11', type:'Geo Block',              user:'attorney@pinehurst.law',           ip:'109.238.1.5',   app:'Legal Doc Vault',      policy:'Geo Restriction Policy',       severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-26 09:55', type:'Malicious DNS',          user:'admin@pinehurst.law',              ip:'10.3.0.1',      app:'—',                    policy:'DNS Threat Block',             severity:'Medium',   action:'Blocked' },
  ],
  clearwater: [],
  northridge: [],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function scaled(n: number, range: string) {
  return Math.round(n * (RANGE_MULT[range] ?? 1));
}
function tenantTotal(t: TenantData, range: string) {
  return scaled(Object.values(t.counts).reduce((a, b) => a + b, 0), range);
}
function tenantCritical(t: TenantData, range: string) {
  return scaled(t.counts.c2 + t.counts.lateral, range);
}
function sevBreakdown(t: TenantData, range: string) {
  const out = { Critical: 0, High: 0, Medium: 0 } as Record<string, number>;
  THREAT_TYPES.forEach((tt) => { out[tt.severity] += scaled(t.counts[tt.key], range); });
  return out;
}

function exportCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Severity badge ─────────────────────────────────────────────────────────────

function SevBadge({ severity }: { severity: string }) {
  const style =
    severity === 'Critical' ? 'bg-red-50 text-red-600 border-red-200' :
    severity === 'High'     ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              'bg-yellow-50 text-yellow-700 border-yellow-200';
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${style}`}>
      {severity}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, trend, accent }: {
  label: string; value: string; sub?: string; trend?: { text: string; up: boolean }; accent?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex-1 min-w-[150px]">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</div>
      <div className={`text-[28px] font-bold mt-1.5 mb-1 ${accent ? 'text-red-500' : 'text-gray-900'}`}>{value}</div>
      {trend && (
        <div className={`text-xs font-medium ${trend.up ? 'text-red-500' : 'text-green-600'}`}>
          {trend.up ? '↑' : '↓'} {trend.text}
        </div>
      )}
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

// ── Time range selector ────────────────────────────────────────────────────────

const RANGES = [
  { key: '24h', label: '24h' },
  { key: '7d',  label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'custom', label: 'Custom' },
];

function RangeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex border border-gray-200 rounded-lg overflow-hidden">
      {RANGES.map((r) => (
        <button
          key={r.key}
          onClick={() => onChange(r.key)}
          className={`px-3.5 py-1.5 text-xs font-medium border-r border-gray-200 last:border-0 transition-colors ${
            value === r.key
              ? 'bg-[#FF5D00] text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

// ── PAGE_SIZE ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ── All-Tenants view ──────────────────────────────────────────────────────────

function AllTenantsView({
  range,
  onRangeChange,
  onDrilldown,
}: {
  range: string;
  onRangeChange: (r: string) => void;
  onDrilldown: (id: string, severity?: string) => void;
}) {
  // Aggregate stats
  const total    = TENANTS.reduce((s, t) => s + tenantTotal(t, range), 0);
  const critical = TENANTS.reduce((s, t) => s + tenantCritical(t, range), 0);
  const affected = TENANTS.filter((t) => tenantTotal(t, range) > 0).length;
  const mfa      = TENANTS.reduce((s, t) => s + scaled(t.counts.mfa, range), 0);

  // Threat breakdown
  const aggCounts = THREAT_TYPES.map((tt) => ({
    ...tt,
    count: Math.round(TENANTS.reduce((s, t) => s + t.counts[tt.key], 0) * (RANGE_MULT[range] ?? 1)),
  }));
  const maxCount = Math.max(...aggCounts.map((tt) => tt.count), 1);

  // Tenant bars
  const sorted = [...TENANTS].sort((a, b) => tenantTotal(b, range) - tenantTotal(a, range));
  const maxTotal = Math.max(...sorted.map((t) => tenantTotal(t, range)), 1);

  function handleExport() {
    exportCSV(
      ['Tenant', 'Total Blocked', 'Critical', 'Top Threat'],
      TENANTS.map((t) => [
        t.name,
        tenantTotal(t, range),
        tenantCritical(t, range),
        THREAT_TYPES.reduce((best, tt) =>
          t.counts[tt.key] > t.counts[best.key as ThreatKey] ? tt : best
        ).label,
      ]),
      'blocked-threats-all-tenants.csv',
    );
  }

  const rangeLabel: Record<string, string> = { '24h': 'Last 24 hours', '7d': 'Last 7 days', '30d': 'Last 30 days', custom: 'Custom range' };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blocked Threats</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time view of blocked threats aggregated across all managed tenants. Click any tenant to drill down.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live — refreshes every 5 min
          </span>
          <RangeSelector value={range} onChange={onRangeChange} />
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex gap-4 flex-wrap">
        <StatCard label="Total Blocked"         value={total.toLocaleString()}    trend={{ text: '14% vs prior period', up: true }}  accent />
        <StatCard label="Critical Events"        value={critical.toLocaleString()} sub="C2 attempts + lateral movement" />
        <StatCard label="Tenants Affected"       value={`${affected} of ${TENANTS.length}`} sub="managed tenants" />
        <StatCard label="Unique Users Blocked"   value="37"                        trend={{ text: '8 vs prior period', up: true }} />
        <StatCard label="MFA Failures"           value={mfa.toLocaleString()}      trend={{ text: '22% vs prior period', up: true }} />
      </div>

      {/* Two-column grid */}
      <div className="flex gap-4 flex-wrap items-start">

        {/* Threat type breakdown */}
        <div className="flex-1 min-w-[300px] bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-900">Threat Type Breakdown</span>
            <span className="text-xs text-gray-400">{rangeLabel[range] ?? ''}</span>
          </div>
          <div className="p-5 space-y-3.5">
            {aggCounts.map((tt) => (
              <div key={tt.key} className="flex items-center gap-3">
                <span className="text-xs text-gray-700 w-52 shrink-0 leading-snug">{tt.display}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${maxCount > 0 ? Math.round((tt.count / maxCount) * 100) : 0}%`, background: tt.barColor }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-800 w-8 text-right tabular-nums">{tt.count.toLocaleString()}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full w-16 text-center ${tt.sevStyle}`}>
                  {tt.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top tenants by volume */}
        <div className="w-[340px] min-w-[280px] bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-900">Top Tenants by Volume</span>
            <span className="text-xs text-gray-400">Bar = total · color = severity</span>
          </div>
          <div className="p-5">
            {/* Legend */}
            <div className="flex gap-4 mb-4 text-xs text-gray-400">
              {[['#ef4444','Critical'],['#f97316','High'],['#f59e0b','Medium']].map(([color, label]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>

            <div className="space-y-4">
              {sorted.map((t) => {
                const tot = tenantTotal(t, range);
                const sev = sevBreakdown(t, range);
                const barW = Math.max(8, Math.round((tot / maxTotal) * 100));
                if (tot === 0) {
                  return (
                    <div key={t.id} className="opacity-40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                          <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                          {t.name}
                        </span>
                        <span className="text-xs text-gray-400">—</span>
                      </div>
                      <div className="h-4 bg-gray-100 rounded" />
                      <div className="text-[11px] text-gray-400">No blocked threats this period</div>
                    </div>
                  );
                }
                return (
                  <div key={t.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => onDrilldown(t.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                        {t.name}
                      </button>
                      <span className="text-xs font-bold text-gray-900 tabular-nums">{tot.toLocaleString()}</span>
                    </div>
                    <div className="flex h-4 rounded overflow-hidden bg-gray-100" style={{ width: `${barW}%` }}>
                      {sev.Critical > 0 && (
                        <button
                          title={`Critical: ${sev.Critical}`}
                          onClick={() => onDrilldown(t.id, 'Critical')}
                          className="h-full hover:brightness-90 transition-filter"
                          style={{ width: `${(sev.Critical / tot) * 100}%`, background: '#ef4444' }}
                        />
                      )}
                      {sev.High > 0 && (
                        <button
                          title={`High: ${sev.High}`}
                          onClick={() => onDrilldown(t.id, 'High')}
                          className="h-full hover:brightness-90 transition-filter"
                          style={{ width: `${(sev.High / tot) * 100}%`, background: '#f97316' }}
                        />
                      )}
                      {sev.Medium > 0 && (
                        <button
                          title={`Medium: ${sev.Medium}`}
                          onClick={() => onDrilldown(t.id, 'Medium')}
                          className="h-full hover:brightness-90 transition-filter"
                          style={{ width: `${(sev.Medium / tot) * 100}%`, background: '#f59e0b' }}
                        />
                      )}
                    </div>
                    <div className="flex gap-3 text-[11px] text-gray-400">
                      <button onClick={() => onDrilldown(t.id, 'Critical')} className="text-red-500 font-semibold hover:underline">
                        {sev.Critical} critical
                      </button>
                      <span>{sev.High} high</span>
                      <span>{sev.Medium} medium</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Per-tenant drill-down view ─────────────────────────────────────────────────

function DrilldownView({
  tenantId,
  range,
  onRangeChange,
  onBack,
  presetSeverity,
}: {
  tenantId: string;
  range: string;
  onRangeChange: (r: string) => void;
  onBack: () => void;
  presetSeverity?: string;
}) {
  const tenant = TENANTS.find((t) => t.id === tenantId)!;
  const allEvents = EVENTS_BY_TENANT[tenantId] ?? [];

  const [search,    setSearch]    = useState('');
  const [filterThreat, setFilterThreat] = useState(presetSeverity ? '' : '');
  const [filterApp, setFilterApp] = useState('');
  const [filterSev, setFilterSev] = useState(presetSeverity ?? '');
  const [page, setPage] = useState(1);

  const apps = useMemo(
    () => [...new Set(allEvents.map((e) => e.app).filter((a) => a && a !== '—'))].sort(),
    [allEvents],
  );

  const filtered = useMemo(() => {
    return allEvents.filter((e) => {
      const q = search.toLowerCase();
      if (q && !e.user.toLowerCase().includes(q) && !e.ip.includes(q)) return false;
      if (filterThreat && e.type !== filterThreat) return false;
      if (filterApp   && e.app !== filterApp)   return false;
      if (filterSev   && e.severity !== filterSev) return false;
      return true;
    });
  }, [allEvents, search, filterThreat, filterApp, filterSev]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageEvents = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const tot          = tenantTotal(tenant, range);
  const crit         = tenantCritical(tenant, range);
  const unauthorized = scaled(tenant.counts.unauthorized, range);
  const mfa          = scaled(tenant.counts.mfa, range);

  function handleExport() {
    exportCSV(
      ['Timestamp','Threat Type','User','Source IP','Destination App','Policy Matched','Severity','Action Taken'],
      filtered.map((e) => [e.ts, e.type, e.user, e.ip, e.app, e.policy, e.severity, e.action]),
      `blocked-threats-${tenantId}.csv`,
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-2 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
            Blocked Threats
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{tenant.name} — Blocked Threats</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filterSev ? `${filterSev} severity threats for this tenant` : 'Blocked threats filtered by tenant'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
          <RangeSelector value={range} onChange={onRangeChange} />
          <button onClick={onBack} className="h-8 px-3 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors">
            ← All Tenants
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex gap-4 flex-wrap">
        <StatCard label="Total Blocked"      value={tot.toLocaleString()}          sub="in selected period" accent />
        <StatCard label="Critical Events"    value={crit.toString()}               sub="C2 + lateral movement" />
        <StatCard label="Unauthorized Access" value={unauthorized.toString()}       trend={{ text: 'Top threat type', up: true }} />
        <StatCard label="MFA Failures"       value={mfa.toString()} />
      </div>

      {/* Event log */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <span className="text-sm font-bold text-gray-900">Event Log — {tenant.name}</span>
          <span className="text-xs text-gray-400">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap px-5 py-3 border-b border-gray-50">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search user or IP…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-8 pl-8 pr-3 w-52 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-gray-400 focus:bg-white"
            />
          </div>
          {[
            { id: 'threat', label: 'All Threat Types', value: filterThreat, set: setFilterThreat,
              options: THREAT_TYPES.map((t) => t.label) },
            { id: 'app',    label: 'All Applications',  value: filterApp,    set: setFilterApp,    options: apps },
            { id: 'sev',    label: 'All Severities',    value: filterSev,    set: setFilterSev,    options: ['Critical','High','Medium'] },
          ].map(({ id, label, value, set, options }) => (
            <select
              key={id}
              value={value}
              onChange={(e) => { set(e.target.value); setPage(1); }}
              className="h-8 px-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none cursor-pointer text-gray-700"
            >
              <option value="">{label}</option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          <button
            onClick={() => { setSearch(''); setFilterThreat(''); setFilterApp(''); setFilterSev(''); setPage(1); }}
            className="h-8 px-3 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-500 transition-colors ml-auto"
          >
            Clear Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {allEvents.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-3xl mb-3">🛡️</div>
              <div className="text-sm font-semibold text-gray-600">No blocked threats in selected period</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">No events match the current filters.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Timestamp','Threat Type','User','Source IP','Destination App','Policy Matched','Severity','Action'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-left whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageEvents.map((e, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap font-mono">{e.ts}</td>
                    <td className="px-4 py-3"><SevBadge severity={e.severity} /></td>
                    <td className="px-4 py-3 text-sm text-gray-700">{e.user}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{e.ip}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{e.app}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{e.policy}</td>
                    <td className="px-4 py-3"><SevBadge severity={e.severity} /></td>
                    <td className="px-4 py-3 text-xs font-semibold text-red-500">{e.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            <span>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} events
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => totalPages <= 7 || p <= 2 || p >= totalPages - 1 || Math.abs(p - safePage) <= 1)
                .map((p, idx, arr) => (
                  <span key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-gray-300">…</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 flex items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                        p === safePage
                          ? 'bg-[#FF5D00] text-white border-[#FF5D00]'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Root page component ────────────────────────────────────────────────────────

export function BlockedThreatsPage() {
  const [range, setRange]             = useState('7d');
  const [drilldownId, setDrilldownId] = useState<string | null>(null);
  const [presetSev, setPresetSev]     = useState<string | undefined>();

  const handleDrilldown = useCallback((id: string, severity?: string) => {
    setDrilldownId(id);
    setPresetSev(severity);
  }, []);

  const handleBack = useCallback(() => {
    setDrilldownId(null);
    setPresetSev(undefined);
  }, []);

  if (drilldownId) {
    return (
      <DrilldownView
        tenantId={drilldownId}
        range={range}
        onRangeChange={setRange}
        onBack={handleBack}
        presetSeverity={presetSev}
      />
    );
  }

  return (
    <AllTenantsView
      range={range}
      onRangeChange={setRange}
      onDrilldown={handleDrilldown}
    />
  );
}
