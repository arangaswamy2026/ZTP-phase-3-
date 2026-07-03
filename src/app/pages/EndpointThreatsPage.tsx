import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Search, ChevronLeft, X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

// ── DS tokens (design-system.html) ────────────────────────────────────────────
// text: #1a1a1a  muted: #717182  accent: #0066cc  accent-hover: #0052a6
// error: #d4183d  warning: #d97706  success: #16a34a
// border: rgba(0,0,0,0.1)  surface-subtle: #ececf0  nav: #001b50  nav-accent: #ff5d00
// radius-sm:4px  radius-md:8px  radius-lg:16px  font: Inter

interface ThreatRow {
  id: number;
  name: string;
  sub: string;
  severity: 'High' | 'Medium' | 'Low';
  tenant: string;
  endpoint: string;
  userName: string;
  userEmail: string;
  userInitials: string;
  statusLabel: 'Not Quarantined' | 'Process Killed' | 'Quarantined';
  time: string;
  detectedVia: string;
  ip: string;
  hash: string;
}

const THREATS_DATA: ThreatRow[] = [
  { id: 1,  name: 'Ransom.Malbazar',        sub: 'Ransomware · In Memory',              severity: 'High',   tenant: 'Gav-India',     endpoint: 'DESKTOP-CT7UT4D',  userName: 'Bob Martinez',   userEmail: 'bob.martinez@gav-india.com',   userInitials: 'BM', statusLabel: 'Not Quarantined', time: '7 min ago',   detectedVia: 'On Process Behavior', ip: '192.168.163.128', hash: '4bf0818…907afb7df' },
  { id: 2,  name: 'Ransom.Malbazar',        sub: 'Ransomware · In Memory',              severity: 'High',   tenant: 'Gav-India',     endpoint: 'DESKTOP-CT7UT4D',  userName: 'Bob Martinez',   userEmail: 'bob.martinez@gav-india.com',   userInitials: 'BM', statusLabel: 'Not Quarantined', time: '8 min ago',   detectedVia: 'In Memory',           ip: '192.168.163.128', hash: '362e8f0…bf09dfd39' },
  { id: 3,  name: 'cmd.exe',                sub: 'Suspicious Shell · Process Behavior', severity: 'High',   tenant: 'Gav-India',     endpoint: 'DESKTOP-CT7UT4D',  userName: 'Bob Martinez',   userEmail: 'bob.martinez@gav-india.com',   userInitials: 'BM', statusLabel: 'Not Quarantined', time: '9 min ago',   detectedVia: 'On Process Behavior', ip: '192.168.163.128', hash: '16d9d5e…1b6cabc0' },
  { id: 4,  name: 'Ransom.Malbazar',        sub: 'Ransomware · In Memory',              severity: 'High',   tenant: 'Gav-India',     endpoint: 'DESKTOP-CT7UT4D',  userName: 'Bob Martinez',   userEmail: 'bob.martinez@gav-india.com',   userInitials: 'BM', statusLabel: 'Process Killed',  time: '13 min ago',  detectedVia: 'In Memory',           ip: '192.168.163.128', hash: '30308c2…4f4ce1f0fc' },
  { id: 5,  name: 'Ransom.Malbazar',        sub: 'Ransomware · In Memory',              severity: 'High',   tenant: 'Gav-India',     endpoint: 'DESKTOP-CT7UT4D',  userName: 'Bob Martinez',   userEmail: 'bob.martinez@gav-india.com',   userInitials: 'BM', statusLabel: 'Process Killed',  time: '14 min ago',  detectedVia: 'In Memory',           ip: '192.168.163.128', hash: 'e29ce61…1057c779d' },
  { id: 6,  name: 'harmless_md5_1.txt',     sub: 'Suspicious File · On Scan',           severity: 'Medium', tenant: 'QA',            endpoint: 'VTB280-PC1',       userName: 'System',         userEmail: 'system@qa.sonicwall.com',      userInitials: 'SY', statusLabel: 'Quarantined',     time: '23 min ago',  detectedVia: 'On Scan',             ip: '10.5.65.222',     hash: 'f9666ae…321f83fa37' },
  { id: 7,  name: 'ae1bc3bfec00e96fc4ab70', sub: 'PUA · On Download',                   severity: 'Low',    tenant: 'Yash Personal', endpoint: 'DESKTOP-M5K8HOU',  userName: 'Theron James',   userEmail: 'theron@yashpersonal.com',      userInitials: 'TJ', statusLabel: 'Quarantined',     time: '30 min ago',  detectedVia: 'On Download',         ip: '192.168.168.171', hash: 'ae1bc3b…345939627' },
  { id: 8,  name: 'Ransom.Malbazar',        sub: 'Ransomware · In Memory',              severity: 'High',   tenant: 'Gav-India',     endpoint: 'DESKTOP-CT7UT4D',  userName: 'Bob Martinez',   userEmail: 'bob.martinez@gav-india.com',   userInitials: 'BM', statusLabel: 'Process Killed',  time: '35 min ago',  detectedVia: 'In Memory',           ip: '192.168.163.128', hash: 'c25a08e…680c0e96' },
  { id: 9,  name: 'Ransom.Malbazar',        sub: 'Ransomware · In Memory',              severity: 'High',   tenant: 'Gav-India',     endpoint: 'DESKTOP-CT7UT4D',  userName: 'Bob Martinez',   userEmail: 'bob.martinez@gav-india.com',   userInitials: 'BM', statusLabel: 'Process Killed',  time: '36 min ago',  detectedVia: 'In Memory',           ip: '192.168.163.128', hash: 'b613751…3038ea7b' },
  { id: 10, name: 'Ransom.Malbazar',        sub: 'Ransomware · In Memory',              severity: 'High',   tenant: 'Gav-India',     endpoint: 'DESKTOP-CT7UT4D',  userName: 'Bob Martinez',   userEmail: 'bob.martinez@gav-india.com',   userInitials: 'BM', statusLabel: 'Process Killed',  time: '38 min ago',  detectedVia: 'In Memory',           ip: '192.168.163.128', hash: 'e3b0c4…7852b855' },
  { id: 11, name: 'Trojan.GenericKD',       sub: 'Trojan · On Download',                severity: 'High',   tenant: 'QA',            endpoint: 'LAPTOP-QA-007',    userName: 'Alice Chen',     userEmail: 'alice.chen@qa.sonicwall.com',  userInitials: 'AC', statusLabel: 'Process Killed',  time: '42 min ago',  detectedVia: 'On Download',         ip: '10.5.65.71',      hash: 'a3f9d12…8bc4e21f' },
  { id: 12, name: 'Adware.InstallCore',     sub: 'Adware · On Scan',                    severity: 'Medium', tenant: 'Yash Personal', endpoint: 'DESKTOP-M5K8HOU',  userName: 'Theron James',   userEmail: 'theron@yashpersonal.com',      userInitials: 'TJ', statusLabel: 'Quarantined',     time: '51 min ago',  detectedVia: 'On Scan',             ip: '192.168.168.171', hash: 'd7e1a3f…2c9b84e1' },
  { id: 13, name: 'PUP.Optional.Bundler',   sub: 'PUP · On Scan',                       severity: 'Low',    tenant: 'QA',            endpoint: 'VTB280-PC2',       userName: 'Charlie Nwosu',  userEmail: 'charlie.n@qa.sonicwall.com',   userInitials: 'CN', statusLabel: 'Quarantined',     time: '1 hr ago',    detectedVia: 'On Scan',             ip: '10.5.65.223',     hash: '9f2b6c4…5d7a103e' },
  { id: 14, name: 'Exploit.CVE-2024-1234',  sub: 'Exploit · In Memory',                 severity: 'High',   tenant: 'Gav-India',     endpoint: 'DESKTOP-CT7UT4D',  userName: 'Bob Martinez',   userEmail: 'bob.martinez@gav-india.com',   userInitials: 'BM', statusLabel: 'Process Killed',  time: '1 hr ago',    detectedVia: 'In Memory',           ip: '192.168.163.128', hash: '3c8d7e2…b14f590a' },
  { id: 15, name: 'Backdoor.Agent.XZ',      sub: 'Backdoor · On Process Behavior',      severity: 'High',   tenant: 'QA',            endpoint: 'LAPTOP-QA-012',    userName: 'Diana Osei',     userEmail: 'diana.osei@qa.sonicwall.com',  userInitials: 'DO', statusLabel: 'Quarantined',     time: '1.5 hrs ago', detectedVia: 'On Process Behavior', ip: '10.5.65.72',      hash: '7a4e9b1…c38d205f' },
  { id: 16, name: 'Spyware.AgentTesla',     sub: 'Spyware · On Download',               severity: 'Medium', tenant: 'Yash Personal', endpoint: 'LAPTOP-YP-003',    userName: 'Evan Park',      userEmail: 'evan.park@yashpersonal.com',   userInitials: 'EP', statusLabel: 'Quarantined',     time: '2 hrs ago',   detectedVia: 'On Download',         ip: '192.168.168.25',  hash: '2f6a8d3…e49c701b' },
  { id: 17, name: 'Worm.Conficker.B',       sub: 'Worm · On Process Behavior',          severity: 'High',   tenant: 'Gav-India',     endpoint: 'DESKTOP-GI-044',   userName: 'Priya Sharma',   userEmail: 'priya.sharma@gav-india.com',   userInitials: 'PS', statusLabel: 'Process Killed',  time: '2 hrs ago',   detectedVia: 'On Process Behavior', ip: '192.168.163.44',  hash: 'b9c3e71…4d80f962' },
  { id: 18, name: 'Trojan.Dropper.Win32',   sub: 'Trojan · On Scan',                    severity: 'Medium', tenant: 'QA',            endpoint: 'VTB280-PC3',       userName: 'System',         userEmail: 'system@qa.sonicwall.com',      userInitials: 'SY', statusLabel: 'Quarantined',     time: '3 hrs ago',   detectedVia: 'On Scan',             ip: '10.5.65.224',     hash: '5e2f9a4…8b1c376d' },
  { id: 19, name: 'Rootkit.Necurs',         sub: 'Rootkit · In Memory',                 severity: 'High',   tenant: 'Gav-India',     endpoint: 'DESKTOP-GI-055',   userName: 'Ravi Kumar',     userEmail: 'ravi.kumar@gav-india.com',     userInitials: 'RK', statusLabel: 'Process Killed',  time: '3 hrs ago',   detectedVia: 'In Memory',           ip: '192.168.163.55',  hash: 'c4d8b2a…7f39e051' },
  { id: 20, name: 'Adware.Crossrider',      sub: 'Adware · On Download',                severity: 'Low',    tenant: 'Yash Personal', endpoint: 'DESKTOP-M5K8HOU',  userName: 'Theron James',   userEmail: 'theron@yashpersonal.com',      userInitials: 'TJ', statusLabel: 'Quarantined',     time: '4 hrs ago',   detectedVia: 'On Download',         ip: '192.168.168.171', hash: '1b7e5d9…a2f4c830' },
  { id: 21, name: 'Ransomware.Lockbit',     sub: 'Ransomware · In Memory',              severity: 'High',   tenant: 'QA',            endpoint: 'LAPTOP-QA-021',    userName: 'Fiona Walsh',    userEmail: 'fiona.walsh@qa.sonicwall.com', userInitials: 'FW', statusLabel: 'Process Killed',  time: '4 hrs ago',   detectedVia: 'In Memory',           ip: '10.5.65.73',      hash: '8d3f1e6…5c29b047' },
  { id: 22, name: 'Miner.XMRig',            sub: 'Cryptominer · On Process Behavior',   severity: 'Medium', tenant: 'Gav-India',     endpoint: 'DESKTOP-GI-066',   userName: 'Suresh Pillai',  userEmail: 'suresh.pillai@gav-india.com',  userInitials: 'SP', statusLabel: 'Process Killed',  time: '5 hrs ago',   detectedVia: 'On Process Behavior', ip: '192.168.163.66',  hash: '6e4a7c2…9b8d1f35' },
];

const SEV_CHIP: Record<string, { bg: string; text: string }> = {
  High:   { bg: '#ffedd5', text: '#f97316' },
  Medium: { bg: '#fef3c7', text: '#d97706' },
  Low:    { bg: '#16a34a1a', text: '#16a34a' },
};

const STATUS_CHIP: Record<string, { bg: string; text: string }> = {
  'Not Quarantined': { bg: '#d977061a', text: '#d97706' },
  'Process Killed':  { bg: '#16a34a1a', text: '#16a34a' },
  'Quarantined':     { bg: '#0066cc1a', text: '#0066cc' },
};

const SEV_DOT: Record<string, string> = { High: '#f97316', Medium: '#d97706', Low: '#16a34a' };
const STATUS_DOT: Record<string, string> = { 'Not Quarantined': '#d97706', 'Process Killed': '#16a34a', 'Quarantined': '#0066cc' };

type SevFilter    = 'all' | 'High' | 'Medium' | 'Low';
type StatusFilter = 'all' | 'Not Quarantined' | 'Process Killed' | 'Quarantined';
type DateRange    = 'last-15' | 'last-7' | 'yesterday';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  'last-15':   'Last 15 days',
  'last-7':    'Last 7 days',
  'yesterday': 'Yesterday',
};

export function EndpointThreatsPage() {
  const navigate = useNavigate();
  const [search, setSearch]           = useState('');
  const [sevFilter, setSevFilter]     = useState<SevFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateRange, setDateRange]     = useState<DateRange>('last-7');
  const [drawer, setDrawer]           = useState<ThreatRow | null>(null);
  const [selected, setSelected]       = useState<Set<number>>(new Set());

  const filtered = useMemo(() => THREATS_DATA.filter(r => {
    if (sevFilter !== 'all'    && r.severity    !== sevFilter)    return false;
    if (statusFilter !== 'all' && r.statusLabel !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!r.name.toLowerCase().includes(q) &&
          !r.endpoint.toLowerCase().includes(q) &&
          !r.userName.toLowerCase().includes(q) &&
          !r.userEmail.toLowerCase().includes(q) &&
          !r.tenant.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [sevFilter, statusFilter, search]);

  const COL_HEADERS = ['Threat Name', 'Severity', 'Endpoint', 'User', 'Status', 'Time'];

  return (
    <div className="space-y-5 pb-10">

      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-[13px] font-medium text-[#0066cc] hover:text-[#0052a6] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <PageHeader
        title="Endpoint Threats"
        subtitle="Threats detected by the endpoint security agent across all managed tenants"
        actions={
          <div style={{ position: 'relative' }}>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as DateRange)}
              style={{ height: '32px', paddingLeft: '12px', paddingRight: '30px', fontSize: '13px', fontWeight: 500, border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', background: '#ffffff', color: '#1a1a1a', cursor: 'pointer', fontFamily: 'inherit', appearance: 'none', outline: 'none' }}
            >
              <option value="last-15">Last 15 days</option>
              <option value="last-7">Last 7 days</option>
              <option value="yesterday">Yesterday</option>
            </select>
            <svg viewBox="0 0 10 6" width="10" height="6" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#717182' }}>
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
        }
      />

      {/* ── Summary cards ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>

        {/* Total Threats */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', padding: '20px 24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#717182', marginBottom: '8px' }}>Total Threats</div>
          <div style={{ fontSize: '36px', fontWeight: 700, lineHeight: 1.1, color: '#1a1a1a' }}>1,802</div>
        </div>

        {/* Severity breakdown — vertical bar histogram */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', padding: '20px 24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#717182', marginBottom: '14px' }}>Severity</div>
          {/* Histogram: High=1112, Medium=160, Low=530. Max=1112 */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '80px' }}>
            {([
              { label: 'High',   value: 1112, display: '1,112', color: '#f97316', bg: '#ffedd5' },
              { label: 'Medium', value: 160,  display: '160',   color: '#d97706', bg: '#fef3c7' },
              { label: 'Low',    value: 530,  display: '530',   color: '#16a34a', bg: '#dcfce7' },
            ] as const).map(({ label, value, display, color, bg }) => {
              const pct = Math.round((value / 1112) * 100);
              return (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color }}>{display}</span>
                  <div style={{ width: '100%', height: '56px', display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', height: `${pct}%`, minHeight: '4px', background: color, borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#717182', fontWeight: 500 }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status breakdown — horizontal bar chart (DS spark-row / stacked-bar pattern) */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', padding: '20px 24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#717182', marginBottom: '14px' }}>Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {([
              { label: 'Not Quarantined', value: 3,  total: 23, color: '#d97706', bg: '#d977061a' },
              { label: 'Process Killed',  value: 14, total: 23, color: '#16a34a', bg: '#16a34a1a' },
              { label: 'Quarantined',     value: 6,  total: 23, color: '#0066cc', bg: '#0066cc1a' },
            ] as const).map(({ label, value, total, color }) => {
              const pct = Math.round((value / total) * 100);
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#717182', minWidth: '120px', flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, height: '8px', borderRadius: '999px', background: '#ececf0', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.3s ease' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color, minWidth: '18px', textAlign: 'right', flexShrink: 0 }}>{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Table card ──────────────────────────────────────────────────────────── */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap px-5 py-3 border-b border-[rgba(0,0,0,0.08)]">

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#717182]" />
            <input
              type="search"
              placeholder="Search threats, endpoints, users…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ height: '32px', paddingLeft: '32px', paddingRight: '12px', width: '240px', fontSize: '13px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', background: '#f8f9fa', color: '#1a1a1a', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#0066cc'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,102,204,0.15)'; }}
              onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Severity filter */}
          <div className="relative">
            <select
              value={sevFilter}
              onChange={e => setSevFilter(e.target.value as SevFilter)}
              style={{ height: '32px', paddingLeft: '10px', paddingRight: '28px', fontSize: '13px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', background: '#ffffff', color: '#1a1a1a', outline: 'none', fontFamily: 'inherit', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="all">Severity</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <svg viewBox="0 0 10 6" width="10" height="6" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#717182' }}>
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              style={{ height: '32px', paddingLeft: '10px', paddingRight: '28px', fontSize: '13px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', background: '#ffffff', color: '#1a1a1a', outline: 'none', fontFamily: 'inherit', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="all">Status</option>
              <option value="Not Quarantined">Not Quarantined</option>
              <option value="Process Killed">Process Killed</option>
              <option value="Quarantined">Quarantined</option>
            </select>
            <svg viewBox="0 0 10 6" width="10" height="6" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#717182' }}>
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>

          {/* Active filter chips */}
          {sevFilter !== 'all' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', height: '24px', padding: '0 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: '#d4183d1a', color: '#d4183d' }}>
              {sevFilter}
              <button onClick={() => setSevFilter('all')} style={{ opacity: 0.7, lineHeight: 1, background: 'none', border: 'none', color: '#d4183d', cursor: 'pointer', padding: 0 }}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', height: '24px', padding: '0 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: '#d4183d1a', color: '#d4183d' }}>
              {statusFilter}
              <button onClick={() => setStatusFilter('all')} style={{ opacity: 0.7, lineHeight: 1, background: 'none', border: 'none', color: '#d4183d', cursor: 'pointer', padding: 0 }}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              style={{ height: '32px', padding: '0 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid rgba(0,0,0,0.1)', background: '#ffffff', color: '#1a1a1a', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Export
            </button>
          </div>
        </div>

        {/* Bulk action banner */}
        {selected.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 20px', background: '#eff6ff', borderBottom: '1px solid rgba(0,102,204,0.2)', fontSize: '13px', fontWeight: 600, color: '#001b50' }}>
            <span>{selected.size} selected</span>
            <button
              onClick={() => setSelected(new Set())}
              style={{ height: '28px', padding: '0 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, background: '#fff', color: '#717182', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#ececf0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                <th style={{ width: '36px', padding: '10px 16px' }}>
                  <input
                    type="checkbox"
                    style={{ width: '14px', height: '14px', accentColor: '#0066cc', cursor: 'pointer' }}
                    checked={filtered.length > 0 && filtered.every(r => selected.has(r.id))}
                    onChange={e => setSelected(e.target.checked ? new Set(filtered.map(r => r.id)) : new Set())}
                  />
                </th>
                {COL_HEADERS.map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#717182', whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {h}<span style={{ opacity: 0.4, marginLeft: '3px', fontSize: '9px' }}>⇅</span>
                  </th>
                ))}
                <th style={{ width: '40px' }} />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '64px 16px', textAlign: 'center', fontSize: '13px', color: '#717182' }}>
                    No threats match the current filters.
                  </td>
                </tr>
              ) : filtered.map((row, i) => {
                const sev    = SEV_CHIP[row.severity];
                const status = STATUS_CHIP[row.statusLabel];
                const isLast = i === filtered.length - 1;
                return (
                  <tr
                    key={row.id}
                    style={{ background: '#ffffff', borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.07)', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fa')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <input
                        type="checkbox"
                        style={{ width: '14px', height: '14px', accentColor: '#0066cc', cursor: 'pointer' }}
                        checked={selected.has(row.id)}
                        onChange={e => {
                          const next = new Set(selected);
                          e.target.checked ? next.add(row.id) : next.delete(row.id);
                          setSelected(next);
                        }}
                      />
                    </td>

                    {/* Threat Name */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <button
                        onClick={() => setDrawer(row)}
                        style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', fontFamily: 'inherit', cursor: 'pointer', background: 'none', border: 'none', padding: 0, textAlign: 'left', display: 'block' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#0066cc'; e.currentTarget.style.textDecoration = 'underline'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#1a1a1a'; e.currentTarget.style.textDecoration = 'none'; }}
                      >
                        {row.name}
                      </button>
                      <div style={{ fontSize: '11px', color: '#717182', marginTop: '2px' }}>{row.sub}</div>
                    </td>

                    {/* Severity chip */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: sev.bg, color: sev.text, whiteSpace: 'nowrap' }}>
                        {row.severity}
                      </span>
                    </td>

                    {/* Endpoint */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: '13px', color: '#1a1a1a', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', whiteSpace: 'nowrap' }}>
                      {row.endpoint}
                    </td>

                    {/* User — avatar + name + email */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0, letterSpacing: '0.02em' }}>
                          {row.userInitials}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap' }}>{row.userName}</div>
                          <div style={{ fontSize: '11px', color: '#717182', marginTop: '1px', whiteSpace: 'nowrap' }}>{row.userEmail}</div>
                        </div>
                      </div>
                    </td>

                    {/* Status chip */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: status.bg, color: status.text, whiteSpace: 'nowrap' }}>
                        {row.statusLabel}
                      </span>
                    </td>

                    {/* Time */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: '13px', color: '#717182', whiteSpace: 'nowrap' }}>
                      {row.time}
                    </td>

                    {/* Overflow menu */}
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <button
                        onClick={() => setDrawer(row)}
                        style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', color: '#717182', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                      >
                        <svg viewBox="0 0 16 16" width="13" height="13"><circle cx="8" cy="3.5" r="1.2" fill="currentColor"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="8" cy="12.5" r="1.2" fill="currentColor"/></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer / pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <span style={{ fontSize: '13px', color: '#717182' }}>Showing 1–{filtered.length} of 1,802 threats</span>
          <div style={{ display: 'flex', gap: '3px' }}>
            {['‹', '1', '2', '3', '…', '181', '›'].map((p, i) => (
              <button
                key={i}
                style={{
                  minWidth: '28px', height: '28px', padding: '0 6px',
                  borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit',
                  background: p === '1' ? '#001b50' : '#ffffff',
                  border:     p === '1' ? '1px solid #001b50' : '1px solid rgba(0,0,0,0.1)',
                  color:      p === '1' ? '#ffffff' : '#717182',
                  fontWeight: p === '1' ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Detail Drawer ───────────────────────────────────────────────────────── */}
      {drawer && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200 }}
            onClick={() => setDrawer(null)}
          />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px', background: '#ffffff', borderLeft: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 12px 32px rgba(0,0,0,0.12)', zIndex: 201, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#001b50', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', wordBreak: 'break-all' }}>{drawer.name}</div>
                <div style={{ fontSize: '11px', color: '#717182', marginTop: '3px' }}>{drawer.sub}</div>
              </div>
              <button
                onClick={() => setDrawer(null)}
                style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', background: 'none', border: 'none', color: '#717182', cursor: 'pointer', flexShrink: 0 }}
              >
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', padding: '0 20px', borderBottom: '2px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
              {['Overview', 'Timeline', 'Related'].map((t, i) => (
                <div
                  key={t}
                  style={{
                    padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    color:        i === 0 ? '#ff5d00' : '#717182',
                    borderBottom: i === 0 ? '2px solid #ff5d00' : '2px solid transparent',
                    marginBottom: '-2px',
                  }}
                >
                  {t}
                </div>
              ))}
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

              {/* Threat details KV */}
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#717182', marginBottom: '8px' }}>Threat Details</div>
              <div style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                {([
                  ['Severity', (
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em', background: SEV_CHIP[drawer.severity].bg, color: SEV_CHIP[drawer.severity].text }}>{drawer.severity}</span>
                  )],
                  ['Status', (
                    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: STATUS_CHIP[drawer.statusLabel].bg, color: STATUS_CHIP[drawer.statusLabel].text }}>
                      {drawer.statusLabel}
                    </span>
                  )],
                  ['Detected via', drawer.detectedVia],
                  ['Time',         drawer.time],
                ] as [string, React.ReactNode][]).map(([k, v], i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', borderBottom: i < 3 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                    <div style={{ padding: '9px 12px', background: '#f8f9fa', fontSize: '12px', color: '#717182', borderRight: '1px solid rgba(0,0,0,0.06)' }}>{k}</div>
                    <div style={{ padding: '9px 12px', fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Endpoint KV */}
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#717182', marginBottom: '8px' }}>Endpoint</div>
              <div style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                {([
                  ['Tenant',   drawer.tenant],
                  ['Endpoint', <span style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: '12px' }}>{drawer.endpoint}</span>],
                  ['User',     drawer.userName],
                  ['Email',    <span style={{ fontSize: '12px' }}>{drawer.userEmail}</span>],
                  ['IP',       <span style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: '12px' }}>{drawer.ip}</span>],
                ] as [string, React.ReactNode][]).map(([k, v], i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', borderBottom: i < 4 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                    <div style={{ padding: '9px 12px', background: '#f8f9fa', fontSize: '12px', color: '#717182', borderRight: '1px solid rgba(0,0,0,0.06)' }}>{k}</div>
                    <div style={{ padding: '9px 12px', fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Hash */}
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#717182', marginBottom: '8px' }}>File Hash</div>
              <div style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', padding: '10px 12px', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: '12px', color: '#717182', wordBreak: 'break-all' }}>
                {drawer.hash}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
