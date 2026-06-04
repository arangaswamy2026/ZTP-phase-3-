import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, RefreshCw, ChevronRight, Server, Wifi, Globe, Shield, AlertTriangle } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────

const TENANT_NAMES: Record<string, string> = {
  riverside:  'Riverside Dental Office',
  northgate:  'Northgate Logistics',
  summit:     'Summit Health Partners',
  lakeside:   'Lakeside Clinic',
  harbor:     'Harbor Law Group',
};

type ConnStatus = 'ok' | 'warn' | 'crit' | 'offline';

interface Session { user: string; duration: string; app: string; }

interface Connector {
  id: string;
  name: string;
  tenant: string;
  region: string;
  status: ConnStatus;
  cpu: number;
  mem: number;
  sessions: Session[] | null; // null = offline, [] = empty
}

const APPS = ['Dentrix', 'Microsoft 365', 'QuickBooks', 'SAP', 'Salesforce', 'Epic EHR', 'SharePoint'];
const USERS = ['ana','ben','cara','dev','evan','finn','gita','hugo','ivy','joe'];
function bulk(n: number, domain: string): Session[] {
  return Array.from({ length: n }, () => ({
    user: `${USERS[Math.floor(Math.random() * USERS.length)]}@${domain}.com`,
    duration: `${Math.floor(Math.random() * 3)}h ${Math.floor(Math.random() * 59)}m`,
    app: APPS[Math.floor(Math.random() * APPS.length)],
  }));
}

const INITIAL_CONNECTORS: Connector[] = [
  { id:'ztc-rv-01', name:'ZTC-Riverside-01', tenant:'riverside', region:'us-west-2', status:'ok',      cpu:31, mem:38,
    sessions:[
      { user:'maria@riversidedental.com',   duration:'2h 14m', app:'Dentrix' },
      { user:'jessica@riversidedental.com', duration:'41m',    app:'Microsoft 365' },
      { user:'mark@riversidedental.com',    duration:'1h 08m', app:'QuickBooks' },
      { user:'dana@riversidedental.com',    duration:'22m',    app:'Microsoft 365' },
      { user:'priya@riversidedental.com',   duration:'55m',    app:'SharePoint' },
    ] },
  { id:'ztc-ng-01', name:'ZTC-Northgate-01', tenant:'northgate', region:'us-east-1', status:'crit',    cpu:94, mem:91,
    sessions: bulk(1240, 'northgatelog') },
  { id:'ztc-sh-01', name:'ZTC-Summit-01',    tenant:'summit',    region:'us-east-1', status:'warn',    cpu:78, mem:71,
    sessions:[
      { user:'priya@summithealth.com', duration:'26m',    app:'Epic EHR' },
      { user:'leo@summithealth.com',   duration:'1h 02m', app:'Microsoft 365' },
      { user:'ron@summithealth.com',   duration:'3h 41m', app:'SharePoint' },
    ] },
  { id:'ztc-lc-01', name:'ZTC-Lakeside-01',  tenant:'lakeside',  region:'eu-west-1', status:'offline', cpu:0,  mem:0,  sessions:null },
  { id:'ztc-hl-01', name:'ZTC-Harbor-01',    tenant:'harbor',    region:'us-west-2', status:'ok',      cpu:14, mem:22, sessions:[] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_META: Record<ConnStatus, { label: string; cls: string }> = {
  ok:      { label: 'Healthy',  cls: 'bg-green-50  text-green-700  border-green-200'  },
  warn:    { label: 'Warning',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  crit:    { label: 'Critical', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  offline: { label: 'Offline',  cls: 'bg-red-50    text-red-600    border-red-200'    },
};

function barColor(v: number) {
  if (v >= 90) return '#ef4444';
  if (v >= 75) return '#f59e0b';
  if (v >= 60) return '#eab308';
  return '#22c55e';
}

function sessCount(c: Connector) {
  return c.sessions === null ? 0 : c.sessions.length;
}

function stamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusCard({ label, status, sub, icon: Icon, iconColor }: {
  label: string; status: string; sub: string; icon: React.ElementType; iconColor: string;
}) {
  const dotColor = status === 'Connected' ? 'bg-blue-500' : 'bg-green-500';
  const textColor = status === 'Connected' ? 'text-blue-700' : 'text-green-700';
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center`} style={{ background: `${iconColor}15` }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`flex items-center gap-1.5 font-semibold text-sm ${textColor}`}>
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        {status}
      </div>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </div>
  );
}

function UtilBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-gray-500">
      <span className="w-7 font-semibold uppercase">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: barColor(value) }} />
      </div>
      <span className="w-8 text-right tabular-nums">{value}%</span>
    </div>
  );
}

function ConnectorRow({
  connector, isOpen, tenantFilter, searchQuery, onToggle,
}: {
  connector: Connector; isOpen: boolean; tenantFilter: string; searchQuery: string; onToggle: () => void;
}) {
  const meta = STATUS_META[connector.status];
  const offline = connector.status === 'offline';
  const count = sessCount(connector);

  const filteredSessions = useMemo(() => {
    if (!connector.sessions) return [];
    const q = searchQuery.toLowerCase();
    if (!q) return connector.sessions.slice(0, 500);
    return connector.sessions.filter(
      (s) => s.user.toLowerCase().includes(q) || s.app.toLowerCase().includes(q)
    ).slice(0, 500);
  }, [connector.sessions, searchQuery]);

  return (
    <div className={`border rounded-xl overflow-hidden mb-2.5 ${
      offline ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-white'
    }`}>
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full grid items-center gap-4 px-4 py-3.5 text-left hover:bg-gray-50/50 transition-colors"
        style={{ gridTemplateColumns: '16px 1.7fr 1fr 1.3fr auto' }}
      >
        {/* Chevron */}
        <ChevronRight
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}
        />

        {/* Name */}
        <div>
          <div className="text-sm font-semibold text-gray-900">{connector.name}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{connector.id} · {connector.region}</div>
        </div>

        {/* Session count */}
        <div>
          <div className="text-xl font-extrabold text-gray-900 leading-none">
            {offline ? '—' : count.toLocaleString()}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-0.5">
            active sessions
          </div>
        </div>

        {/* Tenant (all-tenants) or region (scoped) */}
        <div className={`text-sm ${tenantFilter === 'all' ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
          {tenantFilter === 'all' ? TENANT_NAMES[connector.tenant] : connector.region}
        </div>

        {/* Util + badge */}
        <div className="flex items-center gap-3">
          <div className="space-y-1.5 min-w-[140px]">
            {offline ? (
              <span className="text-xs text-gray-400">No utilization data</span>
            ) : (
              <>
                <UtilBar label="CPU" value={connector.cpu} />
                <UtilBar label="Mem" value={connector.mem} />
              </>
            )}
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap ${meta.cls}`}>
            {meta.label}
          </span>
        </div>
      </button>

      {/* Expanded sessions */}
      {isOpen && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          {offline ? (
            <div className="flex items-center gap-2 px-4 py-3.5 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Connector is not reporting — session data unavailable. Last contact: 6m ago.
            </div>
          ) : count === 0 ? (
            <div className="px-4 py-5 text-sm text-gray-400 text-center">
              No active sessions on this connector right now.
            </div>
          ) : (
            <>
              {count > 200 && (
                <div className="px-4 py-2 text-[11px] text-gray-400 bg-gray-100 border-b border-gray-200">
                  High session volume — {count.toLocaleString()} sessions. Showing first 500.
                </div>
              )}
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Connected user', 'Session duration', 'Application accessed'].map((h) => (
                        <th key={h} className="px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-sm text-gray-400 text-center">
                          No sessions match the search.
                        </td>
                      </tr>
                    ) : filteredSessions.map((s, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-white transition-colors">
                        <td className="px-4 py-2.5 text-sm text-gray-700">{s.user}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-500 tabular-nums">{s.duration}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-700">{s.app}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AllTenantsSystemStatusPage() {
  const [connectors, setConnectors] = useState<Connector[]>(
    INITIAL_CONNECTORS.map((c) => ({ ...c, sessions: c.sessions ? [...c.sessions] : c.sessions }))
  );
  const [openSet,       setOpenSet]       = useState<Set<string>>(new Set());
  const [search,        setSearch]        = useState('');
  const [tenantFilter,  setTenantFilter]  = useState('all');
  const [sortBy,        setSortBy]        = useState('sessions');
  const [autoRefresh,   setAutoRefresh]   = useState(true);
  const [lastUpdated,   setLastUpdated]   = useState(stamp());
  const [stale,         setStale]         = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function refresh() {
    setStale(false);
    setConnectors((prev) =>
      prev.map((c) => {
        if (c.status === 'offline') return c;
        const nudge = () => Math.floor(Math.random() * 11) - 5;
        return { ...c, cpu: Math.min(99, Math.max(5, c.cpu + nudge())), mem: Math.min(99, Math.max(5, c.mem + nudge())) };
      })
    );
    setLastUpdated(stamp());
  }

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoRefresh) timerRef.current = setInterval(refresh, 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoRefresh]);

  function toggleRow(id: string) {
    setOpenSet((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const visible = useMemo(() => {
    let cs = tenantFilter === 'all' ? connectors : connectors.filter((c) => c.tenant === tenantFilter);
    if (sortBy === 'util') cs = [...cs].sort((a, b) => Math.max(b.cpu, b.mem) - Math.max(a.cpu, a.mem));
    else if (sortBy === 'name') cs = [...cs].sort((a, b) => a.name.localeCompare(b.name));
    else cs = [...cs].sort((a, b) => sessCount(b) - sessCount(a));
    return cs;
  }, [connectors, tenantFilter, sortBy]);

  // Summary tiles
  const scopedConns   = tenantFilter === 'all' ? connectors : connectors.filter((c) => c.tenant === tenantFilter);
  const totalSessions = scopedConns.reduce((s, c) => s + (c.status === 'offline' ? 0 : sessCount(c)), 0);
  const needsAttention = scopedConns.filter((c) => c.status !== 'ok').length;
  const tenantCount   = new Set(scopedConns.map((c) => c.tenant)).size;

  // Group by tenant when showing all
  const grouped = useMemo(() => {
    if (tenantFilter !== 'all') return null;
    const map: Record<string, Connector[]> = {};
    visible.forEach((c) => { (map[c.tenant] = map[c.tenant] || []).push(c); });
    return map;
  }, [visible, tenantFilter]);

  return (
    <div className="space-y-6 pb-10">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Status</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor the health and connectivity of your ZTP infrastructure
        </p>
      </div>

      {/* Infrastructure status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatusCard label="ZT Connector"       status="Online"    sub="Last ping: 2s ago"    icon={Server} iconColor="#0066cc" />
        <StatusCard label="Cloud Connectivity" status="Connected" sub="Latency: 12ms"         icon={Wifi}   iconColor="#0066cc" />
        <StatusCard label="Edge Network"       status="Online"    sub="All nodes healthy"     icon={Globe}  iconColor="#22c55e" />
        <StatusCard label="DNS Filtering"      status="Active"    sub="CFS + Botnet"          icon={Shield} iconColor="#22c55e" />
      </div>

      {/* Connections & Tunnels */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3.5">Connections &amp; Tunnels</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Connector card */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <Server className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Secure Remote Access</div>
                <div className="text-sm font-semibold text-gray-900">ZTP Connector</div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">
                Online
              </span>
            </div>
            <div className="px-4 py-3 border-b border-gray-50">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Private Networks</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600">NW</span>
                <span className="font-medium text-gray-800 flex-1">Employee Zone</span>
                <span className="font-mono text-[12px] text-gray-500">192.168.0.0/16</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-50 text-green-700">Default</span>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Internal Domains</div>
              <div className="flex flex-wrap gap-1.5">
                {['dentrix.local', 'erp.riverside.local'].map((d) => (
                  <span key={d} className="font-mono text-[12px] text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Service Tunnel card */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Service Tunnel</div>
                <div className="text-sm font-semibold text-gray-900">ST-Remote-Employee-Access-01</div>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-200">
                Active
              </span>
            </div>
            <div className="px-4 py-3 space-y-2.5">
              {[
                { label: 'Status',        value: <span className="flex items-center gap-1.5 text-blue-700 font-semibold text-sm"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Connected</span> },
                { label: 'Linked Policy', value: <span className="text-sm font-medium text-gray-900">Remote Employee Access</span> },
                { label: 'Purpose',       value: <span className="text-sm text-gray-500">Connects securely to private resources</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-sm text-gray-400">{label}</span>
                  {value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connectors & Active Sessions */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-bold text-gray-900">Connectors &amp; Active Sessions</h2>
          <span className="text-xs text-gray-400">
            {tenantFilter === 'all' ? 'All managed tenants (MSP rollup)' : `Scoped to ${TENANT_NAMES[tenantFilter]}`}
          </span>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-3 gap-3.5 mb-4">
          {[
            { label: tenantFilter === 'all' ? 'Connectors / Tenants' : 'Connectors',
              value: tenantFilter === 'all' ? `${scopedConns.length} / ${tenantCount}` : String(scopedConns.length),
              sub: tenantFilter === 'all' ? 'across all customers' : 'in this tenant' },
            { label: 'Active Sessions',  value: totalSessions.toLocaleString(), sub: 'connected now' },
            { label: 'Needs Attention',  value: String(needsAttention),         sub: 'warning, critical, or offline' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
              <div className="text-2xl font-extrabold text-gray-900 mt-2 mb-1">{value}</div>
              <div className="text-xs text-gray-400">{sub}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap mb-3.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions by user or application..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 pr-3 w-72 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400"
            />
          </div>
          <select
            value={tenantFilter}
            onChange={(e) => { setTenantFilter(e.target.value); setOpenSet(new Set()); }}
            className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none cursor-pointer text-gray-700"
          >
            <option value="all">All tenants</option>
            {Object.entries(TENANT_NAMES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none cursor-pointer text-gray-700"
          >
            <option value="sessions">Sort: Active sessions (high→low)</option>
            <option value="util">Sort: Resource utilization (high→low)</option>
            <option value="name">Sort: Connector name (A→Z)</option>
          </select>

          <div className="ml-auto flex items-center gap-4 text-sm text-gray-500">
            {/* Auto-refresh toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs">Auto-refresh (30s)</span>
              <button
                role="switch"
                aria-checked={autoRefresh}
                onClick={() => setAutoRefresh((v) => !v)}
                className={`relative w-9 h-5 rounded-full transition-colors duration-150 ${autoRefresh ? 'bg-green-400' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-150 ${autoRefresh ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
            </label>
            <span className="text-xs text-gray-400">Last updated: <strong className="text-gray-700">{lastUpdated}</strong></span>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1.5 h-9 px-4 border border-gray-200 rounded-full text-sm font-medium text-blue-600 hover:border-blue-400 bg-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stale banner */}
        {stale && (
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3.5 text-sm text-yellow-800">
            <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-500" />
            <span>
              <strong>Telemetry is stale.</strong> Live refresh failed. Showing last successful update from {lastUpdated}. Values may not reflect current connector state.
            </span>
          </div>
        )}

        {/* Connector list */}
        {grouped ? (
          Object.entries(grouped).map(([tenantId, conns]) => {
            const groupSessions = conns.reduce((s, c) => s + (c.status === 'offline' ? 0 : sessCount(c)), 0);
            return (
              <div key={tenantId}>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-4 mb-2">
                  {TENANT_NAMES[tenantId]}
                  <span className="font-semibold normal-case tracking-normal text-gray-300 ml-1.5">
                    · {conns.length} connector{conns.length !== 1 ? 's' : ''}, {groupSessions.toLocaleString()} active sessions
                  </span>
                </div>
                {conns.map((c) => (
                  <ConnectorRow
                    key={c.id}
                    connector={c}
                    isOpen={openSet.has(c.id)}
                    tenantFilter={tenantFilter}
                    searchQuery={search}
                    onToggle={() => toggleRow(c.id)}
                  />
                ))}
              </div>
            );
          })
        ) : (
          visible.length === 0
            ? <div className="text-sm text-gray-400 text-center py-12">No connectors in scope.</div>
            : visible.map((c) => (
              <ConnectorRow
                key={c.id}
                connector={c}
                isOpen={openSet.has(c.id)}
                tenantFilter={tenantFilter}
                searchQuery={search}
                onToggle={() => toggleRow(c.id)}
              />
            ))
        )}
      </div>
    </div>
  );
}
