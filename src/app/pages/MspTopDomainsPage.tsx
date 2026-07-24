import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, ChevronDown, Search, Download, TrendingUp, TrendingDown, Minus, Globe } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

// ── Types ─────────────────────────────────────────────────────────────────────

type TenantRow = { name: string; requests: number; users: number; trend: number; dir: 'up' | 'down' | 'flat' };
type DomainEntry = { domain: string; category: string; badge: string; requests: number; uniqueUsers: number; tenants: number; trend: number; dir: string; tenantRows: TenantRow[] };

// ── Tenant avatar colors (keyed by name initial) ──────────────────────────────

const TENANT_PALETTE: Record<string, { bg: string; fg: string }> = {
  'Global Services LLC':    { bg: '#dbeafe', fg: '#1d4ed8' },
  'Enterprise Solutions':   { bg: '#d1fae5', fg: '#065f46' },
  'Acme Corporation':       { bg: '#ede9fe', fg: '#5b21b6' },
  'Riverside Dental Office':{ bg: '#fce7f3', fg: '#9d174d' },
  'Cloud Innovations':      { bg: '#fef3c7', fg: '#92400e' },
};

function TenantAvatar({ name }: { name: string }) {
  const c = TENANT_PALETTE[name] ?? { bg: '#f1f5f9', fg: '#64748b' };
  return (
    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: c.bg, color: c.fg }}>
      {name.charAt(0)}
    </span>
  );
}

// ── Extended mock data ────────────────────────────────────────────────────────

const TOP_DOMAINS_FULL: DomainEntry[] = [
  {
    domain: 'office365.com', category: 'Business Productivity', badge: 'Known',
    requests: 1_402_031, uniqueUsers: 68, tenants: 4, trend: 6, dir: 'up',
    tenantRows: [
      { name: 'Global Services LLC',    requests: 451_210, users: 20, trend: 8,  dir: 'up'   },
      { name: 'Enterprise Solutions',   requests: 382_490, users: 18, trend: 5,  dir: 'up'   },
      { name: 'Acme Corporation',       requests: 334_011, users: 16, trend: 4,  dir: 'up'   },
      { name: 'Riverside Dental Office',requests: 234_320, users: 14, trend: 7,  dir: 'up'   },
    ],
  },
  {
    domain: 'salesforce.com', category: 'Business Productivity', badge: 'Known',
    requests: 551_090, uniqueUsers: 34, tenants: 2, trend: 11, dir: 'up',
    tenantRows: [
      { name: 'Global Services LLC',  requests: 321_050, users: 20, trend: 13, dir: 'up' },
      { name: 'Enterprise Solutions', requests: 230_040, users: 14, trend: 8,  dir: 'up' },
    ],
  },
  {
    domain: 'dentrix.com', category: 'Healthcare Software', badge: 'Known',
    requests: 234_112, uniqueUsers: 9, tenants: 1, trend: 3, dir: 'down',
    tenantRows: [
      { name: 'Riverside Dental Office', requests: 234_112, users: 9, trend: 3, dir: 'down' },
    ],
  },
  {
    domain: 'quickbooks.com', category: 'Business Productivity', badge: 'Known',
    requests: 198_447, uniqueUsers: 28, tenants: 3, trend: 0, dir: 'flat',
    tenantRows: [
      { name: 'Acme Corporation',       requests: 92_010, users: 12, trend: 2,  dir: 'up'   },
      { name: 'Enterprise Solutions',   requests: 68_240, users: 10, trend: 0,  dir: 'flat' },
      { name: 'Riverside Dental Office',requests: 38_197, users: 6,  trend: 3,  dir: 'down' },
    ],
  },
  {
    domain: 'dropbox.com', category: 'Cloud Storage', badge: 'Shadow IT',
    requests: 162_120, uniqueUsers: 31, tenants: 3, trend: 42, dir: 'up',
    tenantRows: [
      { name: 'Acme Corporation',     requests: 65_310, users: 14, trend: 38, dir: 'up' },
      { name: 'Enterprise Solutions', requests: 55_440, users: 11, trend: 45, dir: 'up' },
      { name: 'Global Services LLC',  requests: 41_370, users: 6,  trend: 44, dir: 'up' },
    ],
  },
  {
    domain: 'slack.com', category: 'Communication', badge: 'Known',
    requests: 148_300, uniqueUsers: 58, tenants: 4, trend: 5, dir: 'up',
    tenantRows: [
      { name: 'Global Services LLC',    requests: 51_200, users: 18, trend: 6,  dir: 'up'   },
      { name: 'Enterprise Solutions',   requests: 44_310, users: 16, trend: 5,  dir: 'up'   },
      { name: 'Acme Corporation',       requests: 32_490, users: 14, trend: 4,  dir: 'up'   },
      { name: 'Riverside Dental Office',requests: 20_300, users: 10, trend: 3,  dir: 'flat' },
    ],
  },
  {
    domain: 'zoom.us', category: 'Communication', badge: 'Known',
    requests: 140_218, uniqueUsers: 52, tenants: 4, trend: 2, dir: 'down',
    tenantRows: [
      { name: 'Global Services LLC',    requests: 48_100, users: 16, trend: 3,  dir: 'down' },
      { name: 'Enterprise Solutions',   requests: 41_210, users: 14, trend: 2,  dir: 'down' },
      { name: 'Acme Corporation',       requests: 30_408, users: 12, trend: 1,  dir: 'down' },
      { name: 'Riverside Dental Office',requests: 20_500, users: 10, trend: 2,  dir: 'down' },
    ],
  },
  {
    domain: 'box.com', category: 'Cloud Storage', badge: 'Shadow IT',
    requests: 94_500, uniqueUsers: 22, tenants: 2, trend: 18, dir: 'up',
    tenantRows: [
      { name: 'Acme Corporation',     requests: 54_300, users: 14, trend: 21, dir: 'up' },
      { name: 'Global Services LLC',  requests: 40_200, users: 8,  trend: 14, dir: 'up' },
    ],
  },
  {
    domain: 'google.com', category: 'Search / Productivity', badge: 'Known',
    requests: 88_741, uniqueUsers: 64, tenants: 4, trend: 1, dir: 'flat',
    tenantRows: [
      { name: 'Global Services LLC',    requests: 28_400, users: 20, trend: 1,  dir: 'flat' },
      { name: 'Enterprise Solutions',   requests: 24_311, users: 18, trend: 0,  dir: 'flat' },
      { name: 'Acme Corporation',       requests: 21_530, users: 16, trend: 1,  dir: 'flat' },
      { name: 'Riverside Dental Office',requests: 14_500, users: 10, trend: 2,  dir: 'up'   },
    ],
  },
  {
    domain: 'github.com', category: 'Development', badge: 'Known',
    requests: 72_034, uniqueUsers: 18, tenants: 2, trend: 8, dir: 'up',
    tenantRows: [
      { name: 'Global Services LLC',  requests: 42_310, users: 11, trend: 9,  dir: 'up' },
      { name: 'Enterprise Solutions', requests: 29_724, users: 7,  trend: 6,  dir: 'up' },
    ],
  },
  {
    domain: 'amazonaws.com', category: 'Cloud Infrastructure', badge: 'Known',
    requests: 65_299, uniqueUsers: 24, tenants: 3, trend: 12, dir: 'up',
    tenantRows: [
      { name: 'Global Services LLC',  requests: 30_100, users: 10, trend: 14, dir: 'up' },
      { name: 'Enterprise Solutions', requests: 22_400, users: 9,  trend: 11, dir: 'up' },
      { name: 'Cloud Innovations',    requests: 12_799, users: 5,  trend: 10, dir: 'up' },
    ],
  },
  {
    domain: 'telegram.org', category: 'Social / Messaging', badge: 'Shadow IT',
    requests: 44_100, uniqueUsers: 14, tenants: 2, trend: 61, dir: 'up',
    tenantRows: [
      { name: 'Acme Corporation',     requests: 26_400, users: 9,  trend: 58, dir: 'up' },
      { name: 'Enterprise Solutions', requests: 17_700, users: 5,  trend: 65, dir: 'up' },
    ],
  },
  {
    domain: 'wetransfer.com', category: 'File Sharing', badge: 'Shadow IT',
    requests: 31_452, uniqueUsers: 19, tenants: 3, trend: 29, dir: 'up',
    tenantRows: [
      { name: 'Acme Corporation',       requests: 13_200, users: 8,  trend: 31, dir: 'up' },
      { name: 'Global Services LLC',    requests: 10_802, users: 7,  trend: 27, dir: 'up' },
      { name: 'Riverside Dental Office',requests: 7_450,  users: 4,  trend: 30, dir: 'up' },
    ],
  },
  {
    domain: 'azure.microsoft.com', category: 'Cloud Infrastructure', badge: 'Known',
    requests: 28_900, uniqueUsers: 12, tenants: 2, trend: 4, dir: 'up',
    tenantRows: [
      { name: 'Global Services LLC',  requests: 16_500, users: 7,  trend: 5, dir: 'up' },
      { name: 'Enterprise Solutions', requests: 12_400, users: 5,  trend: 3, dir: 'up' },
    ],
  },
  {
    domain: 'onedrive.live.com', category: 'Cloud Storage', badge: 'Known',
    requests: 24_317, uniqueUsers: 16, tenants: 2, trend: 7, dir: 'up',
    tenantRows: [
      { name: 'Enterprise Solutions',   requests: 14_210, users: 9,  trend: 8, dir: 'up' },
      { name: 'Riverside Dental Office',requests: 10_107, users: 7,  trend: 6, dir: 'up' },
    ],
  },
];

// MSP-level weekly traffic (aggregated across all tenants, requests in thousands, Mon–Sun)
const MSP_WEEKLY_TRAFFIC = [584, 621, 713, 689, 802, 441, 315];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function fmtNumFull(n: number): string {
  return n.toLocaleString();
}

function WeeklyChart() {
  const max = Math.max(...MSP_WEEKLY_TRAFFIC);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', flex: 1, minHeight: 0, padding: '0 4px' }}>
      {MSP_WEEKLY_TRAFFIC.map((v, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', flex: 1, gap: '6px', height: '100%' }}>
          <div style={{
            width: '100%', borderRadius: '4px 4px 0 0',
            flex: String(v / max),
            background: i === 4 ? '#0066cc' : '#0066cc33',
            minHeight: '4px',
          }} />
          <span style={{ fontSize: '10px', color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>{DAY_LABELS[i]}</span>
        </div>
      ))}
    </div>
  );
}

function TopDomainsBarChart() {
  const top5 = [...TOP_DOMAINS_FULL].sort((a, b) => b.requests - a.requests).slice(0, 5);
  const max  = top5[0].requests;
  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {top5.map(d => (
        <div key={d.domain} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#1a1a1a', width: '130px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.domain}</span>
          <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '9999px', background: '#0066cc', width: `${Math.round((d.requests / max) * 100)}%` }} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a1a', width: '48px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fmtNum(d.requests)}</span>
        </div>
      ))}
    </div>
  );
}

function TrendCell({ trend, dir }: { trend: number; dir: string }) {
  if (dir === 'up')   return <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive"><TrendingUp className="w-3 h-3" />▲ {trend}%</span>;
  if (dir === 'down') return <span className="inline-flex items-center gap-1 text-xs font-semibold text-success"><TrendingDown className="w-3 h-3" />▼ {trend}%</span>;
  return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Minus className="w-3 h-3" />— stable</span>;
}

function TenantTrendCell({ trend, dir }: { trend: number; dir: string }) {
  if (dir === 'up')   return <span className="text-xs font-semibold text-destructive">▲ {trend}%</span>;
  if (dir === 'down') return <span className="text-xs font-semibold text-success">▼ {trend}%</span>;
  return <span className="text-xs text-muted-foreground">— stable</span>;
}

function exportCSV() {
  const rows = TOP_DOMAINS_FULL.map(d => [d.domain, d.category, d.badge, d.requests, d.tenants, d.trend]);
  const csv = [['Domain','Category','Type','Requests','Tenants','Trend%'], ...rows]
    .map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'top-domains.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function MspTopDomainsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [badgeFilter, setBadgeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  function toggleRow(domain: string) {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(domain) ? next.delete(domain) : next.add(domain);
      return next;
    });
  }

  const categories = useMemo(() => [...new Set(TOP_DOMAINS_FULL.map(d => d.category))].sort(), []);

  const filtered = useMemo(() => TOP_DOMAINS_FULL.filter(d => {
    if (search && !d.domain.toLowerCase().includes(search.toLowerCase())) return false;
    if (badgeFilter && d.badge !== badgeFilter) return false;
    if (categoryFilter && d.category !== categoryFilter) return false;
    return true;
  }), [search, badgeFilter, categoryFilter]);

  const totalRequests = filtered.reduce((s, d) => s + d.requests, 0);

  return (
    <div className="space-y-6 pb-10 max-w-[1200px]">
      {/* Back */}
      <button
        onClick={() => navigate('/msp-dashboard')}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Dashboard
      </button>

      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Top Domains & Traffic"
          subtitle="All domains accessed across your managed tenants, sorted by request volume."
        />
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium border border-border rounded-lg bg-card hover:bg-muted text-foreground transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stat row */}
      <div className="flex gap-4 flex-wrap">
        {[
          { label: 'Total Requests', value: fmtNum(totalRequests), sub: 'filtered results' },
          { label: 'Unique Domains', value: String(filtered.length), sub: 'in view' },
        ].map(s => (
          <div key={s.label} className="bg-card border rounded-2xl shadow-sm p-5 flex-1 min-w-[160px]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">{s.label}</div>
            <div className={`text-[28px] font-bold mt-1.5 mb-1 ${s.accent ? 'text-destructive' : 'text-foreground'}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Widgets: Weekly Volume + Top Domains */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Weekly Request Volume */}
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px 8px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)' }}>Weekly Request Volume</div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted-foreground)', marginTop: '2px' }}>All tenants · requests in thousands</div>
          </div>
          <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '160px' }}>
            <WeeklyChart />
          </div>
        </div>
        {/* Top Domains */}
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div style={{ padding: '16px 20px 8px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-foreground)' }}>Top Domains</div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted-foreground)', marginTop: '2px' }}>By request volume · last 30 days</div>
          </div>
          <TopDomainsBarChart />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search domain…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 pl-8 pr-3 w-56 text-sm border border-input rounded-lg bg-muted focus:outline-none focus:border-action focus:bg-card"
          />
        </div>
        <select
          value={badgeFilter}
          onChange={e => setBadgeFilter(e.target.value)}
          className="h-9 px-3 text-sm border border-input rounded-lg bg-card focus:outline-none cursor-pointer text-foreground"
        >
          <option value="">All Types</option>
          <option value="Known">Known</option>
          <option value="Shadow IT">Shadow IT</option>
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="h-9 px-3 text-sm border border-input rounded-lg bg-card focus:outline-none cursor-pointer text-foreground"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || badgeFilter || categoryFilter) && (
          <button
            onClick={() => { setSearch(''); setBadgeFilter(''); setCategoryFilter(''); }}
            className="h-9 px-3 text-xs font-medium border border-border rounded-lg bg-card hover:bg-muted text-muted-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <Globe className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
            No domains match the current filters.
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground w-[36%]">Domain / Destination</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Total Requests</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Users</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Tenants</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Trend</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const isExpanded = expandedRows.has(d.domain);
                return (
                  <React.Fragment key={d.domain}>
                    {/* Domain row */}
                    <tr
                      onClick={() => toggleRow(d.domain)}
                      className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 flex items-center justify-center shrink-0 text-muted-foreground">
                            {isExpanded
                              ? <ChevronDown className="w-3.5 h-3.5" />
                              : <ChevronRight className="w-3.5 h-3.5" />}
                          </span>
                          <span className="text-[13px] font-medium text-foreground whitespace-nowrap">{d.domain}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[13px] text-foreground font-medium">{fmtNumFull(d.requests)}</td>
                      <td className="px-4 py-3 tabular-nums text-[13px] text-foreground">{d.uniqueUsers}</td>
                      <td className="px-4 py-3 tabular-nums text-[13px]">
                        <button
                          onClick={e => { e.stopPropagation(); toggleRow(d.domain); }}
                          className="text-[13px] font-medium text-action hover:underline"
                        >
                          {d.tenants} {d.tenants === 1 ? 'tenant' : 'tenants'}
                        </button>
                      </td>
                      <td className="px-4 py-3"><TrendCell trend={d.trend} dir={d.dir} /></td>
                    </tr>

                    {/* Expanded tenant sub-rows */}
                    {isExpanded && (
                      <tr className="border-b border-border bg-muted/20">
                        <td colSpan={5} className="px-0 py-0">
                          <table className="w-full border-collapse">
                            {/* Sub-header */}
                            <thead>
                              <tr className="border-b border-border/60">
                                <th className="pl-10 pr-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/70 w-[36%]">Tenant</th>
                                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/70">Requests</th>
                                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/70">Users</th>
                                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/70">Trend</th>
                              </tr>
                            </thead>
                            <tbody>
                              {d.tenantRows.map((t, i) => (
                                <tr
                                  key={t.name}
                                  className={`${i < d.tenantRows.length - 1 ? 'border-b border-border/40' : ''} hover:bg-muted/30 transition-colors`}
                                >
                                  <td className="pl-10 pr-4 py-3">
                                    <span className="text-[13px] font-medium text-foreground">{t.name}</span>
                                  </td>
                                  <td className="px-4 py-3 tabular-nums text-[13px] text-foreground">{fmtNumFull(t.requests)}</td>
                                  <td className="px-4 py-3 tabular-nums text-[13px] text-foreground">{t.users}</td>
                                  <td className="px-4 py-3"><TenantTrendCell trend={t.trend} dir={t.dir} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="px-5 py-2.5 border-t border-border text-xs text-muted-foreground">
          Click a domain to see which tenants drive its traffic, then drill into any tenant. · {filtered.length} domain{filtered.length !== 1 ? 's' : ''} shown · data reflects the last 30 days
        </div>
      </div>
    </div>
  );
}
