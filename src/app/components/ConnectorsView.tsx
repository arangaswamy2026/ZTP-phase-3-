import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Server, MoreVertical, Settings, Info, X, Search } from 'lucide-react@0.487.0';
import { TablePanel, DataTable, THead, TH, TR, TD, TableFoot, StatusBadge as DSStatusBadge } from './ds';

interface ConnectorCard {
  type: 'secure-remote-access' | 'service-tunnel';
  typeLabel: string;
  name: string;
  status: 'online' | 'offline';
  cpu?: number;
  mem?: number;
  privateNetworks?: { label: string; ipRange: string };
  internalDomains?: string[];
  policyRules?: string[];
}

// ── Toggle ──────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[22px] w-[40px] shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-[#0066cc]' : 'bg-[#d1d5db]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200 mt-[2px] ${
          checked ? 'translate-x-[20px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  );
}

// ── FirmwareSettingsModal ───────────────────────────────────────────────────────
function FirmwareSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [checkForUpdates, setCheckForUpdates] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);
  const [autoInstall, setAutoInstall] = useState(true);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal card */}
      <div className="relative z-10 bg-white rounded-[12px] shadow-[0_8px_40px_rgba(0,0,0,0.20)] w-[520px] max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-[#1a1a1a] leading-tight">Firmware Upgrade Settings</h2>
            <p className="text-[13px] text-[#717182] mt-0.5">Configure automatic update and install preferences for this connector</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#ececf0] text-[#717182] shrink-0 ml-4 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 pb-2">

          {/* ── UPDATE AVAILABILITY ──────────────────────────────────────────── */}
          <div className="h-px bg-[#e5e7eb] mb-3" />
          <p className="text-[11px] font-semibold text-[#717182] uppercase tracking-[0.07em] mb-3">
            Update Availability
          </p>

          {/* Info callout */}
          <div className="flex items-start gap-2.5 bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] px-3 py-2.5 mb-4">
            <Info className="w-[14px] h-[14px] text-[#0066cc] shrink-0 mt-px" />
            <p className="text-[12px] text-[#1e40af] leading-snug">
              Ensure your SonicWall firewall is secure by receiving notifications of available firmware updates.
            </p>
          </div>

          <div className="space-y-0">
            <div className="flex items-center justify-between py-3">
              <span className="text-[13px] text-[#1a1a1a]">Check for available updates</span>
              <Toggle
                checked={checkForUpdates}
                onChange={(v) => {
                  setCheckForUpdates(v);
                  if (v) { setCriticalOnly(false); setAutoDownload(false); setAutoInstall(false); }
                }}
              />
            </div>
            {checkForUpdates && (
              <>
                <div className="h-px bg-[#f1f3f5]" />
                <div className="flex items-center justify-between py-3">
                  <span className="text-[13px] text-[#1a1a1a]">Critical updates only</span>
                  <Toggle checked={criticalOnly} onChange={setCriticalOnly} />
                </div>
                <div className="h-px bg-[#f1f3f5]" />
                <div className="flex items-center justify-between py-3">
                  <span className="text-[13px] text-[#1a1a1a]">Download new firmware automatically when available</span>
                  <Toggle checked={autoDownload} onChange={setAutoDownload} />
                </div>
              </>
            )}
          </div>

          {/* ── AUTOMATIC INSTALLS — only shown when check + auto-download are on */}
          {checkForUpdates && autoDownload && (
            <>
              <div className="h-px bg-[#e5e7eb] mt-4 mb-3" />
              <p className="text-[11px] font-semibold text-[#717182] uppercase tracking-[0.07em] mb-3">
                Automatic Installs
              </p>

              <div className="flex items-start gap-2.5 bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] px-3 py-2.5 mb-4">
                <Info className="w-[14px] h-[14px] text-[#0066cc] shrink-0 mt-px" />
                <p className="text-[12px] text-[#1e40af] leading-snug">
                  Schedule installation of firmware updates to be done during quieter maintenance windows.
                </p>
              </div>

              <div className="space-y-0">
                <div className="flex items-center justify-between py-3">
                  <span className="text-[13px] text-[#1a1a1a]">Automatically install downloaded firmware</span>
                  <Toggle checked={autoInstall} onChange={setAutoInstall} />
                </div>
                {autoInstall && (
                  <>
                    <div className="h-px bg-[#f1f3f5]" />
                    <div className="flex flex-col gap-1 py-3">
                      <span className="text-[13px] text-[#1a1a1a]">Schedule</span>
                      <div className="flex items-center gap-2.5 mt-1">
                        <div>
                          <p className="text-[12px] font-semibold text-[#1a1a1a] leading-tight">Firmware Install Hours</p>
                          <p className="text-[12px] text-[#717182]">SU–SA 01:00 to 02:00</p>
                        </div>
                        <button className="h-[30px] px-3.5 text-[12px] font-medium text-[#1a1a1a] border border-[#d1d5db] rounded-[8px] hover:bg-[#f8f9fa] whitespace-nowrap">
                          Set Schedule
                        </button>
                        <Info className="w-[13px] h-[13px] text-[#717182] shrink-0" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <div className="pb-4" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#e5e7eb] shrink-0">
          <button
            onClick={onClose}
            className="h-[34px] px-5 text-[13px] font-medium text-[#1a1a1a] border border-[#d1d5db] rounded-[8px] hover:bg-[#f8f9fa]"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="h-[34px] px-5 text-[13px] font-medium text-white bg-[#0066cc] rounded-[8px] hover:bg-[#0052a6]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tenant session data ────────────────────────────────────────────────────────

interface TenantSession {
  id: string;
  user: string;
  connector: string;
  connectorId: string;
  app: string;
  duration: string;
  status: 'active' | 'idle' | 'disconnected';
}

const TENANT_SESSIONS: TenantSession[] = [
  { id:'s01', user:'maria@riversidedental.com',   connector:'ZTP Connector',                       connectorId:'ztc-rv-01', app:'Dentrix',        duration:'2h 14m', status:'active' },
  { id:'s02', user:'jessica@riversidedental.com', connector:'ZTP Connector',                       connectorId:'ztc-rv-01', app:'Microsoft 365',  duration:'41m',    status:'active' },
  { id:'s03', user:'mark@riversidedental.com',    connector:'ZTP Connector',                       connectorId:'ztc-rv-01', app:'QuickBooks',      duration:'1h 08m', status:'idle'   },
  { id:'s04', user:'dana@riversidedental.com',    connector:'ZTP Connector',                       connectorId:'ztc-rv-01', app:'Microsoft 365',  duration:'22m',    status:'active' },
  { id:'s05', user:'priya@riversidedental.com',   connector:'ZTP Connector',                       connectorId:'ztc-rv-01', app:'SharePoint',      duration:'55m',    status:'active' },
  { id:'s06', user:'james@riversidedental.com',   connector:'ST - Remote - Employee - Access - 01', connectorId:'ztc-rv-01', app:'RDP',            duration:'3h 02m', status:'active' },
  { id:'s07', user:'lucy@riversidedental.com',    connector:'ST - Remote - Employee - Access - 01', connectorId:'ztc-rv-01', app:'SSH',            duration:'18m',    status:'idle'   },
  { id:'s08', user:'tom@riversidedental.com',     connector:'ST - Remote - Employee - Access - 01', connectorId:'ztc-rv-01', app:'VNC',            duration:'47m',    status:'active' },
  { id:'s09', user:'anna@riversidedental.com',    connector:'ZTP Connector',                       connectorId:'ztc-rv-01', app:'Dentrix',        duration:'1h 31m', status:'active' },
  { id:'s10', user:'chen@riversidedental.com',    connector:'ZTP Connector',                       connectorId:'ztc-rv-01', app:'SAP',            duration:'29m',    status:'idle'   },
  { id:'s11', user:'ben@riversidedental.com',     connector:'ST - Remote - Employee - Access - 01', connectorId:'ztc-rv-01', app:'RDP',            duration:'5m',     status:'disconnected' },
  { id:'s12', user:'sara@riversidedental.com',    connector:'ZTP Connector',                       connectorId:'ztc-rv-01', app:'Microsoft 365',  duration:'2h 05m', status:'active' },
];

const SESSION_STATUS_META: Record<TenantSession['status'], { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  active:       { label: 'Active',       variant: 'success' },
  idle:         { label: 'Idle',         variant: 'warning' },
  disconnected: { label: 'Disconnected', variant: 'neutral' },
};

// ── Connector cards data ───────────────────────────────────────────────────────

const connectors: ConnectorCard[] = [
  {
    type: 'secure-remote-access',
    typeLabel: 'Secure Remote Access',
    name: 'ZTP Connector',
    status: 'online',
    cpu: 31,
    mem: 38,
    privateNetworks: { label: 'Employee Zone', ipRange: '192.10.10.0/16' },
    internalDomains: ['dentrix.local', 'erp.riverside.local'],
  },
  {
    type: 'service-tunnel',
    typeLabel: 'Service Tunnel',
    name: 'ST - Remote - Employee - Access - 01',
    status: 'online',
    cpu: 14,
    mem: 22,
    policyRules: ['Remote Employee Access', 'Remote Employee Access'],
  },
];

function cardBarColor(v: number) {
  if (v >= 90) return 'var(--destructive)';
  if (v >= 75) return 'var(--warning)';
  if (v >= 60) return 'color-mix(in srgb, var(--warning) 55%, #ffffff)';
  return 'var(--success)';
}

function CardUtilBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5" style={{ minWidth: 0 }}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] w-6 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)', minWidth: '48px' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: cardBarColor(value) }} />
      </div>
      <span className="text-[10px] tabular-nums text-[#9ca3af] w-7 text-right shrink-0">{value}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: 'online' | 'offline' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-[8px] ${
        status === 'online'
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-gray-100 text-gray-500 border border-gray-200'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'online' ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />
      {status === 'online' ? 'Online' : 'Offline'}
    </span>
  );
}

function OverflowMenu({ onSettings }: { onSettings: () => void }) {
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
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="w-[28px] h-[28px] flex items-center justify-center rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white hover:bg-[#ececf0] text-[#717182]"
      >
        <MoreVertical className="w-[14px] h-[14px]" />
      </button>
      {open && (
        <div className="absolute right-0 top-[32px] z-20 min-w-[140px] bg-white border border-[rgba(0,0,0,0.1)] rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] py-1 overflow-hidden">
          <button
            className="w-full px-3 py-2 text-[13px] text-[#1a1a1a] hover:bg-[#f8f9fa] text-left"
            onClick={() => { setOpen(false); onSettings(); }}
          >
            Firmware Upgrade Settings
          </button>
        </div>
      )}
    </div>
  );
}

function ConnectorCard({ connector }: { connector: ConnectorCard }) {
  const [modalOpen, setModalOpen] = useState(false);
  const hasSettings = connector.type === 'secure-remote-access';

  return (
    <>
      {hasSettings && <FirmwareSettingsModal open={modalOpen} onClose={() => setModalOpen(false)} />}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">
                {connector.typeLabel}
              </p>
              <p className="text-sm font-semibold text-gray-900 truncate">{connector.name}</p>
            </div>
          </div>
          {/* Resource utilization bars */}
          {connector.status === 'online' && connector.cpu != null && connector.mem != null && (
            <div className="flex flex-col gap-1 flex-1 mx-3 pt-0.5" style={{ minWidth: '100px', maxWidth: '160px' }}>
              <CardUtilBar label="CPU" value={connector.cpu} />
              <CardUtilBar label="Mem" value={connector.mem} />
            </div>
          )}
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={connector.status} />
            <OverflowMenu onSettings={hasSettings ? () => setModalOpen(true) : () => {}} />
          </div>
        </div>

      <div className="border-t border-gray-100" />

      {/* Private Networks */}
      {connector.privateNetworks && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {/* Row 1 */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Private Networks
            </p>
            <p className="text-sm text-gray-700">{connector.privateNetworks.label}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              IP Range
            </p>
            <p className="text-sm text-gray-700">{connector.privateNetworks.ipRange}</p>
          </div>
          {/* Row 2 */}
          {connector.internalDomains && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Internal Domains
              </p>
              <div className="flex flex-wrap gap-2">
                {connector.internalDomains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center h-[24px] text-[11px] font-semibold text-[#6a7282] bg-[#ececf0] border border-[#e5e7eb] px-[8px] rounded-[8px]"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Firmware Version
            </p>
            <p className="text-sm text-gray-700">ZTOS 1.0.0.123</p>
          </div>
        </div>
      )}

      {/* Policy Rules */}
      {connector.policyRules && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Policy Rules
          </p>
          <div className="space-y-1">
            {connector.policyRules.map((rule, i) => (
              <p key={i} className="text-sm text-gray-700 border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                {rule}
              </p>
            ))}
          </div>
        </div>
      )}
      </div>
    </>
  );
}

export function ConnectorsView() {
  const navigate = useNavigate();
  const [search,    setSearch]    = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy,    setSortBy]    = useState('user');

  const toMin = (d: string) => {
    const h = parseInt(d.match(/(\d+)h/)?.[1] ?? '0');
    const m = parseInt(d.match(/(\d+)m/)?.[1] ?? '0');
    return h * 60 + m;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = TENANT_SESSIONS.filter((s) => {
      if (q && !s.user.toLowerCase().includes(q) && !s.app.toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      return true;
    });
    if (sortBy === 'duration') list = [...list].sort((a, b) => toMin(b.duration) - toMin(a.duration));
    else if (sortBy === 'app')  list = [...list].sort((a, b) => a.app.localeCompare(b.app));
    else list = [...list].sort((a, b) => a.user.localeCompare(b.user));
    return list;
  }, [search, statusFilter, sortBy]);

  return (
    <div className="space-y-8 pb-10">
      {/* Connector cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Connectors and Tunnels</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connectors.map((c) => (
            <ConnectorCard key={c.name} connector={c} />
          ))}
        </div>
      </div>

      {/* Active Sessions table */}
      <div>
        <h2 className="text-sm font-semibold text-[#1a1a1a] mb-3">Active Sessions</h2>
        <TablePanel>
          {/* Toolbar */}
          <div className="flex items-center gap-[10px] px-4 py-3 border-b border-[rgba(0,0,0,0.1)] bg-white flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-[14px] h-[14px] absolute left-[10px] top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
              <input
                type="text"
                placeholder="Search by user or app…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-[34px] pl-[32px] pr-3 w-[220px] text-[13px] text-[#1a1a1a] border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0066cc] placeholder:text-[#9ca3af]"
              />
            </div>

            {/* Divider */}
            <div className="w-px h-[20px] bg-[rgba(0,0,0,0.1)] shrink-0" />

            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-[34px] pl-3 pr-8 text-[13px] text-[#1a1a1a] border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="idle">Idle</option>
                <option value="disconnected">Disconnected</option>
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

          {/* Table */}
          <DataTable>
            <THead>
              <tr>
                <TH>Connected User</TH>
                <TH>Application</TH>
                <TH>Session Duration</TH>
              </tr>
            </THead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-[13px] text-[#717182] text-center">
                    No sessions match the current filters.
                  </td>
                </tr>
              ) : filtered.map((s) => {
                const meta = SESSION_STATUS_META[s.status];
                return (
                  <TR
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/all-tenants-system-status/${s.connectorId}`)}
                  >
                    <TD>{s.user}</TD>
                    <TD>{s.app}</TD>
                    <TD className="tabular-nums text-[#717182]">{s.duration}</TD>
                  </TR>
                );
              })}
            </tbody>
          </DataTable>

          <TableFoot>
            <span>
              {filtered.length !== TENANT_SESSIONS.length
                ? `${filtered.length} of ${TENANT_SESSIONS.length} sessions`
                : `${TENANT_SESSIONS.length} sessions`}
            </span>
          </TableFoot>
        </TablePanel>
      </div>
    </div>
  );
}
