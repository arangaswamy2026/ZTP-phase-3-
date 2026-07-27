import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Search, MoreVertical, Monitor, Shield, Wifi, AlertTriangle, X, Info } from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';

const AVATAR_COLOR = 'bg-[#6b7fa8]';

const HONORIFICS = new Set(['dr', 'mr', 'mrs', 'ms', 'prof']);

function usernameInitials(user: string): string {
  if (!user || user === 'N/A') return '?';
  let parts = user.split(/[._\-\s]/).filter(Boolean);
  if (parts.length > 1 && HONORIFICS.has(parts[0].toLowerCase())) parts = parts.slice(1);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScanInfo {
  status: 'complete' | 'in-progress' | 'aborted';
  timestamp?: string;
  progress?: number;
}

interface Endpoint {
  name: string;
  hw: string;
  tid: string;
  tenantName: string;
  user: string;
  userName: string;
  userEmail: string;
  os: string;
  osBuild: string;
  agent: string;
  agentOld: boolean;
  eppVer: string;
  eppOld: boolean;
  icVer: string;
  icOld: boolean;
  health: 'active-threat' | 'at-risk' | 'isolated' | 'healthy' | 'disconnected';
  tunnel: 'connected' | 'degraded' | 'suspended' | 'off';
  trust: 'low' | 'high';
  mods: { ztn: string; sia: string; eps: string };
  lastSeen: string;
  ip: string;
  scan: ScanInfo;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const ENDPOINTS: Endpoint[] = [
  { name: 'GAV-LAPTOP-03',   hw: 'Dell Latitude 5540',       tid: 'acme',       tenantName: 'Acme Corporation',      user: 'priya.k',     userName: 'Priya Kapoor',    userEmail: 'priya.k@acmecorp.com',       os: 'Windows 11 Enterprise', osBuild: '10.0.22631', agent: '4.0.8', agentOld: true,  eppVer: '3.6.2', eppOld: true,  icVer: '2.1.4', icOld: false, health: 'active-threat', tunnel: 'degraded',   trust: 'low',   mods: { ztn: 'on', sia: 'on',  eps: 'threat' }, lastSeen: 'Jul 10, 2026 · 2:55 PM',  ip: '192.168.163.45',  scan: { status: 'aborted',     timestamp: 'Jul 9, 2026 · 11:42 AM' } },
  { name: 'GAV-WSTN-07',     hw: 'HP Z4 Workstation G4',     tid: 'acme',       tenantName: 'Acme Corporation',      user: 'arjun.m',     userName: 'Arjun Mehta',     userEmail: 'arjun.m@acmecorp.com',       os: 'Windows 10 Enterprise', osBuild: '10.0.19045', agent: '4.0.8', agentOld: true,  eppVer: '3.6.2', eppOld: true,  icVer: '2.1.4', icOld: false, health: 'active-threat', tunnel: 'connected',  trust: 'low',  mods: { ztn: 'on', sia: 'off', eps: 'threat' }, lastSeen: 'Jul 10, 2026 · 2:48 PM',  ip: '192.168.163.91',  scan: { status: 'in-progress', progress: 62 } },
  { name: 'GAV-SERVER-01',   hw: 'VMware Virtual Machine',   tid: 'acme',       tenantName: 'Acme Corporation',      user: 'svc-account', userName: 'Service Account', userEmail: 'svc-account@acmecorp.com',   os: 'Windows Server 2022',   osBuild: '10.0.20348', agent: '3.9.1', agentOld: true,  eppVer: '3.5.0', eppOld: true,  icVer: '2.0.9', icOld: true,  health: 'active-threat', tunnel: 'degraded',   trust: 'low',   mods: { ztn: 'on', sia: 'on',  eps: 'threat' }, lastSeen: 'Jul 10, 2026 · 2:52 PM',  ip: '192.168.163.10',  scan: { status: 'complete',    timestamp: 'Jul 10, 2026 · 9:05 AM' } },
  { name: 'DESKTOP-CT7UT4D', hw: 'Dell OptiPlex 7090',       tid: 'acme',       tenantName: 'Acme Corporation',      user: 'bob',         userName: 'Bob Sinclair',    userEmail: 'bob@acmecorp.com',           os: 'Windows 11 Pro',        osBuild: '10.0.22631', agent: '4.1.2', agentOld: false, eppVer: '3.7.1', eppOld: false, icVer: '2.1.4', icOld: false, health: 'isolated',      tunnel: 'suspended',  trust: 'low',  mods: { ztn: 'on', sia: 'on',  eps: 'on' },    lastSeen: 'Jul 10, 2026 · 3:00 PM',  ip: '192.168.163.128', scan: { status: 'in-progress', progress: 15 } },
  { name: 'VTB280-PC1',      hw: 'Lenovo ThinkCentre M70q',  tid: 'enterprise', tenantName: 'Enterprise Solutions',  user: 'N/A',         userName: 'N/A',             userEmail: '',                           os: 'Windows 11 Pro',        osBuild: '10.0.22631', agent: '4.1.2', agentOld: false, eppVer: '3.7.1', eppOld: false, icVer: '2.1.4', icOld: false, health: 'at-risk',       tunnel: 'connected',  trust: 'low',  mods: { ztn: 'on', sia: 'on',  eps: 'off' },   lastSeen: 'Jul 10, 2026 · 2:00 PM',  ip: '10.5.65.222',     scan: { status: 'complete',    timestamp: 'Jul 10, 2026 · 8:30 AM' } },
  { name: 'QA-DESK-12',      hw: 'Apple Mac mini M2',        tid: 'enterprise', tenantName: 'Enterprise Solutions',  user: 'james.t',     userName: 'James Turner',    userEmail: 'james.t@enterprise.com',     os: 'macOS 14.4',            osBuild: '23.4.0',     agent: '4.1.2', agentOld: false, eppVer: '3.7.1', eppOld: false, icVer: '2.1.3', icOld: true,  health: 'at-risk',       tunnel: 'connected',  trust: 'low',  mods: { ztn: 'on', sia: 'on',  eps: 'off' },   lastSeen: 'Jul 10, 2026 · 2:26 PM',  ip: '10.5.65.45',      scan: { status: 'aborted',     timestamp: 'Jul 9, 2026 · 3:17 PM' } },
  { name: 'YP-LAPTOP-02',    hw: 'ASUS VivoBook 15',         tid: 'global',     tenantName: 'Global Services LLC',   user: 'yash.p',      userName: 'Yash Patel',      userEmail: 'yash.p@globalservices.com',  os: 'Windows 11 Home',       osBuild: '10.0.22631', agent: '4.1.2', agentOld: false, eppVer: '3.6.8', eppOld: true,  icVer: '2.1.4', icOld: false, health: 'at-risk',       tunnel: 'off',        trust: 'low',        mods: { ztn: 'on', sia: 'on',  eps: 'off' },   lastSeen: 'Jul 7, 2026 · 3:00 PM',   ip: '192.168.168.55',  scan: { status: 'in-progress', progress: 88 } },
  { name: 'DESKTOP-M5K8HOU', hw: 'Custom Workstation',       tid: 'global',     tenantName: 'Global Services LLC',   user: 'Theron',      userName: 'Theron Blake',    userEmail: 'theron@globalservices.com',  os: 'Windows 11 Pro',        osBuild: '10.0.22631', agent: '4.1.2', agentOld: false, eppVer: '3.7.1', eppOld: false, icVer: '2.1.4', icOld: false, health: 'healthy',       tunnel: 'connected',  trust: 'high',  mods: { ztn: 'on', sia: 'on',  eps: 'on' },    lastSeen: 'Jul 10, 2026 · 2:30 PM',  ip: '192.168.168.171', scan: { status: 'complete',    timestamp: 'Jul 10, 2026 · 10:14 AM' } },
  { name: 'DENTAL-PC-01',    hw: 'Dell OptiPlex 5000',       tid: 'riverside',  tenantName: 'Riverside Dental',      user: 'maria',       userName: 'Dr. Maria Henderson', userEmail: 'maria@riversidedental.com', os: 'Windows 11 Pro',        osBuild: '10.0.22631', agent: '4.1.2', agentOld: false, eppVer: '3.7.1', eppOld: false, icVer: '2.1.4', icOld: false, health: 'healthy',       tunnel: 'connected',  trust: 'high',  mods: { ztn: 'on', sia: 'on',  eps: 'on' },    lastSeen: 'Jul 10, 2026 · 2:18 PM',  ip: '10.0.0.21',       scan: { status: 'complete',    timestamp: 'Jul 10, 2026 · 7:52 AM' } },
  { name: 'DENTAL-LAPTOP-03',hw: 'HP EliteBook 840',         tid: 'riverside',  tenantName: 'Riverside Dental',      user: 'dr.chen',     userName: 'Dr. Chen Park',    userEmail: 'dr.chen@riversidedental.com', os: 'Windows 11 Pro',        osBuild: '10.0.22631', agent: '4.1.2', agentOld: false, eppVer: '3.7.1', eppOld: false, icVer: '2.1.4', icOld: false, health: 'healthy',       tunnel: 'connected',  trust: 'high',  mods: { ztn: 'on', sia: 'on',  eps: 'on' },    lastSeen: 'Jul 10, 2026 · 2:00 PM',  ip: '10.0.0.35',       scan: { status: 'aborted',     timestamp: 'Jul 8, 2026 · 2:00 PM' } },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

// Mock timestamps are formatted "Jul 10, 2026 · 2:55 PM" — parse that back into a Date.
function formatRelativeTime(timestamp: string): string {
  const parsed = new Date(timestamp.replace(' · ', ' '));
  if (isNaN(parsed.getTime())) return timestamp;

  const diffSec = Math.round((Date.now() - parsed.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;

  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek} week${diffWeek !== 1 ? 's' : ''} ago`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;

  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear} year${diffYear !== 1 ? 's' : ''} ago`;
}

function osIcon(os: string) {
  if (os.toLowerCase().includes('macos') || os.toLowerCase().includes('mac')) {
    return (
      <svg className="w-[13px] h-[13px] flex-shrink-0 text-[#555]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    );
  }
  return (
    <svg className="w-[13px] h-[13px] flex-shrink-0 text-[#0078D4]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
    </svg>
  );
}

function HealthBadge({ health }: { health: Endpoint['health'] }) {
  const cfg = {
    'active-threat': { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Active Threats' },
    'at-risk':       { bg: '#fef3c7', color: '#b45309', dot: '#f59e0b', label: 'At Risk' },
    'isolated':      { bg: '#f3f4f6', color: '#374151', dot: '#6b7280', label: 'Isolated' },
    'healthy':       { bg: '#dcfce7', color: '#15803d', dot: '#22c55e', label: 'Healthy' },
    'disconnected':  { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af', label: 'Disconnected' },
  }[health];
  return (
    <span className="inline-flex items-center gap-[5px] text-[11px] font-semibold px-[8px] py-[2px] rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function TunnelBadge({ tunnel }: { tunnel: Endpoint['tunnel'] }) {
  const cfg = {
    connected:  { color: '#15803d', dot: '#22c55e', label: 'Connected' },
    degraded:   { color: '#b45309', dot: '#f59e0b', label: 'Degraded' },
    suspended:  { color: '#991b1b', dot: '#ef4444', label: 'Suspended' },
    off:        { color: '#9ca3af', dot: '#d1d5db', label: 'Disconnected' },
  }[tunnel];
  return (
    <span className="inline-flex items-center gap-[5px] text-[12px]" style={{ color: cfg.color }}>
      <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function TrustBadge({ trust }: { trust: Endpoint['trust'] }) {
  const isLow = trust === 'low';
  return (
    <span className="inline-flex items-center gap-[5px] text-[13px] font-medium" style={{ color: isLow ? '#991b1b' : '#374151' }}>
      {isLow && <AlertTriangle className="w-[13px] h-[13px] text-[#dc2626] flex-shrink-0" />}
      {isLow ? 'Low' : 'High'}
    </span>
  );
}

function VersionBadge({ ver }: { ver: string; old: boolean }) {
  return <span style={{ fontSize: 13, color: '#374151' }}>{ver}</span>;
}

// ── Endpoint Detail Modal ─────────────────────────────────────────────────────

function EndpointDetailModal({ ep, onClose }: { ep: Endpoint; onClose: () => void }) {
  const isIsolated = ep.health === 'isolated';
  const isHealthy  = ep.health === 'healthy';

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 bg-white rounded-[16px] shadow-[0_12px_32px_rgba(0,0,0,0.12)] border border-[rgba(0,0,0,0.08)] w-[720px] max-h-[90vh] flex flex-col text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 shrink-0 border-b border-[rgba(0,0,0,0.08)]">
          <div>
            <h2 className="text-[18px] font-semibold text-[#1a1a1a] leading-tight">{ep.name}</h2>
            <p className="text-[13px] text-[#717182] mt-0.5">{ep.hw}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#ececf0] text-[#717182] shrink-0 ml-4 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body — sections stacked, fields in a 2-column grid */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-8">
          <div>
            <DetailSectionLabel>Identity</DetailSectionLabel>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DetailField label="Tenant">{ep.tenantName}</DetailField>
              <DetailField label="Logged-in user">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarFallback className={`text-[10px] font-semibold text-white ${AVATAR_COLOR}`}>
                      {usernameInitials(ep.user)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{ep.user}</span>
                </div>
              </DetailField>
              <DetailField label="Domain / Auth">Active Directory</DetailField>
            </div>
          </div>

          <div>
            <DetailSectionLabel>System</DetailSectionLabel>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DetailField label="Hardware">{ep.hw}</DetailField>
              <DetailField label="OS">{ep.os}</DetailField>
              <DetailField label="OS build">{ep.osBuild}</DetailField>
            </div>
          </div>

          <div>
            <DetailSectionLabel>Connectivity</DetailSectionLabel>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DetailField label="Tunnel"><TunnelBadge tunnel={ep.tunnel} /></DetailField>
              <DetailField label="Location"><span>United States</span></DetailField>
              <DetailField label="Local IP">{ep.ip}</DetailField>
              <DetailField label="MAC">F0:18:98:AA:BB:CC</DetailField>
            </div>
          </div>

          <div>
            <DetailSectionLabel>App Versions</DetailSectionLabel>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <DetailField label="Unified Client"><VersionBadge ver={ep.agent} old={ep.agentOld} /></DetailField>
              <DetailField label="CSE"><VersionBadge ver={ep.eppVer} old={ep.eppOld} /></DetailField>
              <DetailField label="Theron"><VersionBadge ver={ep.icVer} old={ep.icOld} /></DetailField>
            </div>
          </div>
        </div>

        {/* Footer — action buttons */}
        <div className="shrink-0 px-6 py-4 border-t border-[rgba(0,0,0,0.08)] flex flex-row justify-end gap-[8px]">
          {!isHealthy && (
            <button
              className="h-[36px] px-5 rounded-[8px] text-[13px] font-semibold transition-colors border"
              style={{
                color: isIsolated ? '#15803d' : '#1a1a1a',
                background: isIsolated ? '#f0fdf4' : '#fff',
                borderColor: isIsolated ? '#bbf7d0' : 'rgba(0,0,0,0.1)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = isIsolated ? '#dcfce7' : '#ececf0')}
              onMouseLeave={e => (e.currentTarget.style.background = isIsolated ? '#f0fdf4' : '#fff')}
            >
              {isIsolated ? 'Lift Isolation' : 'Isolate Endpoint'}
            </button>
          )}
          {ep.agentOld && (
            <button
              className="h-[36px] px-5 rounded-[8px] text-[13px] font-semibold text-white transition-colors"
              style={{ background: '#0066cc' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0052a6')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0066cc')}
            >
              Push Agent Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#717182] mb-2">
        {children}
      </p>
      <div className="h-px bg-[#e5e7eb]" />
    </div>
  );
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#717182] mb-1.5">{label}</p>
      <div className="text-[13px] text-[#1a1a1a]">{children}</div>
    </div>
  );
}

// ── Uninstall Modal ───────────────────────────────────────────────────────────

function UninstallModal({ ep, onClose }: { ep: Endpoint; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<{ uc: boolean; epp: boolean; ic: boolean }>({ uc: false, epp: false, ic: false });
  const [confirmText, setConfirmText] = useState('');
  const [progress, setProgress] = useState<'queued' | 'running' | 'done'>('queued');

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  // When UC selected, disable EPP+IC. When UC deselected, re-enable them.
  function toggleUC() {
    setSelected(s => ({ uc: !s.uc, epp: false, ic: false }));
  }
  function toggleEPP() {
    if (selected.uc) return;
    setSelected(s => ({ ...s, epp: !s.epp }));
  }
  function toggleIC() {
    if (selected.uc) return;
    setSelected(s => ({ ...s, ic: !s.ic }));
  }

  const anySelected = selected.uc || selected.epp || selected.ic;
  const canProceed = anySelected;
  const canConfirm = confirmText === 'UNINSTALL';

  // What will be removed
  const willRemoveUC  = selected.uc;
  const willRemoveEPP = selected.uc || selected.epp;
  const willRemoveIC  = selected.uc || selected.ic;

  function startUninstall() {
    setStep(3);
    setProgress('running');
    setTimeout(() => setProgress('done'), 2200);
  }

  // Step label for stepper
  function StepperDot({ n, label, state }: { n: number; label: string; state: 'active' | 'done' | 'idle' }) {
    const bg   = state === 'done' ? '#16a34a' : state === 'active' ? '#FF5D00' : '#e5e7eb';
    const text = state === 'idle' ? '#9ca3af' : state === 'done' ? '#16a34a' : '#FF5D00';
    return (
      <div className="flex items-center gap-[6px]">
        <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
          {state === 'done'
            ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <span style={{ fontSize: 11, fontWeight: 700, color: state === 'idle' ? '#9ca3af' : 'white' }}>{n}</span>
          }
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: text }}>{label}</span>
      </div>
    );
  }

  function StepperLine({ done }: { done: boolean }) {
    return <div className="flex-1 h-[2px] mx-[6px]" style={{ background: done ? '#16a34a' : '#e5e7eb' }} />;
  }

  const step1State = step === 1 ? 'active' : 'done';
  const step2State = step === 2 ? 'active' : step === 3 ? 'done' : 'idle';
  const step3State = step === 3 ? (progress === 'done' ? 'done' : 'active') : 'idle';

  const removingLabel = [
    willRemoveUC && 'Unified Client',
    willRemoveEPP && !willRemoveUC && 'EPP Client',
    willRemoveIC  && !willRemoveUC && 'Internet Client',
    willRemoveUC  && 'EPP Client',
    willRemoveUC  && 'Internet Client',
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative z-10 bg-white rounded-[8px] shadow-[0_8px_40px_rgba(0,0,0,0.20)] w-[580px] max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] shrink-0">
          <div className="flex items-center gap-[12px]">
            <div className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: '#fee2e2' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4183d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#1a1a1a] leading-tight">
                {step === 3 ? (progress === 'done' ? 'Uninstall Complete' : 'Uninstalling…') : step === 2 ? 'Confirm Uninstall' : 'Select Clients to Uninstall'}
              </h2>
              <p className="text-[12px] text-[#717182] mt-[1px]">
                {step === 3 ? `Removing: ${removingLabel}` : step === 2 ? 'This action cannot be undone — review carefully' : 'Choose which agent components to remove'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#ececf0] text-[#717182] shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center px-6 py-[14px] border-b border-[#e5e7eb] shrink-0">
          <StepperDot n={1} label="Select Clients" state={step1State} />
          <StepperLine done={step >= 2} />
          <StepperDot n={2} label="Confirm" state={step2State} />
          <StepperLine done={step === 3 && progress === 'done'} />
          <StepperDot n={3} label="Progress" state={step3State} />
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-[16px]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#717182] mb-[4px]">Agent Components</p>
              <p className="text-[12px] text-[#717182]">EPP Client and Internet Client can be removed independently. Uninstalling the Unified Client removes all three components from the endpoint.</p>
            </div>

            {/* Unified Client card */}
            <div
              className="rounded-[10px] border-[1.5px] cursor-pointer transition-all"
              style={{ borderColor: selected.uc ? '#d4183d' : '#e5e7eb', background: selected.uc ? '#fff5f6' : '#fff' }}
              onClick={toggleUC}
            >
              <div className="px-[16px] pt-[14px] pb-[10px]">
                <div className="flex items-center gap-[8px]">
                  <div className="flex items-center gap-[8px]">
                    <input type="checkbox" checked={selected.uc} onChange={toggleUC} onClick={e => e.stopPropagation()}
                      className="w-[15px] h-[15px] flex-shrink-0 cursor-pointer" style={{ accentColor: '#d4183d' }} />
                    <Monitor className="w-[15px] h-[15px] text-[#374151] flex-shrink-0" />
                    <span className="text-[14px] font-semibold text-[#1a1a1a]">Unified Client</span>
                    <span className="text-[10px] font-bold px-[6px] py-[2px] rounded-[4px]" style={{ background: '#fff0eb', color: '#FF5D00' }}>Root Agent</span>
                  </div>
                  <span className="text-[12px] text-[#717182]">1 endpoint</span>
                </div>
                <p className="text-[12px] text-[#717182] mt-[6px] ml-[46px]">Core Zero Trust connectivity agent. Manages VPN tunnel, device identity, and module orchestration.</p>
                <div className="flex items-center gap-[8px] mt-[8px] ml-[46px]">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">Installed Version</span>
                  <span className="text-[11px] font-bold px-[6px] py-[1px] rounded-[4px]" style={{ background: ep.agentOld ? '#fee2e2' : '#dcfce7', color: ep.agentOld ? '#991b1b' : '#15803d' }}>{ep.agent}</span>
                  {ep.agentOld && <span className="text-[11px] text-[#0066cc]">· update available</span>}
                </div>
                {selected.uc && (
                  <div className="mt-[10px] ml-[46px] rounded-[7px] px-[12px] py-[8px] flex items-start gap-[8px]" style={{ background: '#fff0eb', border: '1px solid #ffd0b8' }}>
                    <AlertTriangle className="w-[13px] h-[13px] text-[#FF5D00] flex-shrink-0 mt-[1px]" />
                    <p className="text-[12px] font-semibold text-[#FF5D00]">Selecting Unified Client will automatically remove EPP Client and Internet Client from all targeted endpoints.</p>
                  </div>
                )}
              </div>
            </div>

            {/* EPP Client card */}
            <div
              className="rounded-[10px] border-[1.5px] transition-all"
              style={{ borderColor: selected.epp ? '#d4183d' : '#e5e7eb', background: selected.epp ? '#fff5f6' : selected.uc ? '#fafafa' : '#fff', cursor: selected.uc ? 'not-allowed' : 'pointer', opacity: selected.uc ? 0.6 : 1 }}
              onClick={toggleEPP}
            >
              <div className="px-[16px] pt-[14px] pb-[10px]">
                <div className="flex items-center gap-[8px]">
                  <div className="flex items-center gap-[8px]">
                    <input type="checkbox" checked={selected.epp} onChange={toggleEPP} onClick={e => e.stopPropagation()}
                      disabled={selected.uc} className="w-[15px] h-[15px] flex-shrink-0 cursor-pointer" style={{ accentColor: '#d4183d' }} />
                    <Shield className="w-[15px] h-[15px] text-[#374151] flex-shrink-0" />
                    <span className="text-[14px] font-semibold text-[#1a1a1a]">EPP Client</span>
                    {selected.uc
                      ? <span className="text-[10px] font-bold px-[6px] py-[2px] rounded-[4px]" style={{ background: '#f3f4f6', color: '#6b7280' }}>Auto-removed</span>
                      : <span className="text-[10px] font-bold px-[6px] py-[2px] rounded-[4px]" style={{ background: '#f0f4ff', color: '#4b6bfb' }}>Optional</span>
                    }
                  </div>
                  <span className="text-[12px] text-[#717182]">1 endpoint</span>
                </div>
                <p className="text-[12px] text-[#717182] mt-[6px] ml-[46px]">Endpoint Protection Platform client. Handles malware detection, threat quarantine, and on-scan capabilities.</p>
                <div className="flex items-center gap-[8px] mt-[8px] ml-[46px]">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">Installed Version</span>
                  <span className="text-[11px] font-bold px-[6px] py-[1px] rounded-[4px]" style={{ background: ep.eppOld ? '#fee2e2' : '#dcfce7', color: ep.eppOld ? '#991b1b' : '#15803d' }}>{ep.eppVer}</span>
                  {ep.eppOld && <span className="text-[11px] text-[#0066cc]">· update available</span>}
                </div>
              </div>
            </div>

            {/* Internet Client card */}
            <div
              className="rounded-[10px] border-[1.5px] transition-all"
              style={{ borderColor: selected.ic ? '#d4183d' : '#e5e7eb', background: selected.ic ? '#fff5f6' : selected.uc ? '#fafafa' : '#fff', cursor: selected.uc ? 'not-allowed' : 'pointer', opacity: selected.uc ? 0.6 : 1 }}
              onClick={toggleIC}
            >
              <div className="px-[16px] pt-[14px] pb-[10px]">
                <div className="flex items-center gap-[8px]">
                  <div className="flex items-center gap-[8px]">
                    <input type="checkbox" checked={selected.ic} onChange={toggleIC} onClick={e => e.stopPropagation()}
                      disabled={selected.uc} className="w-[15px] h-[15px] flex-shrink-0 cursor-pointer" style={{ accentColor: '#d4183d' }} />
                    <Wifi className="w-[15px] h-[15px] text-[#374151] flex-shrink-0" />
                    <span className="text-[14px] font-semibold text-[#1a1a1a]">Internet Client</span>
                    {selected.uc
                      ? <span className="text-[10px] font-bold px-[6px] py-[2px] rounded-[4px]" style={{ background: '#f3f4f6', color: '#6b7280' }}>Auto-removed</span>
                      : <span className="text-[10px] font-bold px-[6px] py-[2px] rounded-[4px]" style={{ background: '#f0f4ff', color: '#4b6bfb' }}>Optional</span>
                    }
                  </div>
                  <span className="text-[12px] text-[#717182]">1 endpoint</span>
                </div>
                <p className="text-[12px] text-[#717182] mt-[6px] ml-[46px]">Secure Internet Access client. Enforces web policy, DNS filtering, and proxy routing for internet-bound traffic.</p>
                <div className="flex items-center gap-[8px] mt-[8px] ml-[46px]">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">Installed Version</span>
                  <span className="text-[11px] font-bold px-[6px] py-[1px] rounded-[4px]" style={{ background: ep.icOld ? '#fee2e2' : '#dcfce7', color: ep.icOld ? '#991b1b' : '#15803d' }}>{ep.icVer}</span>
                  {ep.icOld && <span className="text-[11px] text-[#0066cc]">· update available</span>}
                </div>
              </div>
            </div>

            {/* Targeted endpoints */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#717182] mb-[8px]">Targeted Endpoints (1)</p>
              <div className="rounded-[8px] border border-[#e5e7eb] px-[14px] py-[10px]">
                <div className="flex items-center gap-[8px]">
                  {osIcon(ep.os)}
                  <span className="text-[13px] font-semibold text-[#1a1a1a]">{ep.name}</span>
                  <span className="text-[12px] text-[#717182]">{ep.tenantName}</span>
                </div>
                <div className="flex items-center gap-[6px] mt-[6px] ml-[21px]">
                  <span className="text-[10px] font-bold px-[5px] py-[2px] rounded-[4px]" style={{ background: '#e0eeff', color: '#0052a6' }}>UC {ep.agent}</span>
                  <span className="text-[10px] font-bold px-[5px] py-[2px] rounded-[4px]" style={{ background: '#e0eeff', color: '#0052a6' }}>EPP {ep.eppVer}</span>
                  <span className="text-[10px] font-bold px-[5px] py-[2px] rounded-[4px]" style={{ background: '#e0eeff', color: '#0052a6' }}>IC {ep.icVer}</span>
                  <HealthBadge health={ep.health} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-[16px]">
            {/* Warning banner */}
            <div className="rounded-[8px] px-[14px] py-[12px] flex items-start gap-[10px]" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <AlertTriangle className="w-[15px] h-[15px] text-[#d97706] flex-shrink-0 mt-[1px]" />
              <p className="text-[12px] text-[#92400e]"><span className="font-bold">Destructive operation.</span> Uninstalled agents will stop enforcing Zero Trust policy, threat detection, and secure internet routing immediately. Removing the Unified Client will also remove all dependent modules from each endpoint.</p>
            </div>

            {/* What will be removed */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#717182] mb-[8px]">What Will Be Removed</p>
              <div className="rounded-[8px] border border-[#e5e7eb] overflow-hidden">
                {[
                  { label: 'Unified Client',   removed: willRemoveUC,  cascade: false },
                  { label: 'EPP Client',        removed: willRemoveEPP, cascade: willRemoveUC && willRemoveEPP },
                  { label: 'Internet Client',   removed: willRemoveIC,  cascade: willRemoveUC && willRemoveIC },
                  { label: 'Endpoints affected', removed: true,          cascade: false, value: '1' },
                ].map(({ label, removed, cascade, value }, i, arr) => (
                  <div key={label} className="flex items-center gap-[16px] px-[14px] py-[10px]"
                    style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <span className="text-[13px] text-[#374151]">{label}</span>
                    {value
                      ? <span className="text-[13px] font-semibold text-[#374151]">{value}</span>
                      : removed
                        ? <span className="text-[12px] font-semibold" style={{ color: '#d4183d' }}>
                            {cascade ? 'Will be removed (cascade)' : 'Will be removed'}
                          </span>
                        : <span className="text-[12px] text-[#9ca3af]">Not affected</span>
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* Affected endpoints */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#717182] mb-[8px]">Affected Endpoints</p>
              <div className="rounded-[8px] border border-[#e5e7eb] px-[14px] py-[10px]">
                <div className="flex items-center gap-[8px]">
                  {osIcon(ep.os)}
                  <span className="text-[13px] font-semibold text-[#1a1a1a]">{ep.name}</span>
                  <span className="text-[12px] text-[#717182]">{ep.tenantName}</span>
                </div>
                <div className="mt-[6px] ml-[21px]">
                  <HealthBadge health={ep.health} />
                </div>
              </div>
            </div>

            {/* Confirm input */}
            <div className="rounded-[8px] px-[14px] py-[12px]" style={{ background: '#fff5f6', border: '1px solid #fcd0d5' }}>
              <p className="text-[12px] text-[#374151] mb-[8px]">Type <span className="font-bold">UNINSTALL</span> to confirm this action</p>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="UNINSTALL"
                autoFocus
                className="w-full rounded-[6px] px-[12px] text-[13px] font-mono outline-none transition-colors"
                style={{ height: 36, border: `1.5px solid ${confirmText === 'UNINSTALL' ? '#16a34a' : 'rgba(0,0,0,0.15)'}`, background: '#fff', color: '#1a1a1a' }}
              />
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-[16px]">
            <div>
              <div className="flex items-center justify-between mb-[8px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#717182]">Uninstall Progress</p>
                <p className="text-[11px] text-[#717182]">{progress === 'done' ? '1 of 1 complete' : '0 of 1 complete'}</p>
              </div>
              <div className="rounded-[8px] border border-[#e5e7eb] px-[14px] py-[12px]">
                <div className="flex items-center gap-[10px] mb-[10px]">
                  {osIcon(ep.os)}
                  <div>
                    <p className="text-[13px] font-semibold text-[#1a1a1a]">{ep.name}</p>
                    <p className="text-[11px] text-[#717182]">{ep.tenantName}</p>
                  </div>
                  <span className="text-[10px] font-bold px-[6px] py-[1px] rounded-[4px]"
                    style={{
                      background: progress === 'done' ? '#dcfce7' : '#f3f4f6',
                      color: progress === 'done' ? '#15803d' : '#6b7280',
                    }}>
                    {progress === 'done' ? 'Complete' : 'Queued'}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-[4px] rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
                  <div
                    className="h-full rounded-full transition-all duration-[2000ms] ease-out"
                    style={{ width: progress === 'done' ? '100%' : progress === 'running' ? '75%' : '0%', background: progress === 'done' ? '#16a34a' : '#0066cc' }}
                  />
                </div>
              </div>
            </div>
            {progress === 'done' && (
              <div className="flex items-center gap-[6px]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-[13px] font-semibold text-[#15803d]">Uninstall complete — 1 endpoint cleaned</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-[#e5e7eb] flex items-center justify-between gap-[10px]">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="text-[13px] font-medium text-[#0066cc] hover:underline">
              ← Back
            </button>
          )}
          {step !== 2 && <div />}

          <div className="flex items-center gap-[10px]">
            {step !== 3 && (
              <button onClick={onClose} className="h-[36px] px-[18px] rounded-[8px] text-[13px] font-semibold text-[#374151] bg-white border border-[#e5e7eb] hover:bg-[#f8f9fa] transition-colors">
                Cancel
              </button>
            )}
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={!canProceed}
                className="h-[36px] px-[18px] rounded-[8px] text-[13px] font-semibold text-white transition-colors"
                style={{ background: canProceed ? '#FF5D00' : '#e5e7eb', color: canProceed ? 'white' : '#9ca3af', cursor: canProceed ? 'pointer' : 'not-allowed' }}
              >
                Review →
              </button>
            )}
            {step === 2 && (
              <button
                onClick={startUninstall}
                disabled={!canConfirm}
                className="h-[36px] px-[18px] rounded-[8px] text-[13px] font-semibold text-white transition-colors"
                style={{ background: canConfirm ? '#d4183d' : '#e5e7eb', color: canConfirm ? 'white' : '#9ca3af', cursor: canConfirm ? 'pointer' : 'not-allowed' }}
              >
                Uninstall Now
              </button>
            )}
            {step === 3 && progress === 'done' && (
              <button onClick={onClose} className="h-[36px] px-[18px] rounded-[8px] text-[13px] font-semibold text-white bg-[#d4183d] hover:bg-[#b81530] transition-colors">
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Row overflow menu ─────────────────────────────────────────────────────────

interface RowMenuProps {
  ep: Endpoint;
  onRestart: () => void;
}

function RowMenu({ ep, onRestart }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0, flipUp: false });
  const [showUninstall, setShowUninstall] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const flipUp = window.innerHeight - rect.bottom < 280;
      setMenuPos({
        top: flipUp ? rect.top : rect.bottom + 4,
        right: window.innerWidth - rect.right,
        flipUp,
      });
    }
    setOpen(v => !v);
  }

  const standardActions = [
    { label: 'Restart',      badge: null, disabled: false },
    { label: 'View Details', badge: null, disabled: false },
  ];

  const destructiveActions = [
    ...( ep.health !== 'healthy'
      ? [{ label: ep.health === 'isolated' ? 'Lift Isolation' : 'Isolate Endpoint' }]
      : []
    ),
    { label: 'Uninstall apps' },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="w-[28px] h-[28px] flex items-center justify-center rounded-[6px] transition-colors"
        style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <MoreVertical className="w-[15px] h-[15px]" />
      </button>
      {open && (
        <div className="fixed z-50 bg-white rounded-[8px] overflow-hidden min-w-[210px]"
          style={{
            top: menuPos.flipUp ? undefined : menuPos.top,
            bottom: menuPos.flipUp ? window.innerHeight - menuPos.top : undefined,
            right: menuPos.right,
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}>
          <div className="py-[4px]">
            {standardActions.map(({ label, badge, disabled }) => (
              <button key={label}
                className="flex items-center justify-between w-full px-[14px] py-[8px] text-[13px] text-left transition-colors"
                style={{ background: 'transparent', border: 'none', color: disabled ? '#b0b0b8' : '#1a1a1a', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1 }}
                onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                onClick={() => {
                  if (!disabled) {
                    if (label === 'Restart') { onRestart(); }
                    if (label === 'View Details') { setShowDetails(true); }
                    setOpen(false);
                  }
                }}
                disabled={disabled}
              >
                <span style={{ color: disabled ? '#b0b0b8' : '#1a1a1a' }}>{label}</span>
                {badge && (
                  <span className="text-[10px] font-bold px-[6px] py-[2px] rounded-[4px]"
                    style={{ background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                )}
              </button>
            ))}
          </div>
          {destructiveActions.length > 0 && (
            <>
              <div style={{ height: 1, background: '#f3f4f6', margin: '0 14px' }} />
              <div className="py-[4px]">
                {destructiveActions.map(({ label }) => (
                  <button key={label}
                    className="flex items-center w-full px-[14px] py-[8px] text-[13px] text-left transition-colors"
                    style={{ background: 'transparent', border: 'none', color: '#d4183d', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fff5f6')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => {
                      if (label === 'Uninstall apps') { setShowUninstall(true); }
                      setOpen(false);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {showUninstall && <UninstallModal ep={ep} onClose={() => setShowUninstall(false)} />}
      {showDetails && <EndpointDetailModal ep={ep} onClose={() => setShowDetails(false)} />}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function MspEndpointsPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Restart notification bar
  const [restartNotification, setRestartNotification] = useState<string | null>(null);
  const restartDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showRestartNotification = useCallback((epName: string) => {
    if (restartDismissTimer.current) clearTimeout(restartDismissTimer.current);
    setRestartNotification(epName);
    restartDismissTimer.current = setTimeout(() => setRestartNotification(null), 10000);
  }, []);

  const dismissRestartNotification = useCallback(() => {
    if (restartDismissTimer.current) clearTimeout(restartDismissTimer.current);
    setRestartNotification(null);
  }, []);

  useEffect(() => {
    return () => { if (restartDismissTimer.current) clearTimeout(restartDismissTimer.current); };
  }, []);

  const filtered = ENDPOINTS.filter(ep => {
    const q = search.toLowerCase();
    return !q || ep.name.toLowerCase().includes(q) || ep.tenantName.toLowerCase().includes(q) || ep.user.toLowerCase().includes(q) || ep.os.toLowerCase().includes(q);
  });

  const total = ENDPOINTS.length;

  const cols = ['DEVICE', 'TENANT', 'USER', 'OS', 'UNIFIED CLIENT\nVERSION', 'CSE APP\nVERSION', 'THERON APP\nVERSION', 'CONNECTIVITY', 'TRUST', 'LAST ACTIVE', 'ACTION'];

  const allSelected = filtered.length > 0 && filtered.every(ep => selected.has(ep.name));
  const someSelected = filtered.some(ep => selected.has(ep.name)) && !allSelected;
  const selectedCount = filtered.filter(ep => selected.has(ep.name)).length;

  function toggleAll() {
    if (allSelected) {
      setSelected(prev => { const s = new Set(prev); filtered.forEach(ep => s.delete(ep.name)); return s; });
    } else {
      setSelected(prev => { const s = new Set(prev); filtered.forEach(ep => s.add(ep.name)); return s; });
    }
  }

  function toggleRow(name: string) {
    setSelected(prev => { const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s; });
  }

  return (
    <div className="flex flex-col gap-[24px] w-full">
      <PageHeader title="Devices" />

      {/* Restart notification bar */}
      {restartNotification && (
        <div
          className="flex items-center justify-between gap-[12px] px-[16px] py-[11px] rounded-[8px]"
          style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
        >
          <div className="flex items-center gap-[10px]">
            <Info className="w-[16px] h-[16px] flex-shrink-0" style={{ color: '#2563eb' }} />
            <span className="text-[13px]" style={{ color: '#1e40af' }}>
              <span className="font-semibold">{restartNotification}</span> has been queued for restart. This may take a moment to complete.
            </span>
          </div>
          <button
            onClick={dismissRestartNotification}
            className="flex items-center justify-center w-[20px] h-[20px] rounded-[4px] flex-shrink-0 transition-colors"
            style={{ background: 'transparent', border: 'none', color: '#93c5fd', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')}
            onMouseLeave={e => (e.currentTarget.style.color = '#93c5fd')}
          >
            <X className="w-[14px] h-[14px]" />
          </button>
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-[12px] border border-[#e5e7eb] overflow-visible">
        {/* Table header */}
        <div className="flex items-center px-[20px] py-[14px] border-b border-[#e5e7eb]">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#9ca3af] w-[13px] h-[13px]" />
            <input
              type="search"
              placeholder="Search endpoints, tenants, OS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-[30px] pr-[12px] text-[13px] rounded-[8px] outline-none"
              style={{ height: 34, width: 240, border: '1px solid rgba(0,0,0,0.1)', background: '#f9fafb' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#0066cc'; e.currentTarget.style.background = '#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.background = '#f9fafb'; }}
            />
          </div>
        </div>

        {/* Contextual action bar */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-[8px] px-[20px] py-[10px] border-b border-[#e5e7eb] bg-[#f8f9fa]">
            <span className="h-[32px] px-[12px] flex items-center text-[13px] font-bold text-[#1a1a1a] bg-[#ececf0] rounded-[8px] shrink-0">
              {selectedCount} selected
            </span>
            <div className="w-px h-[20px] bg-[rgba(0,0,0,0.1)] shrink-0" />
            {['Restart', 'Upgrade Agent', 'Run Scan', 'Push Policy'].map(label => (
              <button key={label}
                className="h-[32px] px-[12px] flex items-center text-[13px] font-medium text-[#1a1a1a] bg-white border border-[#ececf0] rounded-[8px] hover:bg-[#f8f9fa] transition-colors shrink-0"
              >
                {label}
              </button>
            ))}
            <div className="w-px h-[20px] bg-[rgba(0,0,0,0.1)] shrink-0" />
            {['Isolate', 'Uninstall Agent'].map(label => (
              <button key={label}
                className="h-[32px] px-[12px] flex items-center text-[13px] font-medium rounded-[8px] border transition-colors shrink-0"
                style={{ color: '#d4183d', background: '#fff5f6', borderColor: '#fcd0d5' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#ffe4e6')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff5f6')}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setSelected(new Set())}
              className="ml-auto text-[13px] font-medium text-[#0066cc] hover:underline shrink-0"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 1100 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ width: 36, padding: '10px 16px', paddingRight: 0 }}>
                  <input
                    type="checkbox"
                    className="w-[14px] h-[14px] cursor-pointer"
                    style={{ accentColor: '#0066cc' }}
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                  />
                </th>
                {cols.map((col, i) => {
                  const narrow = col.includes('\n');
                  const isAction = i === cols.length - 1;
                  return (
                    <th key={col} className="text-left"
                      style={{
                        padding: '10px 12px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: narrow ? 'normal' : 'nowrap',
                        width: isAction ? 44 : narrow ? 72 : undefined,
                        lineHeight: '1.3',
                      }}>
                      {col.includes('\n') ? col.split('\n').map((line, i) => <span key={i} style={{ display: 'block' }}>{line}</span>) : col}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ep, idx) => (
                <tr key={ep.name}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: idx === filtered.length - 1 ? 'none' : '1px solid #f3f4f8' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafbfd')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  {/* Checkbox */}
                  <td style={{ padding: '12px 16px', paddingRight: 0, width: 36, verticalAlign: 'middle' }}>
                    <input
                      type="checkbox"
                      className="w-[14px] h-[14px] cursor-pointer"
                      style={{ accentColor: '#0066cc' }}
                      checked={selected.has(ep.name)}
                      onChange={() => toggleRow(ep.name)}
                      onClick={e => e.stopPropagation()}
                    />
                  </td>

                  {/* DEVICE */}
                  <td style={{ padding: '12px 12px', verticalAlign: 'middle' }}>
                    <div className="flex items-center gap-[8px]">
                      <p className="text-[13px] font-semibold text-[#111827] leading-snug">{ep.name}</p>
                    </div>
                  </td>

                  {/* TENANT */}
                  <td style={{ padding: '12px 12px', fontSize: 13, fontWeight: 500, color: '#374151', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    {ep.tenantName}
                  </td>

                  {/* USER */}
                  <td style={{ padding: '12px 12px', verticalAlign: 'middle' }}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className={`text-[11px] font-semibold text-white ${AVATAR_COLOR}`}>
                          {usernameInitials(ep.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[13px] font-medium text-[#1a1a1a] leading-snug">{ep.userName}</p>
                        {ep.userEmail && (
                          <p className="text-[12px] leading-snug" style={{ color: '#717182' }}>{ep.userEmail}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* OS */}
                  <td style={{ padding: '12px 12px', verticalAlign: 'middle' }}>
                    <p className="text-[13px] text-[#374151] leading-snug">{ep.os}</p>
                    <p className="text-[11px] text-[#9ca3af] leading-snug">{ep.osBuild}</p>
                  </td>

                  {/* UNIFIED CLIENT */}
                  <td style={{ padding: '12px 12px', verticalAlign: 'middle' }}>
                    <VersionBadge ver={ep.agent} old={ep.agentOld} />
                  </td>

                  {/* CSE */}
                  <td style={{ padding: '12px 12px', verticalAlign: 'middle' }}>
                    <VersionBadge ver={ep.eppVer} old={ep.eppOld} />
                  </td>

                  {/* THERON */}
                  <td style={{ padding: '12px 12px', verticalAlign: 'middle' }}>
                    <VersionBadge ver={ep.icVer} old={ep.icOld} />
                  </td>

                  {/* CONNECTIVITY */}
                  <td style={{ padding: '12px 12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <TunnelBadge tunnel={ep.tunnel} />
                  </td>

                  {/* TRUST */}
                  <td style={{ padding: '12px 12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <TrustBadge trust={ep.trust} />
                  </td>

                  {/* LAST ACTIVE */}
                  <td style={{ padding: '12px 12px', verticalAlign: 'middle' }} title={ep.lastSeen}>
                    <span style={{ fontSize: 13, color: '#374151' }}>{formatRelativeTime(ep.lastSeen)}</span>
                  </td>

                  {/* ACTION */}
                  <td style={{ padding: '12px 16px 12px 0', width: 52, verticalAlign: 'middle', textAlign: 'right' }}>
                    <RowMenu
                      ep={ep}
                      onRestart={() => showRestartNotification(ep.name)}
                    />
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={cols.length + 1} style={{ padding: '48px 16px', textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
                    <Monitor className="w-[32px] h-[32px] mx-auto mb-[8px] text-[#d1d5db]" />
                    <p className="font-semibold text-[#374151]">No endpoints found</p>
                    <p className="text-[12px] mt-[2px]">Try adjusting your search or filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-[20px] py-[10px] border-t border-[#e5e7eb] text-[12px] text-[#6b7280]">
          Showing {filtered.length} of {total} endpoints across {new Set(ENDPOINTS.map(e => e.tid)).size} tenants
        </div>
      </div>
    </div>
  );
}
