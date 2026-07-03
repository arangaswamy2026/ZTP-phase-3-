import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, RefreshCw, MoreVertical, X, Check, Download, Loader2 } from 'lucide-react';
import { StatusBadge, DataTable, THead, TH, TR, TD } from '../components/ds';
import { PageHeader } from '../components/PageHeader';

// ── Data ──────────────────────────────────────────────────────────────────────

export const TENANT_NAMES: Record<string, string> = {
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
  firmware: string;
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

export type { Connector };
export const INITIAL_CONNECTORS: Connector[] = [
  { id:'ztc-rv-01', name:'ZTC-Riverside-01', tenant:'riverside', region:'us-west-2', status:'ok',      firmware:'ZTOS 1.0.0.1284', cpu:31, mem:38,
    sessions:[
      { user:'maria@riversidedental.com',   duration:'2h 14m', app:'Dentrix' },
      { user:'jessica@riversidedental.com', duration:'41m',    app:'Microsoft 365' },
      { user:'mark@riversidedental.com',    duration:'1h 08m', app:'QuickBooks' },
      { user:'dana@riversidedental.com',    duration:'22m',    app:'Microsoft 365' },
      { user:'priya@riversidedental.com',   duration:'55m',    app:'SharePoint' },
    ] },
  { id:'ztc-ng-01', name:'ZTC-Northgate-01', tenant:'northgate', region:'us-east-1', status:'crit',    firmware:'ZTOS 1.0.0.1201', cpu:94, mem:91,
    sessions: bulk(1240, 'northgatelog') },
  { id:'ztc-sh-01', name:'ZTC-Summit-01',    tenant:'summit',    region:'us-east-1', status:'warn',    firmware:'ZTOS 1.0.0.1256', cpu:78, mem:71,
    sessions:[
      { user:'priya@summithealth.com', duration:'26m',    app:'Epic EHR' },
      { user:'leo@summithealth.com',   duration:'1h 02m', app:'Microsoft 365' },
      { user:'ron@summithealth.com',   duration:'3h 41m', app:'SharePoint' },
    ] },
  { id:'ztc-lc-01', name:'ZTC-Lakeside-01',  tenant:'lakeside',  region:'eu-west-1', status:'offline', firmware:'ZTOS 1.0.0.1178', cpu:0,  mem:0,  sessions:null },
  { id:'ztc-hl-01', name:'ZTC-Harbor-01',    tenant:'harbor',    region:'us-west-2', status:'ok',      firmware:'ZTOS 1.0.0.1284', cpu:14, mem:22, sessions:[] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_META: Record<ConnStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
  ok:      { label: 'Healthy',  variant: 'success' },
  warn:    { label: 'Warning',  variant: 'warning' },
  crit:    { label: 'Critical', variant: 'error'   },
  offline: { label: 'Offline',  variant: 'neutral' },
};

// Utilization bar color references semantic tokens (one-token recolor).
function barColor(v: number) {
  if (v >= 90) return 'var(--destructive)';
  if (v >= 75) return 'var(--warning)';
  if (v >= 60) return 'color-mix(in srgb, var(--warning) 55%, #ffffff)';
  return 'var(--success)';
}

function sessCount(c: Connector) {
  return c.sessions === null ? 0 : c.sessions.length;
}

function stamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function UtilBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span className="w-7 font-semibold uppercase">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[60px]">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: barColor(value) }} />
      </div>
      <span className="w-8 text-right tabular-nums">{value}%</span>
    </div>
  );
}

// ── Update stages ─────────────────────────────────────────────────────────────

type UpdateStage = 'idle' | 'downloading' | 'installing' | 'done' | 'failed';

interface UpdateState {
  stage: UpdateStage;
  progress: number; // 0-100
}

// ── Auto-update modal ─────────────────────────────────────────────────────────

const NEW_FIRMWARE = 'ZTOS 1.0.0.1301';

function AutoUpdateModal({
  connectors,
  onClose,
  onComplete,
}: {
  connectors: Connector[];
  onClose: () => void;
  onComplete: (ids: string[]) => void;
}) {
  const eligible = connectors.filter((c) => c.status !== 'offline');
  const [selected, setSelected] = useState<Set<string>>(new Set(eligible.map((c) => c.id)));
  const [updateMap, setUpdateMap] = useState<Record<string, UpdateState>>({});
  const running = Object.keys(updateMap).length > 0;
  const allDone = running && Object.values(updateMap).every((u) => u.stage === 'done' || u.stage === 'failed');

  function toggleAll() {
    setSelected(selected.size === eligible.length ? new Set() : new Set(eligible.map((c) => c.id)));
  }

  function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  function startUpdate() {
    const ids = Array.from(selected);
    const initial: Record<string, UpdateState> = {};
    ids.forEach((id) => { initial[id] = { stage: 'downloading', progress: 0 }; });
    setUpdateMap(initial);

    // Simulate each connector independently with staggered timing
    ids.forEach((id, i) => {
      const delay = i * 300;
      // Download phase: 0→100 over ~2s
      let prog = 0;
      const dlTick = setInterval(() => {
        prog = Math.min(100, prog + Math.floor(Math.random() * 18) + 8);
        setUpdateMap((prev) => ({ ...prev, [id]: { stage: 'downloading', progress: prog } }));
        if (prog >= 100) {
          clearInterval(dlTick);
          // Installing phase: 0→100 over ~1.5s
          let instProg = 0;
          setUpdateMap((prev) => ({ ...prev, [id]: { stage: 'installing', progress: 0 } }));
          const instTick = setInterval(() => {
            instProg = Math.min(100, instProg + Math.floor(Math.random() * 22) + 10);
            setUpdateMap((prev) => ({ ...prev, [id]: { stage: 'installing', progress: instProg } }));
            if (instProg >= 100) {
              clearInterval(instTick);
              setUpdateMap((prev) => ({ ...prev, [id]: { stage: 'done', progress: 100 } }));
            }
          }, 120);
        }
      }, 120 + delay);
    });
  }

  function handleClose() {
    if (allDone) {
      onComplete(Object.entries(updateMap).filter(([, u]) => u.stage === 'done').map(([id]) => id));
    }
    onClose();
  }

  const stageLabel: Record<UpdateStage, string> = {
    idle: '', downloading: 'Downloading…', installing: 'Installing…', done: 'Updated', failed: 'Failed',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={!running ? handleClose : undefined} />
      <div className="relative z-10 bg-white rounded-[14px] shadow-[0_8px_40px_rgba(0,0,0,0.20)] w-[560px] max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0 border-b border-[#e5e7eb]">
          <div>
            <h2 className="text-[16px] font-semibold text-[#1a1a1a]">Auto Update Firmware</h2>
            <p className="text-[13px] text-[#717182] mt-0.5">
              {running
                ? allDone ? 'Update complete.' : 'Update in progress — do not close this window.'
                : `Select connectors to update to ${NEW_FIRMWARE}`}
            </p>
          </div>
          {!running && (
            <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#ececf0] text-[#717182] shrink-0 ml-4">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">

          {/* Select all — only shown before running */}
          {!running && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#f1f3f5]">
              <input
                type="checkbox"
                id="select-all"
                checked={selected.size === eligible.length}
                ref={(el) => { if (el) el.indeterminate = selected.size > 0 && selected.size < eligible.length; }}
                onChange={toggleAll}
                className="w-4 h-4 accent-[#0066cc] cursor-pointer"
              />
              <label htmlFor="select-all" className="text-[13px] font-medium text-[#1a1a1a] cursor-pointer">
                Select all ({eligible.length} eligible)
              </label>
            </div>
          )}

          {/* Connector rows */}
          <div className="space-y-2">
            {connectors.map((c) => {
              const isOffline = c.status === 'offline';
              const upd = updateMap[c.id];
              const isSelected = selected.has(c.id);

              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 border transition-colors ${
                    isOffline ? 'border-[#f1f3f5] bg-[#fafafa] opacity-50' :
                    upd?.stage === 'done' ? 'border-green-200 bg-green-50' :
                    upd?.stage === 'failed' ? 'border-red-200 bg-red-50' :
                    upd ? 'border-[#bfdbfe] bg-[#eff6ff]' :
                    isSelected ? 'border-[#bfdbfe] bg-[#f0f7ff]' :
                    'border-[#e5e7eb] bg-white'
                  }`}
                >
                  {/* Checkbox or status icon */}
                  {!running ? (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isOffline}
                      onChange={() => toggle(c.id)}
                      className="w-4 h-4 accent-[#0066cc] cursor-pointer shrink-0"
                    />
                  ) : (
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                      {upd?.stage === 'done'     && <Check className="w-4 h-4 text-green-600" />}
                      {upd?.stage === 'failed'   && <X className="w-4 h-4 text-red-500" />}
                      {(upd?.stage === 'downloading' || upd?.stage === 'installing') && (
                        <Loader2 className="w-4 h-4 text-[#0066cc] animate-spin" />
                      )}
                      {!upd && <span className="w-1.5 h-1.5 rounded-full bg-[#d1d5db]" />}
                    </div>
                  )}

                  {/* Connector info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#1a1a1a] truncate">{c.name}</span>
                      {isOffline && <span className="text-[10px] text-[#9ca3af] font-medium uppercase tracking-wide shrink-0">Offline</span>}
                    </div>
                    <div className="text-[11px] text-[#9ca3af] mt-0.5">{TENANT_NAMES[c.tenant]} · {c.firmware}</div>
                  </div>

                  {/* Progress bar or stage label */}
                  {upd && upd.stage !== 'done' && upd.stage !== 'failed' && (
                    <div className="flex flex-col items-end gap-1 w-[120px] shrink-0">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] text-[#0066cc] font-medium">{stageLabel[upd.stage]}</span>
                        <span className="text-[10px] tabular-nums text-[#717182]">{upd.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#e0e7ef] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0066cc] transition-all duration-150"
                          style={{ width: `${upd.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {upd?.stage === 'done' && (
                    <span className="text-[12px] font-medium text-green-700 shrink-0">{NEW_FIRMWARE}</span>
                  )}
                  {upd?.stage === 'failed' && (
                    <span className="text-[12px] font-medium text-red-600 shrink-0">Failed</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#e5e7eb] shrink-0">
          <span className="text-[12px] text-[#9ca3af]">
            {!running
              ? `${selected.size} of ${eligible.length} connectors selected`
              : allDone
              ? `${Object.values(updateMap).filter((u) => u.stage === 'done').length} updated · ${Object.values(updateMap).filter((u) => u.stage === 'failed').length} failed`
              : 'Updating firmware…'
            }
          </span>
          <div className="flex gap-2">
            {!running && (
              <button onClick={handleClose} className="h-[34px] px-5 text-[13px] font-medium text-[#1a1a1a] border border-[#d1d5db] rounded-[8px] hover:bg-[#f8f9fa]">
                Cancel
              </button>
            )}
            {!running ? (
              <button
                onClick={startUpdate}
                disabled={selected.size === 0}
                className="h-[34px] px-5 text-[13px] font-medium text-white bg-[#0066cc] rounded-[8px] hover:bg-[#0052a6] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Update {selected.size > 0 ? `${selected.size} connector${selected.size > 1 ? 's' : ''}` : ''}
              </button>
            ) : allDone ? (
              <button onClick={handleClose} className="h-[34px] px-5 text-[13px] font-medium text-white bg-[#0066cc] rounded-[8px] hover:bg-[#0052a6]">
                Done
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Overflow menu ─────────────────────────────────────────────────────────────

function SectionOverflowMenu({ onAutoUpdate }: { onAutoUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white hover:bg-[#ececf0] text-[#717182] transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-[36px] z-20 min-w-[180px] bg-white border border-[rgba(0,0,0,0.1)] rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.10)] py-1 overflow-hidden">
          <button
            className="w-full px-3.5 py-2.5 text-[13px] text-[#1a1a1a] hover:bg-[#f8f9fa] text-left"
            onClick={() => { setOpen(false); onAutoUpdate(); }}
          >
            Auto Update Firmware
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AllTenantsSystemStatusPage() {
  const navigate = useNavigate();
  const [connectors, setConnectors] = useState<Connector[]>(
    INITIAL_CONNECTORS.map((c) => ({ ...c, sessions: c.sessions ? [...c.sessions] : c.sessions }))
  );
  const [search,           setSearch]           = useState('');
  const [lastUpdated,      setLastUpdated]      = useState(stamp());
  const [showAutoUpdate,   setShowAutoUpdate]   = useState(false);

  function refresh() {
    setConnectors((prev) =>
      prev.map((c) => {
        if (c.status === 'offline') return c;
        const nudge = () => Math.floor(Math.random() * 11) - 5;
        return { ...c, cpu: Math.min(99, Math.max(5, c.cpu + nudge())), mem: Math.min(99, Math.max(5, c.mem + nudge())) };
      })
    );
    setLastUpdated(stamp());
  }

  function handleUpdateComplete(ids: string[]) {
    setConnectors((prev) =>
      prev.map((c) => ids.includes(c.id) ? { ...c, firmware: NEW_FIRMWARE } : c)
    );
  }

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return connectors;
    return connectors.filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || TENANT_NAMES[c.tenant]?.toLowerCase().includes(q));
  }, [connectors, search]);

  // Summary tiles
  const totalSessions  = connectors.reduce((s, c) => s + (c.status === 'offline' ? 0 : sessCount(c)), 0);
  const needsAttention = connectors.filter((c) => c.status !== 'ok').length;
  const tenantCount    = new Set(connectors.map((c) => c.tenant)).size;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="System Status" />

      {/* Auto-update modal */}
      {showAutoUpdate && (
        <AutoUpdateModal
          connectors={connectors}
          onClose={() => setShowAutoUpdate(false)}
          onComplete={handleUpdateComplete}
        />
      )}

      {/* Connectors & Active Sessions */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-medium text-foreground">Connectors &amp; Active Sessions</h2>
          <span className="text-xs text-muted-foreground">All managed tenants (MSP rollup)</span>
          <div className="ml-auto">
            <SectionOverflowMenu onAutoUpdate={() => setShowAutoUpdate(true)} />
          </div>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-3 gap-3.5 mb-4">
          {[
            { label: 'Connectors / Tenants', value: `${connectors.length} / ${tenantCount}`, sub: 'across all customers' },
            { label: 'Active Sessions',       value: totalSessions.toLocaleString(),          sub: 'connected now' },
            { label: 'Needs Attention',       value: String(needsAttention),                  sub: 'warning, critical, or offline' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-card border rounded-2xl p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.04em]">{label}</div>
              <div className="text-2xl font-bold text-foreground mt-2 mb-1">{value}</div>
              <div className="text-xs text-muted-foreground">{sub}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap mb-3.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#717182] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by connector, ID or tenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[36px] pl-8 pr-3 w-64 text-[13px] text-[#1a1a1a] border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white focus:outline-none focus:outline-2 focus:outline-[#0066cc] focus:outline-offset-[1px] focus:border-[#0066cc] placeholder:text-[#717182]"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[12px] text-[#717182]">Last updated: <strong className="text-[#1a1a1a]">{lastUpdated}</strong></span>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1.5 h-[36px] px-4 border border-[rgba(0,0,0,0.1)] rounded-[8px] text-[13px] font-medium text-[#0066cc] hover:border-[#0066cc] bg-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Connector table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <DataTable>
            <THead>
              <tr>
                <TH className="px-4">Connector</TH>
                <TH className="px-4">Tenant</TH>
                <TH className="px-4">Active Sessions</TH>
                <TH className="px-4">Firmware</TH>
                <TH className="px-4">CPU / Memory</TH>
                <TH className="px-4">Status</TH>
                <TH className="px-4" />
              </tr>
            </THead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-sm text-muted-foreground text-center">
                    No connectors match the current filters.
                  </td>
                </tr>
              ) : visible.map((c) => {
                const meta    = STATUS_META[c.status];
                const offline = c.status === 'offline';
                const count   = sessCount(c);
                return (
                  <TR key={c.id}>
                    {/* Connector name + id */}
                    <TD className="px-4">
                      <div className="text-[13px] font-semibold text-foreground">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{c.id} · {c.region}</div>
                    </TD>

                    {/* Tenant */}
                    <TD className="px-4">
                      <span className="text-[13px] text-foreground">{TENANT_NAMES[c.tenant]}</span>
                    </TD>

                    {/* Sessions */}
                    <TD className="px-4 tabular-nums">
                      {offline
                        ? <span className="text-[13px] text-muted-foreground">—</span>
                        : <span className="text-[13px] font-semibold text-foreground">{count.toLocaleString()}</span>
                      }
                    </TD>

                    {/* Firmware */}
                    <TD className="px-4">
                      <span className="text-[13px] font-mono text-foreground">{offline ? '—' : c.firmware}</span>
                    </TD>

                    {/* CPU / Mem utilisation bars */}
                    <TD className="px-4">
                      {offline ? (
                        <span className="text-[12px] text-muted-foreground">No data</span>
                      ) : (
                        <div className="space-y-1.5 min-w-[130px]">
                          <UtilBar label="CPU" value={c.cpu} />
                          <UtilBar label="Mem" value={c.mem} />
                        </div>
                      )}
                    </TD>

                    {/* Status badge */}
                    <TD className="px-4">
                      <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>
                    </TD>

                    {/* View details */}
                    <TD className="px-4 text-right">
                      <button
                        onClick={() => navigate(`/all-tenants-system-status/${c.id}`)}
                        className="text-[13px] font-medium text-action hover:underline whitespace-nowrap"
                      >
                        View details
                      </button>
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </DataTable>
        </div>
      </div>
    </div>
  );
}
