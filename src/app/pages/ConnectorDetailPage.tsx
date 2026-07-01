import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Search } from 'lucide-react@0.487.0';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge, TablePanel, DataTable, THead, TH, TR, TD, TableFoot } from '../components/ds';
import { INITIAL_CONNECTORS, TENANT_NAMES } from './AllTenantsSystemStatusPage';
import type { Connector } from './AllTenantsSystemStatusPage';

const STATUS_META: Record<Connector['status'], { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
  ok:      { label: 'Healthy',  variant: 'success' },
  warn:    { label: 'Warning',  variant: 'warning' },
  crit:    { label: 'Critical', variant: 'error'   },
  offline: { label: 'Offline',  variant: 'neutral' },
};

function barColor(v: number) {
  if (v >= 90) return '#d4183d';
  if (v >= 75) return '#d97706';
  if (v >= 60) return '#f59e0b';
  return '#16a34a';
}

function UtilBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 shrink-0 font-semibold text-[#717182] uppercase text-[10px]">{label}</span>
      <div className="flex-1 h-[6px] bg-[#ececf0] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: barColor(value) }} />
      </div>
      <span className="w-8 shrink-0 text-right tabular-nums text-[12px] text-[#1a1a1a]">{value}%</span>
    </div>
  );
}

export function ConnectorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const connector = INITIAL_CONNECTORS.find((c) => c.id === id);

  const [search,  setSearch]  = useState('');
  const [appFilter, setAppFilter] = useState('all');
  const [sortBy,  setSortBy]  = useState('user');

  if (!connector) {
    return (
      <div className="space-y-6 pb-10">
        <PageHeader
          title="Connector not found"
          back={{ label: 'System Status', onClick: () => navigate('/all-tenants-system-status') }}
        />
        <p className="text-sm text-[#717182]">No connector found with ID "{id}".</p>
      </div>
    );
  }

  const meta     = STATUS_META[connector.status];
  const offline  = connector.status === 'offline';
  const sessions = connector.sessions ?? [];

  // Unique apps for the filter dropdown
  const allApps = useMemo(() => {
    const apps = Array.from(new Set(sessions.map((s) => s.app))).sort();
    return apps;
  }, [sessions]);

  const filtered = useMemo(() => {
    let list = sessions.slice(0, 500);
    const q = search.toLowerCase();
    if (q) list = list.filter((s) => s.user.toLowerCase().includes(q) || s.app.toLowerCase().includes(q));
    if (appFilter !== 'all') list = list.filter((s) => s.app === appFilter);
    if (sortBy === 'duration') {
      // parse "Xh Ym" → minutes for sorting
      const toMin = (d: string) => {
        const h = parseInt(d.match(/(\d+)h/)?.[1] ?? '0');
        const m = parseInt(d.match(/(\d+)m/)?.[1] ?? '0');
        return h * 60 + m;
      };
      list = [...list].sort((a, b) => toMin(b.duration) - toMin(a.duration));
    } else if (sortBy === 'app') {
      list = [...list].sort((a, b) => a.app.localeCompare(b.app));
    } else {
      list = [...list].sort((a, b) => a.user.localeCompare(b.user));
    }
    return list;
  }, [sessions, search, appFilter, sortBy]);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={connector.name}
        subtitle={`${connector.id} · ${connector.region}`}
        back={{ label: 'System Status', onClick: () => navigate('/all-tenants-system-status') }}
      />

      {/* Overview cards — 5 across */}
      <div className="grid grid-cols-5 gap-3">
        {/* Status */}
        <div className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[12px] px-4 py-3.5 shadow-sm">
          <div className="text-[11px] font-semibold text-[#717182] uppercase tracking-[0.07em] mb-2">Status</div>
          <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>
        </div>

        {/* Tenant */}
        <div className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[12px] px-4 py-3.5 shadow-sm">
          <div className="text-[11px] font-semibold text-[#717182] uppercase tracking-[0.07em] mb-2">Tenant</div>
          <span className="text-[13px] font-medium text-[#1a1a1a] leading-snug">{TENANT_NAMES[connector.tenant]}</span>
        </div>

        {/* Firmware */}
        <div className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[12px] px-4 py-3.5 shadow-sm">
          <div className="text-[11px] font-semibold text-[#717182] uppercase tracking-[0.07em] mb-2">Firmware</div>
          <span className="text-[13px] font-mono text-[#1a1a1a]">{offline ? '—' : connector.firmware}</span>
        </div>

        {/* Active Sessions */}
        <div className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[12px] px-4 py-3.5 shadow-sm">
          <div className="text-[11px] font-semibold text-[#717182] uppercase tracking-[0.07em] mb-2">Active Sessions</div>
          <span className="text-[22px] font-bold text-[#1a1a1a] leading-none">{offline ? '—' : sessions.length.toLocaleString()}</span>
        </div>

        {/* Resource Utilisation */}
        <div className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[12px] px-4 py-3.5 shadow-sm">
          <div className="text-[11px] font-semibold text-[#717182] uppercase tracking-[0.07em] mb-3">Resource Utilisation</div>
          {offline ? (
            <span className="text-[12px] text-[#717182]">No data — offline</span>
          ) : (
            <div className="space-y-2.5">
              <UtilBar label="CPU" value={connector.cpu} />
              <UtilBar label="Mem" value={connector.mem} />
            </div>
          )}
        </div>
      </div>

      {/* Active sessions table — DS DataTable pattern */}
      <TablePanel>
        {/* Toolbar */}
        <div className="flex items-center gap-[10px] px-4 py-3 border-b border-[rgba(0,0,0,0.1)] bg-white">
          {/* Search */}
          <div className="relative">
            <Search className="w-[14px] h-[14px] absolute left-[10px] top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by user…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[34px] pl-[32px] pr-3 w-[220px] text-[13px] text-[#1a1a1a] border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0066cc] placeholder:text-[#9ca3af]"
            />
          </div>

          {/* Divider */}
          <div className="w-px h-[20px] bg-[rgba(0,0,0,0.1)] shrink-0" />

          {/* Application filter */}
          <div className="relative">
            <select
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              className="h-[34px] pl-3 pr-8 text-[13px] text-[#1a1a1a] border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
            >
              <option value="all">All applications</option>
              {allApps.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#717182]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-[34px] pl-3 pr-8 text-[13px] text-[#1a1a1a] border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
            >
              <option value="user">Sort: User (A→Z)</option>
              <option value="duration">Sort: Duration (longest)</option>
              <option value="app">Sort: Application (A→Z)</option>
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#717182]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>

        {/* Table body */}
        {offline ? (
          <div className="px-4 py-6 text-[13px] text-[#d4183d]">
            Connector is not reporting — session data unavailable.
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-4 py-10 text-[13px] text-[#717182] text-center">
            No active sessions on this connector right now.
          </div>
        ) : (
          <>
            <div className="max-h-[480px] overflow-y-auto">
              <DataTable>
                <THead className="sticky top-0">
                  <tr>
                    <TH>Connected User</TH>
                    <TH>Session Duration</TH>
                    <TH>Application Accessed</TH>
                  </tr>
                </THead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-[13px] text-[#717182] text-center">
                        No sessions match the current filters.
                      </td>
                    </tr>
                  ) : filtered.map((s, i) => (
                    <TR key={i}>
                      <TD>{s.user}</TD>
                      <TD className="tabular-nums text-[#717182]">{s.duration}</TD>
                      <TD>{s.app}</TD>
                    </TR>
                  ))}
                </tbody>
              </DataTable>
            </div>
            <TableFoot>
              <span>
                {filtered.length !== sessions.length
                  ? `Showing ${filtered.length} of ${sessions.length.toLocaleString()} sessions`
                  : `${sessions.length.toLocaleString()} session${sessions.length !== 1 ? 's' : ''}`}
              </span>
            </TableFoot>
          </>
        )}
      </TablePanel>
    </div>
  );
}
