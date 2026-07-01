import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Search, MoreVertical, ExternalLink, Trash2, AlertTriangle, X, Monitor, Layers, Laptop } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';

interface MockUser {
  id: string | number;
  name: string;
  email: string;
  roles?: string;
  role?: string;
  deviceName: string;
  lastLogin: string;
  ucApps?: string[];
}

const mockUsers: MockUser[] = [
  { id: 'usr_001', name: 'James Whitfield',   email: 'james.whitfield@acmecorp.com',    roles: 'Chromebook-ITP, role-device-ownership, auth-r...', deviceName: 'James-MacBook-Pro',  lastLogin: '8/12/2025, 4:09:42 PM',     ucApps: ['THERON', 'CSE'] },
  { id: 'usr_002', name: "Sarah O'Brien",      email: 'sarah.obrien@acmecorp.com',        roles: 'auth-role-standard, role-device-ownership',        deviceName: 'Sarah-Windows-PC',   lastLogin: '6/16/2025, 8:03:04 AM',     ucApps: ['THERON'] },
  { id: 'usr_003', name: 'Lucas Fernandez',    email: 'lucas.fernandez@acmecorp.com',     roles: 'role-device-ownership, auth-role-august-reset',    deviceName: 'Lucas-Laptop',       lastLogin: '7/22/2025, 7:14:27 AM',     ucApps: ['CSE'] },
  { id: 'usr_004', name: 'Emily Carter',       email: 'emily.carter@acmecorp.com',        roles: 'role-device-ownership, auth-role-august-reset',    deviceName: '—',                  lastLogin: '—',                         ucApps: [] },
  { id: 'usr_005', name: 'Tom Bergmann',       email: 'tom.bergmann@acmecorp.com',        roles: 'role-device-ownership, auth-role-august-reset',    deviceName: 'Tom-Desktop',        lastLogin: '—',                         ucApps: ['THERON'] },
  { id: 'usr_006', name: 'Rachel Kim',         email: 'rachel.kim@acmecorp.com',          roles: 'Chromebook-ITP, role-device-ownership, auth-r...', deviceName: 'Rachel-Surface',     lastLogin: '—',                         ucApps: ['THERON', 'CSE'] },
  { id: 'usr_007', name: 'Daniel Müller',      email: 'daniel.muller@acmecorp.com',       roles: 'auth-role-standard, role-device-ownership',        deviceName: 'Daniel-MacBook-Air', lastLogin: '1/14/2025, 12:15:52 AM',    ucApps: ['CSE'] },
  { id: 'usr_008', name: 'Olivia Thompson',    email: 'olivia.thompson@acmecorp.com',     roles: 'auth-role-standard, UnAuth-Temp, role-device-o...', deviceName: 'Olivia-Dell-XPS',  lastLogin: '10/26/2025, 11:47:31 PM',   ucApps: [] },
  { id: 'usr_009', name: 'Marcus Webb',        email: 'marcus.webb@acmecorp.com',         roles: 'auth-role-standard, Chromebook-ITP, role-devic...', deviceName: 'Marcus-Mobile',    lastLogin: '12/1/2025, 4:04:06 AM',     ucApps: ['THERON'] },
  { id: 'usr_010', name: 'Claire Dupont',      email: 'claire.dupont@acmecorp.com',       roles: 'Chromebook-ITP, role-device-ownership, auth-r...', deviceName: 'Claire-ThinkPad',  lastLogin: '7/6/2025, 10:49:23 PM',     ucApps: ['CSE'] },
  { id: 'usr_011', name: 'Nathan Kowalski',    email: 'nathan.kowalski@acmecorp.com',     roles: 'Chromebook-ITP, role-device-ownership, auth-r...', deviceName: '—',                  lastLogin: '—',                         ucApps: ['THERON', 'CSE'] },
  { id: 'usr_012', name: 'Priya Venkatesh',    email: 'priya.venkatesh@acmecorp.com',     roles: 'auth-role-standard, role-device-ownership',        deviceName: 'Priya-MacBook-Pro',  lastLogin: '5/9/2025, 2:33:17 PM',      ucApps: ['CSE'] },
];

const AVATAR_COLORS = [
  'bg-[#1a3a6b]', 'bg-[#c05a0a]', 'bg-[#1a7a6b]', 'bg-[#2a7a8a]',
  'bg-[#7a5a2a]', 'bg-[#4a6a2a]', 'bg-[#5a1a7a]', 'bg-[#1a5a9a]',
  'bg-[#7a3a1a]', 'bg-[#6a1a8a]', 'bg-[#1a2a5a]', 'bg-[#2a5a4a]',
];

const HONORIFICS = new Set(['dr', 'mr', 'mrs', 'ms', 'mx', 'prof', 'sir']);
function userInitials(name: string): string {
  let parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1 && HONORIFICS.has(parts[0].replace(/\.$/, '').toLowerCase())) parts = parts.slice(1);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function deviceTypeFromName(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('mobile') || n.includes('phone')) return 'Mobile';
  if (n.includes('surface') || n.includes('ipad') || n.includes('tablet')) return 'Tablet';
  return 'Laptop';
}

// ── Uninstall modal ──────────────────────────────────────────────────────────
interface UninstallModalProps {
  user: MockUser;
  avatarColor: string;
  onClose: () => void;
}

function UninstallModal({ user, avatarColor, onClose }: UninstallModalProps) {
  const apps = user.ucApps || [];
  const [selected, setSelected] = useState<string[]>([...apps]);

  const toggle = (app: string) =>
    setSelected(prev => prev.includes(app) ? prev.filter(a => a !== app) : [...prev, app]);

  const appLabel: Record<string, { title: string; desc: string }> = {
    THERON: { title: 'Theron', desc: 'SonicWall Theron security agent' },
    CSE:    { title: 'CSE',    desc: 'Cloud Security Edge connector' },
  };

  const selectedLabels = selected.map(a => appLabel[a]?.title || a);
  const btnLabel =
    selected.length === 0 ? 'Uninstall'
    : selected.length === 1 ? `Uninstall ${selectedLabels[0]}`
    : `Uninstall Both`;

  const deviceType = deviceTypeFromName(user.deviceName);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60]"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-[12px] w-full max-w-[540px] mx-4 flex flex-col"
        style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.18)', border: '1px solid rgba(0,0,0,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-[8px]" style={{ background: '#fee2e2' }}>
              <Trash2 style={{ width: 18, height: 18, color: '#d4183d' }} />
            </div>
            <span className="font-semibold text-[15px] text-[#1a1a1a]">Uninstall UC App</span>
          </div>
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

        {/* User identity row */}
        <div className="flex items-center gap-3 mx-6 mt-4 mb-4 px-4 py-3 rounded-[8px]" style={{ background: '#f8f9fa', border: '1px solid rgba(0,0,0,0.07)' }}>
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className={`text-xs font-semibold text-white ${avatarColor}`}>
              {userInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-[13px] text-[#1a1a1a]">{user.name}</div>
            <div className="text-[12px]" style={{ color: '#717182' }}>{user.email}</div>
          </div>
        </div>

        {/* Body — device + app selection */}
        <div className="flex gap-4 px-6 pb-4">
          {/* Device panel */}
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-2" style={{ color: '#717182' }}>DEVICE</p>
            <div className="rounded-[8px] overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                <Monitor style={{ width: 14, height: 14, color: '#717182', flexShrink: 0 }} />
                <span className="text-[12px]" style={{ color: '#717182', minWidth: 80 }}>Device name</span>
                <span className="text-[13px] font-semibold text-[#1a1a1a]">{user.deviceName === '—' ? '—' : user.deviceName}</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                <Layers style={{ width: 14, height: 14, color: '#717182', flexShrink: 0 }} />
                <span className="text-[12px]" style={{ color: '#717182', minWidth: 80 }}>Mode</span>
                <span className="text-[13px] font-semibold text-[#1a1a1a]">Managed</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <Laptop style={{ width: 14, height: 14, color: '#717182', flexShrink: 0 }} />
                <span className="text-[12px]" style={{ color: '#717182', minWidth: 80 }}>Type</span>
                <span className="text-[13px] font-semibold text-[#1a1a1a]">{deviceType}</span>
              </div>
            </div>
          </div>

          {/* App selection */}
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-2" style={{ color: '#717182' }}>SELECT APPS TO UNINSTALL</p>
            <div className="flex flex-col gap-2">
              {apps.length === 0 && (
                <p className="text-[12px]" style={{ color: '#717182' }}>No UC apps installed.</p>
              )}
              {apps.map(app => {
                const info = appLabel[app] || { title: app, desc: '' };
                const checked = selected.includes(app);
                return (
                  <button
                    key={app}
                    onClick={() => toggle(app)}
                    className="flex items-start gap-3 text-left rounded-[8px] px-3 py-3 transition-colors w-full"
                    style={{
                      border: checked ? '1.5px solid #0066cc' : '1.5px solid rgba(0,0,0,0.1)',
                      background: checked ? '#eff6ff' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      className="flex items-center justify-center flex-shrink-0 rounded-[4px] mt-[1px]"
                      style={{
                        width: 16, height: 16,
                        background: checked ? '#0066cc' : '#fff',
                        border: checked ? '1.5px solid #0066cc' : '1.5px solid rgba(0,0,0,0.25)',
                      }}
                    >
                      {checked && (
                        <svg viewBox="0 0 12 10" fill="none" width="10" height="10">
                          <path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#1a1a1a]">{info.title}</div>
                      <div className="text-[11px]" style={{ color: '#717182' }}>{info.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Warning banner */}
        {selected.length > 0 && (
          <div className="mx-6 mb-4 flex gap-3 rounded-[8px] px-4 py-3" style={{ background: '#fff5f5', border: '1px solid #fecaca' }}>
            <AlertTriangle style={{ width: 16, height: 16, color: '#d4183d', flexShrink: 0, marginTop: 1 }} />
            <p className="text-[13px] text-[#1a1a1a] leading-snug">
              Uninstalling will remove {selectedLabels.join(' and ')} from{' '}
              <strong>{user.name}</strong>'s device. This action cannot be undone remotely.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-5 pt-2">
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
            disabled={selected.length === 0}
            onClick={onClose}
            className="text-[13px] font-semibold rounded-[8px] px-5 transition-colors"
            style={{
              height: 36,
              border: 'none',
              background: selected.length === 0 ? '#ececf0' : '#d4183d',
              color: selected.length === 0 ? '#717182' : '#fff',
              cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Row overflow menu ────────────────────────────────────────────────────────
interface RowMenuProps {
  user: MockUser;
  avatarColor: string;
}

function RowMenu({ user, avatarColor }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const [showUninstall, setShowUninstall] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className="inline-flex items-center justify-center rounded-[8px] transition-colors"
          style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: '#717182', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#ececf0')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <MoreVertical style={{ width: 16, height: 16 }} />
        </button>

        {open && (
          <div
            className="absolute right-0 z-[50] rounded-[8px] py-1 min-w-[172px]"
            style={{
              top: 32,
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            {/* View Details */}
            <button
              className="flex items-center gap-3 w-full px-4 py-2 text-[13px] text-[#1a1a1a] transition-colors"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#ececf0')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => setOpen(false)}
            >
              <ExternalLink style={{ width: 15, height: 15, color: '#717182' }} />
              View Details
            </button>

            {/* Uninstall UC App */}
            <button
              className="flex items-center gap-3 w-full px-4 py-2 text-[13px] transition-colors"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#d4183d' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fff5f5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => { setOpen(false); setShowUninstall(true); }}
            >
              <Trash2 style={{ width: 15, height: 15 }} />
              Uninstall UC App
            </button>
          </div>
        )}
      </div>

      {showUninstall && (
        <UninstallModal
          user={user}
          avatarColor={avatarColor}
          onClose={() => setShowUninstall(false)}
        />
      )}
    </>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
interface IDPManagementProps {
  isReconfiguring?: boolean;
  onReconfigureClose?: () => void;
}

export function IDPManagement({ isReconfiguring = false, onReconfigureClose }: IDPManagementProps) {
  const { getTenantData } = useTenant();
  const tenantData = getTenantData();
  const [search, setSearch] = useState('');

  const rawUsers: MockUser[] = tenantData.users.length > 0 ? tenantData.users : mockUsers;
  const displayUsers = search
    ? rawUsers.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : rawUsers;

  return (
    <div
      className="bg-white rounded-[16px] overflow-visible"
      style={{ border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}
    >
      {/* Search toolbar */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}
      >
        <div className="relative flex-1">
          <Search
            className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#717182]"
            style={{ width: 16, height: 16 }}
          />
          <input
            type="search"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white text-[#1a1a1a] placeholder-[#717182] text-[13px] rounded-[8px] pl-[36px] pr-4 outline-none transition-shadow"
            style={{ height: 36, border: '1px solid rgba(0,0,0,0.1)' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#0066cc'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,102,204,0.4)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ background: '#ececf0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
            {['USER', 'ROLES', 'DEVICE NAME', 'LAST LOGIN', 'UC APP', ''].map((col, i) => (
              <th
                key={i}
                className="text-left text-[#717182]"
                style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', width: i === 5 ? 48 : undefined }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayUsers.map((user, idx) => {
            const isLast = idx === displayUsers.length - 1;
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            return (
              <tr
                key={user.id}
                className="transition-colors"
                style={{ borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.1)' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#ececf0')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                {/* USER */}
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#1a1a1a' }}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={`text-xs font-semibold text-white ${avatarColor}`}>
                        {userInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-[13px] text-[#1a1a1a] leading-snug">{user.name}</div>
                      <div className="text-[12px] leading-snug" style={{ color: '#717182' }}>{user.email}</div>
                    </div>
                  </div>
                </td>

                {/* ROLES */}
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#1a1a1a' }}>
                  <div className="truncate max-w-[300px]">{user.role || user.roles || '—'}</div>
                </td>

                {/* DEVICE NAME */}
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#1a1a1a' }}>
                  {user.deviceName || '—'}
                </td>

                {/* LAST LOGIN */}
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#1a1a1a' }}>
                  {user.lastLogin || '—'}
                </td>

                {/* UC APP */}
                <td style={{ padding: '12px 16px', fontSize: 13 }}>
                  <div className="flex items-center gap-1 flex-wrap">
                    {(user.ucApps || []).length > 0
                      ? (user.ucApps || []).map(app => (
                          <span
                            key={app}
                            className="inline-flex items-center leading-tight"
                            style={{ padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#ececf0', color: '#717182', border: '1px solid rgba(0,0,0,0.1)' }}
                          >
                            {app}
                          </span>
                        ))
                      : <span style={{ color: '#717182' }}>—</span>
                    }
                  </div>
                </td>

                {/* Kebab with dropdown */}
                <td style={{ padding: '12px 8px 12px 0', width: 48 }}>
                  <RowMenu user={user} avatarColor={avatarColor} />
                </td>
              </tr>
            );
          })}

          {displayUsers.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: '#717182' }}>
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '10px 20px', borderTop: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#717182' }}
      >
        <span>Showing {displayUsers.length} of {tenantData.dashboardMetrics.totalUsers || 458} users</span>
      </div>
    </div>
  );
}
