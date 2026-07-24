import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import {
  Search, MoreVertical, Monitor, AlertTriangle, CheckCircle2,
  ChevronDown, RotateCcw, ArrowUpCircle, X, Info, UploadCloud, Calendar, Clock, Check,
  ScanLine, Trash2,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { useTenant } from '../contexts/TenantContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScanInfo {
  status: 'complete' | 'in-progress' | 'aborted';
  timestamp?: string;
  progress?: number;
}

interface TenantEndpoint {
  name: string;
  hw: string;
  user: string;
  os: string;
  osBuild: string;
  agent: string;
  agentOld: boolean;
  eppVer: string;
  eppOld: boolean;
  icVer: string;
  icOld: boolean;
  trust: 'low' | 'high';
  health: 'active-threat' | 'at-risk' | 'isolated' | 'healthy' | 'disconnected';
  tunnel: 'connected' | 'degraded' | 'suspended' | 'off';
  mods: { ztn: string; sia: string; eps: string };
  lastSeen: string;
  ip: string;
  scan: ScanInfo;
}

// ── Riverside Dental endpoints ────────────────────────────────────────────────

const TENANT_ENDPOINTS: TenantEndpoint[] = [
  {
    name: 'DENTAL-PC-01', hw: 'Dell OptiPlex 5000', user: 'maria',
    os: 'Windows 11 Pro', osBuild: '10.0.22631',
    agent: '4.1.2', agentOld: false, eppVer: '3.7.1', eppOld: false, icVer: '2.1.4', icOld: false,
    trust: 'high',
    health: 'healthy', tunnel: 'connected', mods: { ztn: 'on', sia: 'on', eps: 'on' },
    lastSeen: 'Jul 10, 2026 · 2:18 PM', ip: '10.0.0.21',
    scan: { status: 'complete', timestamp: 'Jul 10, 2026 · 7:52 AM' },
  },
  {
    name: 'OFFICE-LAPTOP', hw: 'HP EliteBook 840', user: 'jessica',
    os: 'Windows 11 Pro', osBuild: '10.0.22631',
    agent: '4.1.2', agentOld: false, eppVer: '3.7.1', eppOld: false, icVer: '2.1.4', icOld: false,
    trust: 'high',
    health: 'healthy', tunnel: 'connected', mods: { ztn: 'on', sia: 'on', eps: 'on' },
    lastSeen: 'Jul 10, 2026 · 2:00 PM', ip: '10.0.0.35',
    scan: { status: 'in-progress', progress: 45 },
  },
  {
    name: 'MARK-LAPTOP', hw: 'Lenovo ThinkPad X1', user: 'mark',
    os: 'Windows 11 Pro', osBuild: '10.0.22631',
    agent: '4.1.2', agentOld: false, eppVer: '3.7.1', eppOld: false, icVer: '2.1.4', icOld: false,
    trust: 'high',
    health: 'healthy', tunnel: 'connected', mods: { ztn: 'on', sia: 'on', eps: 'on' },
    lastSeen: 'Jul 22, 2026 · 10:12 AM', ip: '10.0.0.42',
    scan: { status: 'complete', timestamp: 'Jul 22, 2026 · 6:00 AM' },
  },
  {
    name: 'ANGELA-SURFACE', hw: 'Microsoft Surface Pro 9', user: 'angela',
    os: 'Windows 11 Pro', osBuild: '10.0.22631',
    agent: '4.0.8', agentOld: true, eppVer: '3.6.2', eppOld: true, icVer: '2.1.4', icOld: false,
    trust: 'low',
    health: 'at-risk', tunnel: 'degraded', mods: { ztn: 'on', sia: 'off', eps: 'threat' },
    lastSeen: 'Jul 21, 2026 · 4:45 PM', ip: '10.0.0.58',
    scan: { status: 'aborted', timestamp: 'Jul 20, 2026 · 1:10 PM' },
  },
  {
    name: 'KEVIN-DESKTOP', hw: 'Dell OptiPlex 3000', user: 'kevin',
    os: 'Windows 10 Pro', osBuild: '10.0.19045',
    agent: '3.9.1', agentOld: true, eppVer: '3.5.0', eppOld: true, icVer: '2.0.9', icOld: true,
    trust: 'low',
    health: 'disconnected', tunnel: 'off', mods: { ztn: 'off', sia: 'off', eps: 'off' },
    lastSeen: 'Jul 15, 2026 · 9:00 AM', ip: '10.0.0.63',
    scan: { status: 'aborted', timestamp: 'Jul 14, 2026 · 9:00 AM' },
  },
  {
    name: 'BRIAN-WINDOWS-PC', hw: 'HP Pavilion Desktop', user: 'brian',
    os: 'Windows 11 Home', osBuild: '10.0.22631',
    agent: '4.1.2', agentOld: false, eppVer: '3.7.1', eppOld: false, icVer: '2.1.4', icOld: false,
    trust: 'high',
    health: 'healthy', tunnel: 'connected', mods: { ztn: 'on', sia: 'on', eps: 'on' },
    lastSeen: 'Jul 22, 2026 · 8:30 PM', ip: '10.0.0.71',
    scan: { status: 'complete', timestamp: 'Jul 22, 2026 · 5:00 AM' },
  },
  {
    name: 'TANYA-MACBOOK-AIR', hw: 'Apple MacBook Air M2', user: 'tanya',
    os: 'macOS 14.4', osBuild: '23.4.0',
    agent: '4.1.2', agentOld: false, eppVer: '3.7.1', eppOld: false, icVer: '2.1.3', icOld: true,
    trust: 'low',
    health: 'active-threat', tunnel: 'suspended', mods: { ztn: 'on', sia: 'on', eps: 'threat' },
    lastSeen: 'Jul 23, 2026 · 7:15 AM', ip: '10.0.0.84',
    scan: { status: 'in-progress', progress: 72 },
  },
  {
    name: 'LUIS-THINKPAD', hw: 'Lenovo ThinkPad E15', user: 'luis',
    os: 'Windows 11 Pro', osBuild: '10.0.22631',
    agent: '4.1.1', agentOld: true, eppVer: '3.7.0', eppOld: true, icVer: '2.1.4', icOld: false,
    trust: 'low',
    health: 'isolated', tunnel: 'suspended', mods: { ztn: 'on', sia: 'off', eps: 'on' },
    lastSeen: 'Jul 19, 2026 · 11:20 AM', ip: '10.0.0.95',
    scan: { status: 'complete', timestamp: 'Jul 19, 2026 · 11:00 AM' },
  },
];

// ── Upgrade-Agent constants ───────────────────────────────────────────────────

const UPG_LATEST = { agent: '4.1.2', epp: '3.7.1', ic: '2.1.4' };
const UPG_VERSIONS = {
  agent: ['4.1.2', '4.1.1', '4.1.0', '4.0.8', '3.9.1'],
  epp:   ['3.7.1', '3.7.0', '3.6.8', '3.6.2', '3.5.0'],
  ic:    ['2.1.4', '2.1.3', '2.1.2', '2.0.9', '2.0.8'],
};
const UPG_STAGES = ['Queued', 'Pushing', 'Installing', 'Restarting', 'Done'];

function semverLt(a: string, b: string): boolean {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return true;
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return false;
  }
  return false;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLOR = 'bg-[#6b7fa8]';

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

function usernameInitials(user: string): string {
  if (!user || user === 'N/A') return '?';
  const parts = user.split(/[._\-\s]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return user.slice(0, 2).toUpperCase();
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

function TunnelBadge({ tunnel }: { tunnel: TenantEndpoint['tunnel'] }) {
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

function VersionBadge({ ver }: { ver: string; old: boolean }) {
  return <span style={{ fontSize: 13, color: '#374151' }}>{ver}</span>;
}

function TrustBadge({ trust }: { trust: TenantEndpoint['trust'] }) {
  const cfg = {
    low:  { bg: '#fee2e2', color: '#991b1b', label: 'Low' },
    high: { bg: '#dcfce7', color: '#15803d', label: 'High' },
  }[trust];
  return (
    <span className="inline-flex items-center gap-[5px] text-[11px] font-semibold px-[8px] py-[2px] rounded-full whitespace-nowrap" style={{ background: cfg.bg, color: cfg.color }}>
      {trust === 'low' && <AlertTriangle className="w-[11px] h-[11px] flex-shrink-0" />}
      {cfg.label}
    </span>
  );
}

// ── Upgrade Agent Modal ───────────────────────────────────────────────────────

interface UpgradeProgress {
  epName: string;
  stageIdx: number;
}

interface UpgradeWizardState {
  step: 1 | 2 | 3 | 4;
  targets: TenantEndpoint[];
  schedule: 'now' | 'scheduled';
  scheduledAt: string;
  restart: boolean;
  skipThreats: boolean;
  chosenVersions: { agent: string; epp: string; ic: string };
  progress: UpgradeProgress[];
}

function UpgradeAgentModal({ ep, onClose }: { ep: TenantEndpoint; onClose: () => void }) {
  const needsAgent = ep.agentOld;
  const needsEpp   = ep.eppOld;
  const needsIc    = ep.icOld;

  const [wiz, setWiz] = useState<UpgradeWizardState>({
    step: 1,
    targets: [ep],
    schedule: 'now',
    scheduledAt: '',
    restart: true,
    skipThreats: true,
    chosenVersions: { agent: UPG_LATEST.agent, epp: UPG_LATEST.epp, ic: UPG_LATEST.ic },
    progress: [],
  });

  const progTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => { progTimers.current.forEach(clearTimeout); };
  }, []);

  function next() { setWiz(w => ({ ...w, step: Math.min(w.step + 1, 4) as 1 | 2 | 3 | 4 })); }
  function back() { setWiz(w => ({ ...w, step: Math.max(w.step - 1, 1) as 1 | 2 | 3 | 4 })); }

  function startUpgrade() {
    const initialProgress = wiz.targets.map(t => ({ epName: t.name, stageIdx: 0 }));
    setWiz(w => ({ ...w, step: 4, progress: initialProgress }));
    wiz.targets.forEach((t, i) => {
      [600, 1400, 2400, 3200, 4000].forEach((delay, stageIdx) => {
        const tid = setTimeout(() => {
          setWiz(w => ({
            ...w,
            progress: w.progress.map(p =>
              p.epName === t.name ? { ...p, stageIdx: stageIdx + 1 } : p
            ),
          }));
        }, delay + i * 300);
        progTimers.current.push(tid);
      });
    });
  }

  const allDone = wiz.progress.length > 0 && wiz.progress.every(p => p.stageIdx >= 4);

  const STEP_LABELS = ['Pre-flight Check', 'Schedule & Options', 'Confirm', 'Progress'];
  function StepIndicator() {
    return (
      <div className="flex items-center gap-0 mb-[24px]">
        {STEP_LABELS.map((label, idx) => {
          const num = idx + 1;
          const done   = num < wiz.step;
          const active = num === wiz.step;
          return (
            <React.Fragment key={num}>
              <div className="flex flex-col items-center gap-[6px]" style={{ minWidth: 80 }}>
                <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[12px] font-bold"
                  style={{
                    background: done ? '#16a34a' : active ? '#0066cc' : '#e5e7eb',
                    color: done || active ? '#fff' : '#9ca3af',
                  }}>
                  {done ? <Check className="w-[14px] h-[14px]" /> : num}
                </div>
                <span className="text-[10px] font-semibold text-center leading-tight"
                  style={{ color: done ? '#16a34a' : active ? '#0066cc' : '#9ca3af', maxWidth: 72 }}>
                  {label}
                </span>
              </div>
              {idx < STEP_LABELS.length - 1 && (
                <div className="flex-1 h-[2px] mb-[18px]" style={{ background: done ? '#16a34a' : '#e5e7eb' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  function Step1() {
    const rows = [
      needsAgent && { key: 'agent' as const, label: 'Unified Client',  current: ep.agent,  versions: UPG_VERSIONS.agent },
      needsEpp   && { key: 'epp'   as const, label: 'EPP Client',      current: ep.eppVer, versions: UPG_VERSIONS.epp   },
      needsIc    && { key: 'ic'    as const, label: 'Internet Client', current: ep.icVer,  versions: UPG_VERSIONS.ic    },
    ].filter(Boolean) as { key: 'agent'|'epp'|'ic'; label: string; current: string; versions: string[] }[];

    if (rows.length === 0) {
      return (
        <div className="flex items-center gap-[10px] px-[14px] py-[12px] rounded-[8px]"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <CheckCircle2 className="w-[16px] h-[16px] flex-shrink-0" style={{ color: '#16a34a' }} />
          <p className="text-[13px] font-semibold" style={{ color: '#15803d' }}>All components are up to date.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-[20px]">
        <div className="rounded-[8px] overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
          <div className="grid px-[16px] py-[10px]"
            style={{ gridTemplateColumns: '1fr 140px 20px 140px', gap: 12, background: '#f8f9fa', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#717182]">Component</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#717182]">Current</span>
            <span />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#717182]">Upgrade To</span>
          </div>
          {rows.map(row => {
            const isDowngrade = semverLt(wiz.chosenVersions[row.key], row.current);
            return (
              <div key={row.key} className="grid items-center px-[16px] py-[12px]"
                style={{ gridTemplateColumns: '1fr 140px 20px 140px', gap: 12, borderBottom: '1px solid #f3f4f6' }}>
                <span className="text-[13px] font-semibold text-[#1a1a1a]">{row.label}</span>
                <span className="text-[13px] text-[#717182] font-mono">{row.current}</span>
                <span className="text-[#9ca3af]" style={{ fontSize: 14 }}>→</span>
                <div className="flex flex-col gap-[2px]">
                  <div className="relative">
                    <select
                      className="w-full h-[32px] text-[13px] rounded-[6px] pl-[10px] pr-[28px] appearance-none"
                      style={{ border: '1px solid rgba(0,0,0,0.12)', background: '#fff', color: '#1a1a1a', cursor: 'pointer' }}
                      value={wiz.chosenVersions[row.key]}
                      onChange={e => setWiz(w => ({ ...w, chosenVersions: { ...w.chosenVersions, [row.key]: e.target.value } }))}
                    >
                      {row.versions.map(v => (
                        <option key={v} value={v}>{v}{v === UPG_LATEST[row.key] ? ' (latest)' : ''}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-[8px] top-1/2 -translate-y-1/2 w-[12px] h-[12px] pointer-events-none text-[#9ca3af]" />
                  </div>
                  {isDowngrade && <span className="text-[10px] font-semibold" style={{ color: '#d97706' }}>⚠ Downgrade</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-[8px] px-[16px] py-[12px]" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <p className="text-[12px] font-semibold text-[#0369a1] mb-[6px]">1 endpoint will be upgraded</p>
          <div className="flex items-center gap-[8px]">
            <Monitor className="w-[14px] h-[14px] text-[#0369a1] flex-shrink-0" />
            <span className="text-[13px] font-semibold text-[#1a1a1a]">{ep.name}</span>
            <span className="text-[12px] text-[#717182]">— Riverside Dental</span>
          </div>
        </div>
      </div>
    );
  }

  function Step2() {
    return (
      <div className="flex flex-col gap-[20px]">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#717182] mb-[10px]">Timing</p>
          <div className="grid grid-cols-2 gap-[10px]">
            {(['now', 'scheduled'] as const).map(opt => {
              const active = wiz.schedule === opt;
              return (
                <button key={opt} onClick={() => setWiz(w => ({ ...w, schedule: opt }))}
                  className="flex items-start gap-[10px] p-[14px] rounded-[8px] text-left transition-all"
                  style={{ background: active ? '#eff6ff' : '#f8f9fa', border: active ? '2px solid #0066cc' : '1px solid rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                  <div className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center flex-shrink-0"
                    style={{ background: active ? '#0066cc' : '#e5e7eb' }}>
                    {opt === 'now'
                      ? <Clock className="w-[14px] h-[14px]" style={{ color: active ? '#fff' : '#9ca3af' }} />
                      : <Calendar className="w-[14px] h-[14px]" style={{ color: active ? '#fff' : '#9ca3af' }} />}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: active ? '#0066cc' : '#1a1a1a' }}>
                      {opt === 'now' ? 'Upgrade Now' : 'Schedule for Later'}
                    </p>
                    <p className="text-[11px] text-[#717182] mt-[2px]">
                      {opt === 'now' ? 'Start immediately after confirmation' : 'Choose a date and time'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {wiz.schedule === 'scheduled' && (
            <div className="mt-[10px]">
              <input type="datetime-local"
                className="h-[36px] w-full rounded-[8px] px-[12px] text-[13px]"
                style={{ border: '1px solid rgba(0,0,0,0.1)', background: '#fff', color: '#1a1a1a' }}
                value={wiz.scheduledAt}
                onChange={e => setWiz(w => ({ ...w, scheduledAt: e.target.value }))}
              />
            </div>
          )}
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#717182] mb-[10px]">Behavior</p>
          <div className="flex flex-col gap-[8px]">
            {[
              { key: 'restart'     as const, label: 'Restart after upgrade',   desc: 'Automatically restart the endpoint to complete installation' },
              { key: 'skipThreats' as const, label: 'Skip if threats detected', desc: 'Do not upgrade endpoints with active threats' },
            ].map(({ key, label, desc }) => {
              const on = wiz[key];
              return (
                <div key={key} className="flex items-center justify-between p-[12px] rounded-[8px]"
                  style={{ background: '#f8f9fa', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div>
                    <p className="text-[13px] font-semibold text-[#1a1a1a]">{label}</p>
                    <p className="text-[11px] text-[#717182] mt-[2px]">{desc}</p>
                  </div>
                  <button onClick={() => setWiz(w => ({ ...w, [key]: !w[key] }))}
                    className="w-[40px] h-[22px] rounded-full flex-shrink-0 relative transition-colors"
                    style={{ background: on ? '#0066cc' : '#d1d5db', border: 'none', cursor: 'pointer' }}>
                    <span className="absolute top-[3px] w-[16px] h-[16px] rounded-full bg-white transition-all"
                      style={{ left: on ? 21 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function Step3() {
    const isDowngrade = (['agent', 'epp', 'ic'] as const).some(k => {
      const cur = k === 'agent' ? ep.agent : k === 'epp' ? ep.eppVer : ep.icVer;
      return semverLt(wiz.chosenVersions[k], cur);
    });
    return (
      <div className="flex flex-col gap-[16px]">
        <div className="rounded-[8px] overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
          <div className="px-[16px] py-[10px]" style={{ background: '#f8f9fa', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <span className="text-[12px] font-semibold uppercase tracking-wide text-[#717182]">Upgrade Summary</span>
          </div>
          <div className="px-[16px] py-[14px] flex flex-col gap-[10px]">
            {[
              needsAgent && { label: 'Unified Client',  from: ep.agent,  to: wiz.chosenVersions.agent },
              needsEpp   && { label: 'EPP Client',      from: ep.eppVer, to: wiz.chosenVersions.epp   },
              needsIc    && { label: 'Internet Client', from: ep.icVer,  to: wiz.chosenVersions.ic    },
            ].filter(Boolean).map((row: any) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-[13px] text-[#1a1a1a] font-semibold">{row.label}</span>
                <span className="text-[13px] font-mono text-[#717182]">
                  {row.from} <span style={{ color: '#9ca3af' }}>→</span> <span style={{ color: '#0066cc', fontWeight: 700 }}>{row.to}</span>
                </span>
              </div>
            ))}
            <div style={{ height: 1, background: '#f3f4f6', margin: '4px 0' }} />
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#717182]">Timing</span>
              <span className="text-[13px] font-semibold text-[#1a1a1a]">{wiz.schedule === 'now' ? 'Immediate' : wiz.scheduledAt || 'Scheduled'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#717182]">Endpoint</span>
              <span className="text-[13px] font-semibold text-[#1a1a1a]">{ep.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#717182]">Restart after upgrade</span>
              <span className="text-[13px] font-semibold" style={{ color: wiz.restart ? '#16a34a' : '#6b7280' }}>{wiz.restart ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
        {isDowngrade && (
          <div className="flex items-start gap-[10px] px-[14px] py-[12px] rounded-[8px]"
            style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}>
            <AlertTriangle className="w-[16px] h-[16px] flex-shrink-0 mt-[1px]" style={{ color: '#d97706' }} />
            <p className="text-[12px]" style={{ color: '#92400e' }}>
              One or more selected versions are <strong>older</strong> than what is currently installed.
            </p>
          </div>
        )}
        <div className="flex items-start gap-[10px] px-[14px] py-[12px] rounded-[8px]"
          style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <Info className="w-[16px] h-[16px] flex-shrink-0 mt-[1px]" style={{ color: '#2563eb' }} />
          <p className="text-[12px]" style={{ color: '#1e40af' }}>
            The endpoint will remain protected during the upgrade.
          </p>
        </div>
      </div>
    );
  }

  function Step4() {
    const stageColors: Record<number, { bg: string; color: string; label: string }> = {
      0: { bg: '#f3f4f6', color: '#6b7280', label: 'Queued' },
      1: { bg: '#eff6ff', color: '#2563eb', label: 'Pushing' },
      2: { bg: '#fef3c7', color: '#92400e', label: 'Installing' },
      3: { bg: '#fdf4ff', color: '#7e22ce', label: 'Restarting' },
      4: { bg: '#dcfce7', color: '#15803d', label: 'Done' },
    };
    return (
      <div className="flex flex-col gap-[12px]">
        {wiz.progress.map(p => {
          const cfg = stageColors[p.stageIdx] ?? stageColors[0];
          const pct = Math.round((p.stageIdx / 4) * 100);
          return (
            <div key={p.epName} className="rounded-[8px] px-[14px] py-[12px]"
              style={{ background: '#f8f9fa', border: '1px solid rgba(0,0,0,0.08)' }}>
              <div className="flex items-center justify-between mb-[8px]">
                <div className="flex items-center gap-[8px]">
                  <Monitor className="w-[14px] h-[14px] text-[#717182] flex-shrink-0" />
                  <span className="text-[13px] font-semibold text-[#1a1a1a]">{p.epName}</span>
                </div>
                <span className="text-[11px] font-bold px-[8px] py-[2px] rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>
              <div className="h-[6px] rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: p.stageIdx === 4 ? '#16a34a' : '#0066cc' }} />
              </div>
              <div className="flex items-center justify-between mt-[8px]">
                {UPG_STAGES.map((stage, si) => (
                  <div key={stage} className="flex flex-col items-center gap-[3px]">
                    <div className="w-[6px] h-[6px] rounded-full"
                      style={{ background: si < p.stageIdx ? '#16a34a' : si === p.stageIdx ? '#0066cc' : '#d1d5db' }} />
                    <span className="text-[9px]" style={{ color: si <= p.stageIdx ? '#1a1a1a' : '#9ca3af' }}>{stage}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {allDone && (
          <div className="flex items-center gap-[10px] px-[14px] py-[12px] rounded-[8px]"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <CheckCircle2 className="w-[16px] h-[16px] flex-shrink-0" style={{ color: '#16a34a' }} />
            <p className="text-[13px] font-semibold" style={{ color: '#15803d' }}>Upgrade complete — endpoint is up to date.</p>
          </div>
        )}
      </div>
    );
  }

  const canProceed = wiz.step === 2 ? (wiz.schedule === 'now' || wiz.scheduledAt.length > 0) : true;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex flex-col bg-white rounded-[12px] overflow-hidden"
        style={{ width: 680, maxWidth: '96vw', maxHeight: '88vh', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: '1px solid rgba(0,0,0,0.08)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-[24px] py-[18px] flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <div className="flex items-center gap-[12px]">
            <div className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center flex-shrink-0"
              style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <UploadCloud className="w-[18px] h-[18px]" style={{ color: '#0066cc' }} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#1a1a1a]">Upgrade Agent</p>
              <p className="text-[12px] text-[#717182]">{ep.name} · Riverside Dental</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-[28px] h-[28px] flex items-center justify-center rounded-[6px] transition-colors"
            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <X className="w-[15px] h-[15px]" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-[24px] py-[24px]">
          <StepIndicator />
          {wiz.step === 1 && <Step1 />}
          {wiz.step === 2 && <Step2 />}
          {wiz.step === 3 && <Step3 />}
          {wiz.step === 4 && <Step4 />}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between px-[24px] py-[16px] flex-shrink-0"
          style={{ borderTop: '1px solid rgba(0,0,0,0.08)', background: '#f8f9fa' }}>
          <div>
            {wiz.step > 1 && wiz.step < 4 && (
              <button onClick={back}
                className="h-[36px] px-[20px] rounded-[8px] text-[13px] font-semibold"
                style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#1a1a1a', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-[10px]">
            {wiz.step < 4 && (
              <button onClick={onClose}
                className="h-[36px] px-[20px] rounded-[8px] text-[13px] font-semibold"
                style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#1a1a1a', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                Cancel
              </button>
            )}
            {wiz.step < 3 && (
              <button onClick={next} disabled={!canProceed}
                className="h-[36px] px-[20px] rounded-[8px] text-[13px] font-bold text-white"
                style={{ background: canProceed ? '#0066cc' : '#93c5fd', border: 'none', cursor: canProceed ? 'pointer' : 'default' }}
                onMouseEnter={e => { if (canProceed) e.currentTarget.style.background = '#0052a6'; }}
                onMouseLeave={e => { if (canProceed) e.currentTarget.style.background = '#0066cc'; }}>
                Next
              </button>
            )}
            {wiz.step === 3 && (
              <button onClick={startUpgrade}
                className="h-[36px] px-[24px] rounded-[8px] text-[13px] font-bold text-white"
                style={{ background: '#0066cc', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0052a6')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0066cc')}>
                Start Upgrade
              </button>
            )}
            {wiz.step === 4 && allDone && (
              <button onClick={onClose}
                className="h-[36px] px-[20px] rounded-[8px] text-[13px] font-bold text-white"
                style={{ background: '#0066cc', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0052a6')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0066cc')}>
                Done
              </button>
            )}
            {wiz.step === 4 && !allDone && (
              <button onClick={onClose}
                className="h-[36px] px-[20px] rounded-[8px] text-[13px] font-semibold"
                style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#1a1a1a', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Scan Status Cell ──────────────────────────────────────────────────────────

function ScanStatusCell({ scan }: { scan: ScanInfo }) {
  if (scan.status === 'in-progress') {
    const pct = scan.progress ?? 0;
    const r = 9;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
      <div className="flex items-center gap-[8px]">
        <svg width="18" height="18" viewBox="0 0 22 22" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r={r} fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
          <circle
            cx="11" cy="11" r={r}
            fill="none"
            stroke="#0066cc"
            strokeWidth="2.5"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 11 11)"
            style={{ transition: 'stroke-dasharray 0.3s ease' }}
          />
        </svg>
        <div>
          <p className="text-[12px] font-semibold text-[#374151] leading-tight">In Progress</p>
          <p className="text-[11px] text-[#9ca3af] leading-tight">{pct}% complete</p>
        </div>
      </div>
    );
  }

  if (scan.status === 'complete') {
    return (
      <div className="flex items-center gap-[6px]">
        <CheckCircle2 className="w-[18px] h-[18px] text-[#15803d] flex-shrink-0" />
        <div>
          <p className="text-[12px] font-semibold text-[#374151] leading-tight">Scan Complete</p>
          <p className="text-[11px] text-[#9ca3af] leading-tight">{scan.timestamp}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-[6px]">
      <AlertTriangle className="w-[18px] h-[18px] text-[#d4183d] flex-shrink-0" />
      <div>
        <p className="text-[12px] font-semibold text-[#374151] leading-tight">Scan Aborted</p>
        <p className="text-[11px] text-[#9ca3af] leading-tight">{scan.timestamp}</p>
      </div>
    </div>
  );
}

// ── Uninstall modal ──────────────────────────────────────────────────────────

// App hierarchy: Unified Client (UC) is the wrapper; Theron and CSE are sub-apps.
// Removing UC removes everything. Theron can be removed alone; CSE cannot (admin-managed).
const UNINSTALL_APP_META: Record<'UC' | 'THERON' | 'CSE', { title: string }> = {
  UC:     { title: 'Unified Client' },
  THERON: { title: 'Theron' },
  CSE:    { title: 'CSE' },
};

function joinAnd(items: string[]): string {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function InfoRow({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3"
      style={last ? undefined : { borderBottom: '1px solid rgba(0,0,0,0.07)' }}
    >
      <span className="text-[12px] flex-shrink-0" style={{ color: '#717182' }}>{label}</span>
      <div className="text-[13px] font-semibold text-[#1a1a1a] text-right">{children}</div>
    </div>
  );
}

interface UninstallModalProps {
  ep: TenantEndpoint;
  onClose: () => void;
}

function UninstallModal({ ep, onClose }: UninstallModalProps) {
  const hasUC = !!ep.agent;
  const hasTheron = !!ep.icVer;
  const hasCSE = !!ep.eppVer;
  const canUninstall = hasUC || hasTheron;

  // 'uc' removes the wrapper and every sub-app; 'theron' removes Theron only.
  // Default to the least destructive available option.
  const [scope, setScope] = useState<'uc' | 'theron'>(hasTheron ? 'theron' : 'uc');
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const deviceLabel = ep.name;

  // Everything the wrapper takes with it, filtered to what is actually installed.
  const ucRemovalLabels = [
    UNINSTALL_APP_META.UC.title,
    ...(hasTheron ? [UNINSTALL_APP_META.THERON.title] : []),
    ...(hasCSE ? [UNINSTALL_APP_META.CSE.title] : []),
  ];
  const removedLabels = scope === 'uc' ? ucRemovalLabels : [UNINSTALL_APP_META.THERON.title];
  const confirmLabel = scope === 'uc' ? 'Uninstall Unified Client' : 'Uninstall Theron';

  const RadioDot = ({ active }: { active: boolean }) => (
    <span
      className="flex items-center justify-center flex-shrink-0 mt-[1px]"
      style={{ width: 16, height: 16, borderRadius: '50%', border: active ? '1.5px solid #0066cc' : '1.5px solid rgba(0,0,0,0.3)' }}
    >
      {active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0066cc' }} />}
    </span>
  );

  const RadioCard = ({ value, title, desc }: { value: 'uc' | 'theron'; title: string; desc: string }) => {
    const active = scope === value;
    return (
      <button
        onClick={() => setScope(value)}
        className="flex items-start gap-3 text-left rounded-[8px] px-4 py-3 transition-colors w-full"
        style={{ border: active ? '2px solid #0066cc' : '2px solid rgba(0,0,0,0.1)', background: active ? '#eff6ff' : '#fff', cursor: 'pointer' }}
      >
        <RadioDot active={active} />
        <div>
          <div className="text-[13px] font-semibold text-[#1a1a1a]">{title}</div>
          <div className="text-[11px] mt-0.5" style={{ color: '#717182' }}>{desc}</div>
        </div>
      </button>
    );
  };

  // ── Confirm screen ──
  if (step === 'confirm') {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[60]" style={{ background: 'rgba(0,0,0,0.45)' }}>
        <div
          className="bg-white rounded-[12px] w-full max-w-[460px] mx-4 flex flex-col"
          style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.18)', border: '1px solid rgba(0,0,0,0.08)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <span className="font-semibold text-[15px] text-[#1a1a1a]">Confirm uninstallation</span>
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-[6px] transition-colors"
              style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', color: '#717182' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#ececf0')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 pt-6 pb-5 flex flex-col items-center gap-4 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full" style={{ background: '#fee2e2' }}>
              <AlertTriangle style={{ width: 28, height: 28, color: '#d4183d' }} />
            </div>
            <p className="font-semibold text-[15px] text-[#1a1a1a] leading-snug">
              Are you sure you want to uninstall {joinAnd(removedLabels)} from <strong>{deviceLabel}</strong>?
            </p>

            {/* Irreversibility callout */}
            <div className="w-full flex gap-3 rounded-[8px] px-4 py-3 text-left" style={{ background: '#fff5f5', border: '1px solid #fecaca' }}>
              <AlertTriangle style={{ width: 16, height: 16, color: '#d4183d', flexShrink: 0, marginTop: 1 }} />
              <p className="text-[13px] text-[#1a1a1a] leading-snug">
                This action cannot be undone.
                {scope === 'uc' && ' This action cannot be undone remotely.'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 pb-5">
            <button
              onClick={() => setStep('select')}
              className="text-[13px] font-semibold rounded-[8px] px-5 transition-colors"
              style={{ height: 36, border: '1px solid rgba(0,0,0,0.1)', background: '#fff', color: '#1a1a1a', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#ececf0')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              Don't uninstall
            </button>
            <button
              onClick={() => {
                toast.success('Uninstall command sent successfully');
                onClose();
              }}
              className="text-[13px] font-semibold rounded-[8px] px-5 transition-colors"
              style={{ height: 36, border: 'none', background: '#d4183d', color: '#fff', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#b3152f')}
              onMouseLeave={e => (e.currentTarget.style.background = '#d4183d')}
            >
              Uninstall
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Select screen ──
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60]"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-[12px] w-full max-w-[540px] mx-4 flex flex-col"
        style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.18)', border: '1px solid rgba(0,0,0,0.08)', maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-[8px] flex-shrink-0" style={{ background: '#fee2e2' }}>
              <Trash2 style={{ width: 18, height: 18, color: '#d4183d' }} />
            </div>
            <div className="font-semibold text-[16px] text-[#1a1a1a] leading-snug">Uninstall apps</div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-[6px] transition-colors flex-shrink-0"
            style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', color: '#717182' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#ececf0')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {/* Device identity */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-[8px]" style={{ background: '#f8f9fa', border: '1px solid rgba(0,0,0,0.07)' }}>
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className={`text-xs font-semibold text-white ${AVATAR_COLOR}`}>
                {usernameInitials(ep.user)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-semibold text-[13px] text-[#1a1a1a] truncate">{ep.name}</div>
              <div className="text-[12px] truncate" style={{ color: '#717182' }}>{ep.user}</div>
            </div>
          </div>

          {/* DEVICE */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-2" style={{ color: '#717182' }}>Device</p>
            <div className="rounded-[8px] overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
              <InfoRow label="Hardware">{ep.hw}</InfoRow>
              <InfoRow label="Operating system" last>{ep.os}</InfoRow>
            </div>
          </section>

          {/* WHAT TO REMOVE */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-2" style={{ color: '#717182' }}>Select what to remove</p>
            {!canUninstall ? (
              <div
                className="rounded-[8px] px-4 py-6 text-center text-[13px]"
                style={{ border: '1px dashed rgba(0,0,0,0.15)', color: '#717182' }}
              >
                No removable apps are installed on this device.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {hasUC && (
                  <RadioCard
                    value="uc"
                    title="Uninstall Unified Client"
                    desc={`Removes ${joinAnd(ucRemovalLabels)}.`}
                  />
                )}
                {hasTheron && (
                  <RadioCard
                    value="theron"
                    title="Uninstall Theron only"
                    desc={`Removes Theron. Unified Client${hasCSE ? ' and CSE' : ''} stay${hasCSE ? '' : 's'} installed.`}
                  />
                )}
              </div>
            )}
          </section>

          {/* Info callout */}
          {canUninstall && (
            <div className="flex gap-3 rounded-[8px] px-4 py-3" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <Info style={{ width: 16, height: 16, color: '#0066cc', flexShrink: 0, marginTop: 1 }} />
              <p className="text-[13px] text-[#1a1a1a] leading-snug">
                This will remove <strong>{joinAnd(removedLabels)}</strong> from <strong>{deviceLabel}</strong>. This action cannot be undone remotely.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <button
            onClick={onClose}
            className="text-[13px] font-semibold rounded-[8px] px-5 transition-colors"
            style={{ height: 36, border: '1px solid rgba(0,0,0,0.1)', background: '#fff', color: '#1a1a1a', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#ececf0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            Cancel
          </button>
          <button
            disabled={!canUninstall}
            onClick={() => setStep('confirm')}
            className="text-[13px] font-semibold rounded-[8px] px-5 transition-colors"
            style={{
              height: 36,
              border: 'none',
              background: canUninstall ? '#d4183d' : '#ececf0',
              color: canUninstall ? '#fff' : '#717182',
              cursor: canUninstall ? 'pointer' : 'not-allowed',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Endpoint detail modal ─────────────────────────────────────────────────────

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

function EndpointDetailModal({ ep, onClose }: { ep: TenantEndpoint; onClose: () => void }) {
  const { currentTenant } = useTenant();
  const isIsolated = ep.health === 'isolated';
  const isHealthy = ep.health === 'healthy';

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
              <DetailField label="Tenant">{currentTenant?.name || '—'}</DetailField>
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

// ── Row overflow menu ─────────────────────────────────────────────────────────

interface RowMenuProps {
  ep: TenantEndpoint;
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

const HEALTH_FILTERS = ['All Health States', 'Active Threats', 'At Risk', 'Isolated', 'Healthy', 'Disconnected'];

export function EndpointsPage() {
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('All Health States');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Restart notification
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

  useEffect(() => {
    if (!filterOpen) return;
    const h = (e: MouseEvent) => { if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [filterOpen]);

  const filtered = TENANT_ENDPOINTS.filter(ep => {
    const q = search.toLowerCase();
    const matchSearch = !q || ep.name.toLowerCase().includes(q) || ep.user.toLowerCase().includes(q) || ep.os.toLowerCase().includes(q);
    const healthMap: Record<string, TenantEndpoint['health'][]> = {
      'Active Threats': ['active-threat'],
      'At Risk':        ['at-risk'],
      'Isolated':       ['isolated'],
      'Healthy':        ['healthy'],
      'Disconnected':   ['disconnected'],
    };
    const matchHealth = healthFilter === 'All Health States' || (healthMap[healthFilter] || []).includes(ep.health);
    return matchSearch && matchHealth;
  });

  const total          = TENANT_ENDPOINTS.length;
  const healthy        = TENANT_ENDPOINTS.filter(e => e.health === 'healthy').length;
  const needsAttention = TENANT_ENDPOINTS.filter(e => ['active-threat', 'at-risk', 'isolated'].includes(e.health)).length;
  const outdated       = TENANT_ENDPOINTS.filter(e => e.agentOld || e.eppOld || e.icOld).length;
  const winCount       = TENANT_ENDPOINTS.filter(e => e.os.toLowerCase().includes('windows')).length;
  const macCount       = TENANT_ENDPOINTS.filter(e => e.os.toLowerCase().includes('macos') || e.os.toLowerCase().includes('mac')).length;
  const otherCount     = total - winCount - macCount;

  const cols = ['DEVICE', 'USER', 'OS', 'UNIFIED CLIENT', 'CSE', 'THERON', 'CONNECTIVITY', 'TRUST', 'LAST ACTIVE', 'ACTION'];

  const allSelected  = filtered.length > 0 && filtered.every(ep => selected.has(ep.name));
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
        <div className="flex items-center justify-between gap-[12px] px-[16px] py-[11px] rounded-[8px]"
          style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <div className="flex items-center gap-[10px]">
            <Info className="w-[16px] h-[16px] flex-shrink-0" style={{ color: '#2563eb' }} />
            <span className="text-[13px]" style={{ color: '#1e40af' }}>
              <span className="font-semibold">{restartNotification}</span> has been queued for restart. This may take a moment to complete.
            </span>
          </div>
          <button onClick={dismissRestartNotification}
            className="flex items-center justify-center w-[20px] h-[20px] rounded-[4px] flex-shrink-0"
            style={{ background: 'transparent', border: 'none', color: '#93c5fd', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')}
            onMouseLeave={e => (e.currentTarget.style.color = '#93c5fd')}>
            <X className="w-[14px] h-[14px]" />
          </button>
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-[10px] overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
        {/* Toolbar */}
        <div className="flex items-center px-[20px] py-[14px]" style={{ borderBottom: '1px solid #f3f4f6' }}>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-[10px] top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search endpoints, tenants, OS…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-[36px] pl-[32px] pr-[12px] text-[13px] rounded-[8px] w-[240px]"
              style={{ border: '1px solid rgba(0,0,0,0.1)', background: '#fff', color: '#1a1a1a', outline: 'none' }}
            />
          </div>
        </div>

        {/* Selection banner */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-[12px] px-[20px] py-[10px]"
            style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
            <span className="text-[13px] font-semibold" style={{ color: '#1e40af' }}>{selectedCount} endpoint{selectedCount !== 1 ? 's' : ''} selected</span>
            <button className="h-[28px] px-[12px] text-[12px] font-semibold rounded-[6px] text-white"
              style={{ background: '#0066cc', border: 'none', cursor: 'pointer' }}>
              Bulk Upgrade
            </button>
            <button className="h-[28px] px-[12px] text-[12px] font-semibold rounded-[6px]"
              style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#1a1a1a', cursor: 'pointer' }}>
              Bulk Restart
            </button>
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '10px 12px 10px 20px', width: 40 }}>
                  <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0066cc' }} />
                </th>
                {cols.map(col => (
                  <th key={col} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#6b7280', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ep, idx) => (
                <tr key={ep.name}
                  style={{ borderBottom: '1px solid #f3f4f6', background: selected.has(ep.name) ? '#f0f9ff' : idx % 2 === 1 ? '#fafafa' : '#fff' }}
                  onMouseEnter={e => { if (!selected.has(ep.name)) (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selected.has(ep.name) ? '#f0f9ff' : idx % 2 === 1 ? '#fafafa' : '#fff'; }}>

                  {/* Checkbox */}
                  <td style={{ padding: '12px 12px 12px 20px', verticalAlign: 'middle', width: 40 }}>
                    <input type="checkbox" checked={selected.has(ep.name)} onChange={() => toggleRow(ep.name)}
                      style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0066cc' }} />
                  </td>

                  {/* DEVICE */}
                  <td style={{ padding: '12px', verticalAlign: 'middle', minWidth: 180 }}>
                    <p className="text-[13px] font-bold text-[#111827] leading-tight">{ep.name}</p>
                  </td>

                  {/* USER */}
                  <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarFallback className={`text-[10px] font-semibold text-white ${AVATAR_COLOR}`}>
                          {usernameInitials(ep.user)}
                        </AvatarFallback>
                      </Avatar>
                      <span style={{ fontSize: 13, color: '#374151' }}>{ep.user}</span>
                    </div>
                  </td>

                  {/* OS */}
                  <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                    <p className="text-[13px] text-[#374151] leading-snug">{ep.os}</p>
                    <p className="text-[11px] text-[#9ca3af] leading-snug">{ep.osBuild}</p>
                  </td>

                  {/* UNIFIED CLIENT */}
                  <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                    <VersionBadge ver={ep.agent} old={ep.agentOld} />
                  </td>

                  {/* CSE */}
                  <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                    <VersionBadge ver={ep.eppVer} old={ep.eppOld} />
                  </td>

                  {/* THERON */}
                  <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                    <VersionBadge ver={ep.icVer} old={ep.icOld} />
                  </td>

                  {/* CONNECTIVITY */}
                  <td style={{ padding: '12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <TunnelBadge tunnel={ep.tunnel} />
                  </td>

                  {/* TRUST (from CSE) */}
                  <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                    <TrustBadge trust={ep.trust} />
                  </td>

                  {/* LAST ACTIVE */}
                  <td style={{ padding: '12px', verticalAlign: 'middle' }} title={ep.lastSeen}>
                    <span style={{ fontSize: 13, color: '#374151' }}>{formatRelativeTime(ep.lastSeen)}</span>
                  </td>

                  {/* ACTION */}
                  <td style={{ padding: '12px 16px 12px 0', width: 52, verticalAlign: 'middle', textAlign: 'right' }}>
                    <RowMenu ep={ep} onRestart={() => showRestartNotification(ep.name)} />
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
          Showing {filtered.length} of {total} enrolled endpoints · Riverside Dental Office
        </div>
      </div>
    </div>
  );
}


// Re-export for backward compatibility (imported by DashboardPage)
export const ENDPOINTS_DATA = TENANT_ENDPOINTS;
