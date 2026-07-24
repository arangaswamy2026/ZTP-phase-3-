import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Search, MoreVertical, ExternalLink, X, Monitor, Layers, Laptop, ChevronDown } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';

interface MockUser {
  id: string | number;
  name: string;
  email: string;
  groups?: string[];
  endpointName: string | string[];
  lastLogin: string;
  ucApps?: string[];
}

const mockUsers: MockUser[] = [
  { id: 'usr_001', name: 'James Whitfield',   email: 'james.whitfield@acmecorp.com',    groups: ['Engineering', 'Testing'],  endpointName: ['James-MacBook-Pro', 'James-iPhone-15'],           lastLogin: '8/12/2025, 4:09:42 PM',     ucApps: ['UC', 'THERON', 'CSE'] },
  { id: 'usr_002', name: "Sarah O'Brien",      email: 'sarah.obrien@acmecorp.com',        groups: ['HR'],                      endpointName: 'Sarah-Windows-PC',                                 lastLogin: '6/16/2025, 8:03:04 AM',     ucApps: ['UC', 'THERON'] },
  { id: 'usr_003', name: 'Lucas Fernandez',    email: 'lucas.fernandez@acmecorp.com',     groups: ['Engineering'],             endpointName: ['Lucas-Laptop', 'Lucas-MacBook-Air', 'Lucas-iPad'], lastLogin: '7/22/2025, 7:14:27 AM',     ucApps: ['UC', 'CSE'] },
  { id: 'usr_004', name: 'Emily Carter',       email: 'emily.carter@acmecorp.com',        groups: ['Design'],                  endpointName: '—',                                                lastLogin: '—',                         ucApps: [] },
  { id: 'usr_005', name: 'Tom Bergmann',       email: 'tom.bergmann@acmecorp.com',        groups: ['Testing'],                 endpointName: ['Tom-Desktop', 'Tom-Laptop'],                       lastLogin: '—',                         ucApps: ['UC', 'THERON'] },
  { id: 'usr_006', name: 'Rachel Kim',         email: 'rachel.kim@acmecorp.com',          groups: ['Design', 'HR'],            endpointName: 'Rachel-Surface',                                   lastLogin: '—',                         ucApps: ['UC', 'THERON', 'CSE'] },
  { id: 'usr_007', name: 'Daniel Müller',      email: 'daniel.muller@acmecorp.com',       groups: ['Engineering'],             endpointName: ['Daniel-MacBook-Air', 'Daniel-Windows-PC'],        lastLogin: '1/14/2025, 12:15:52 AM',    ucApps: ['UC', 'CSE'] },
  { id: 'usr_008', name: 'Olivia Thompson',    email: 'olivia.thompson@acmecorp.com',     groups: ['HR', 'Testing'],           endpointName: 'Olivia-Dell-XPS',                                  lastLogin: '10/26/2025, 11:47:31 PM',   ucApps: [] },
  { id: 'usr_009', name: 'Marcus Webb',        email: 'marcus.webb@acmecorp.com',         groups: ['Engineering', 'Testing'],  endpointName: ['Marcus-Mobile', 'Marcus-Desktop'],                lastLogin: '12/1/2025, 4:04:06 AM',     ucApps: ['UC', 'THERON'] },
  { id: 'usr_010', name: 'Claire Dupont',      email: 'claire.dupont@acmecorp.com',       groups: ['Design'],                  endpointName: 'Claire-ThinkPad',                                  lastLogin: '7/6/2025, 10:49:23 PM',     ucApps: ['UC', 'CSE'] },
  { id: 'usr_011', name: 'Nathan Kowalski',    email: 'nathan.kowalski@acmecorp.com',     groups: ['HR'],                      endpointName: '—',                                                lastLogin: '—',                         ucApps: ['UC', 'THERON', 'CSE'] },
  { id: 'usr_012', name: 'Priya Venkatesh',    email: 'priya.venkatesh@acmecorp.com',     groups: ['Engineering', 'Design'],   endpointName: ['Priya-MacBook-Pro', 'Priya-Android'],             lastLogin: '5/9/2025, 2:33:17 PM',      ucApps: ['UC', 'CSE'] },
];

const AVATAR_COLOR = 'bg-[#6b7fa8]';

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

// Infer the endpoint operating system from its name. Apple devices → macOS, everything else → Windows.
function osFromName(name: string): 'macos' | 'windows' {
  const n = (name || '').toLowerCase();
  if (n.includes('mac') || n.includes('imac') || n.includes('iphone') || n.includes('ipad')) return 'macos';
  return 'windows';
}

function OSIcon({ os }: { os: 'macos' | 'windows' }) {
  const common = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true } as const;
  if (os === 'macos') {
    return (
      <svg {...common}>
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.51 4.09l-.02-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M3 5.1 10.4 4v7.3H3V5.1zm0 13.8 7.4 1v-7.2H3v6.2zM11.2 3.9 21 2.5v8.8h-9.8V3.9zm0 8.2H21v8.8l-9.8-1.4v-7.4z" />
    </svg>
  );
}

// Endpoint name preceded by its OS icon; renders a plain dash when there is no endpoint.
function EndpointLabel({ name }: { name: string }) {
  if (!name || name === '—') return <>{name || '—'}</>;
  return (
    <span className="inline-flex items-center gap-2">
      <span style={{ color: '#717182', display: 'inline-flex', flexShrink: 0 }}>
        <OSIcon os={osFromName(name)} />
      </span>
      {name}
    </span>
  );
}


// ── Row overflow menu ────────────────────────────────────────────────────────
// ── User details modal ────────────────────────────────────────────────────────
interface UserDetailsModalProps {
  user: MockUser;
  avatarColor: string;
  onClose: () => void;
}

const MODAL_PILL: React.CSSProperties = {
  padding: '2px 7px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  background: '#ececf0',
  color: '#717182',
  border: '1px solid rgba(0,0,0,0.1)',
};

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

function UserDetailsModal({ user, avatarColor, onClose }: UserDetailsModalProps) {
  const { currentTenant } = useTenant();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const endpoints = Array.isArray(user.endpointName)
    ? user.endpointName
    : user.endpointName === '—' ? [] : [user.endpointName];
  const groups = user.groups || [];
  const apps = user.ucApps || [];

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
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className={`text-[13px] font-semibold text-white ${avatarColor}`}>
                {userInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-semibold text-[16px] text-[#1a1a1a] leading-snug truncate">{user.name}</div>
              <div className="text-[13px] leading-snug truncate" style={{ color: '#717182' }}>{user.email}</div>
            </div>
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
          {/* IDENTITY */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-2" style={{ color: '#717182' }}>Identity</p>
            <div className="rounded-[8px] overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
              <InfoRow label="Tenant">{currentTenant?.name || '—'}</InfoRow>
              <InfoRow label="User">{user.email}</InfoRow>
              <InfoRow label="Groups">
                {groups.length > 0
                  ? <div className="flex items-center gap-1 flex-wrap justify-end">
                      {groups.map(g => <span key={g} className="inline-flex items-center leading-tight" style={MODAL_PILL}>{g}</span>)}
                    </div>
                  : <span style={{ color: '#717182' }}>—</span>}
              </InfoRow>
              <InfoRow label="Last login">{user.lastLogin || '—'}</InfoRow>
              <InfoRow label="Installed apps" last>
                {apps.length > 0
                  ? <div className="flex items-center gap-1 flex-wrap justify-end">
                      {apps.map(a => <span key={a} className="inline-flex items-center leading-tight" style={MODAL_PILL}>{a}</span>)}
                    </div>
                  : <span style={{ color: '#717182' }}>—</span>}
              </InfoRow>
            </div>
          </section>

          {/* ENDPOINTS */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-2" style={{ color: '#717182' }}>
              Endpoints · {endpoints.length}
            </p>
            {endpoints.length === 0 ? (
              <div
                className="rounded-[8px] px-4 py-6 text-center text-[13px]"
                style={{ border: '1px dashed rgba(0,0,0,0.15)', color: '#717182' }}
              >
                No endpoints mapped to this user.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {endpoints.map(ep => {
                  const os = osFromName(ep);
                  return (
                    <div key={ep} className="rounded-[8px] overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
                      <div className="flex items-center gap-2 px-4 py-3" style={{ background: '#f8f9fa', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                        <span style={{ color: '#717182', display: 'inline-flex', flexShrink: 0 }}><OSIcon os={os} /></span>
                        <span className="text-[13px] font-semibold text-[#1a1a1a]">{ep}</span>
                      </div>
                      <InfoRow label="Device type">{deviceTypeFromName(ep)}</InfoRow>
                      <InfoRow label="Operating system" last>{os === 'macos' ? 'macOS' : 'Windows'}</InfoRow>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <button
            onClick={onClose}
            className="text-[13px] font-semibold rounded-[8px] px-5 transition-colors"
            style={{ height: 36, border: '1px solid rgba(0,0,0,0.1)', background: '#fff', color: '#1a1a1a', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#ececf0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface RowMenuProps {
  user: MockUser;
  avatarColor: string;
}

function RowMenu({ user, avatarColor }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
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
              onClick={() => { setOpen(false); setShowDetails(true); }}
            >
              <ExternalLink style={{ width: 15, height: 15, color: '#717182' }} />
              View Details
            </button>
          </div>
        )}
      </div>

      {showDetails && (
        <UserDetailsModal
          user={user}
          avatarColor={avatarColor}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}

// ── Flat endpoint row ────────────────────────────────────────────────────────
interface EndpointRow {
  endpointName: string;
  user: MockUser;
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
  const [groupByUser, setGroupByUser] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

  const rawUsers: MockUser[] = tenantData.users.length > 0 ? tenantData.users : mockUsers;

  // Build flat endpoint rows — one row per endpoint
  const allEndpointRows: EndpointRow[] = rawUsers.flatMap(user => {
    const endpoints = Array.isArray(user.endpointName)
      ? user.endpointName
      : user.endpointName === '—' ? [] : [user.endpointName];
    if (endpoints.length === 0) return [{ endpointName: '—', user }];
    return endpoints.map(ep => ({ endpointName: ep, user }));
  });

  const filteredRows = search
    ? allEndpointRows.filter(r =>
        r.endpointName.toLowerCase().includes(search.toLowerCase()) ||
        r.user.name.toLowerCase().includes(search.toLowerCase()) ||
        r.user.email.toLowerCase().includes(search.toLowerCase())
      )
    : allEndpointRows;

  // Group by user: collapse same-user rows under a single user header
  interface UserGroup { user: MockUser; endpoints: EndpointRow[] }
  const userGroups: UserGroup[] = groupByUser
    ? rawUsers
        .map(user => ({
          user,
          endpoints: filteredRows.filter(r => r.user.id === user.id),
        }))
        .filter(g => g.endpoints.length > 0)
    : [];

  const COLS = ['USER', 'ENDPOINT', 'GROUPS', 'LAST LOGIN', 'INSTALLED APPS', ''];

  const AppBadges = ({ apps }: { apps: string[] }) => (
    <div className="flex items-center gap-1 flex-wrap">
      {apps.length > 0
        ? apps.map(app => (
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
  );

  const GroupBadges = ({ groups }: { groups: string[] }) => (
    <div className="flex items-center gap-1 flex-wrap">
      {groups.length > 0
        ? groups.map(g => (
            <span
              key={g}
              className="inline-flex items-center leading-tight"
              style={{ padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#ececf0', color: '#717182', border: '1px solid rgba(0,0,0,0.1)' }}
            >
              {g}
            </span>
          ))
        : <span style={{ color: '#717182' }}>—</span>
      }
    </div>
  );

  return (
    <div
      className="bg-white rounded-[16px] overflow-visible"
      style={{ border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}
      >
        {/* Search */}
        <div className="relative flex-1 max-w-[250px]">
          <Search
            className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#717182]"
            style={{ width: 16, height: 16 }}
          />
          <input
            type="search"
            placeholder="Search endpoints or users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white text-[#1a1a1a] placeholder-[#717182] text-[13px] rounded-[8px] pl-[36px] pr-4 outline-none transition-shadow"
            style={{ height: 36, border: '1px solid rgba(0,0,0,0.1)' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#0066cc'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,102,204,0.4)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Group-by filter dropdown */}
        <div className="relative flex-shrink-0" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(v => !v)}
            className="flex items-center gap-[6px] text-[13px] font-medium rounded-[8px] px-[12px] transition-colors"
            style={{
              height: 36,
              border: '1px solid rgba(0,0,0,0.1)',
              background: groupByUser ? '#eff6ff' : '#fff',
              color: groupByUser ? '#0066cc' : '#1a1a1a',
              cursor: 'pointer',
            }}
          >
            Group by
            <span
              className="font-semibold"
              style={{ color: groupByUser ? '#0066cc' : '#717182' }}
            >
              {groupByUser ? 'User' : 'None'}
            </span>
            <ChevronDown style={{ width: 14, height: 14, color: '#717182' }} />
          </button>

          {filterOpen && (
            <div
              className="absolute right-0 z-[50] rounded-[8px] py-1 min-w-[160px]"
              style={{ top: 42, background: '#fff', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
              {[{ label: 'No grouping', value: false }, { label: 'Group by user', value: true }].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => { setGroupByUser(opt.value); setFilterOpen(false); }}
                  className="flex items-center justify-between w-full px-4 py-2 text-[13px] text-[#1a1a1a] transition-colors"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#ececf0')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {opt.label}
                  {groupByUser === opt.value && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l3.5 3.5L12 3" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ background: '#ececf0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
            {COLS.map((col, i) => (
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
          {!groupByUser && (
            <>
              {filteredRows.map((row, idx) => {
                const isLast = idx === filteredRows.length - 1;
                return (
                  <tr
                    key={`${row.user.id}-${row.endpointName}-${idx}`}
                    className="transition-colors"
                    style={{ borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.07)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    {/* USER */}
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          <AvatarFallback className={`text-[11px] font-semibold text-white ${AVATAR_COLOR}`}>
                            {userInitials(row.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-[13px] text-[#1a1a1a] leading-snug">{row.user.name}</div>
                          <div className="text-[12px] leading-snug" style={{ color: '#717182' }}>{row.user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* ENDPOINT */}
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>
                      <EndpointLabel name={row.endpointName} />
                    </td>

                    {/* GROUPS */}
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>
                      <GroupBadges groups={row.user.groups || []} />
                    </td>

                    {/* LAST LOGIN */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#1a1a1a', whiteSpace: 'nowrap' }}>
                      {row.user.lastLogin || '—'}
                    </td>

                    {/* INSTALLED APPS */}
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>
                      <AppBadges apps={row.user.ucApps || []} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 8px 12px 0', width: 48 }}>
                      <RowMenu user={row.user} avatarColor={AVATAR_COLOR} />
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: '#717182' }}>
                    No endpoints found
                  </td>
                </tr>
              )}
            </>
          )}

          {groupByUser && (
            <>
              {userGroups.map((group) => (
                <React.Fragment key={group.user.id}>
                  {/* User header row */}
                  <tr style={{ background: '#f4f6f9', borderTop: '1px solid rgba(0,0,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <td colSpan={6} style={{ padding: '8px 16px' }}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          <AvatarFallback className={`text-[11px] font-semibold text-white ${AVATAR_COLOR}`}>
                            {userInitials(group.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-[13px] font-semibold text-[#1a1a1a]">{group.user.name}</span>
                          <span className="text-[12px] ml-[8px]" style={{ color: '#717182' }}>{group.user.email}</span>
                        </div>
                        <div className="flex items-center gap-1 ml-[4px]">
                          <GroupBadges groups={group.user.groups || []} />
                        </div>
                        <span className="ml-auto text-[11px] font-medium" style={{ color: '#717182' }}>
                          {group.endpoints.length} endpoint{group.endpoints.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Endpoint rows under this user */}
                  {group.endpoints.map((row, idx) => {
                    const isLast = idx === group.endpoints.length - 1;
                    return (
                      <tr
                        key={`${row.user.id}-${row.endpointName}-${idx}`}
                        className="transition-colors"
                        style={{ borderBottom: isLast ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(0,0,0,0.04)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                      >
                        {/* USER — empty; user shown once in the group header */}
                        <td style={{ padding: '11px 16px' }} />

                        {/* ENDPOINT — indented to show nesting under the user group */}
                        <td style={{ padding: '11px 16px 11px 36px', fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>
                          <EndpointLabel name={row.endpointName} />
                        </td>

                        {/* GROUPS — empty; groups are a user attribute shown in the group header */}
                        <td style={{ padding: '11px 16px' }} />

                        {/* LAST LOGIN */}
                        <td style={{ padding: '11px 16px', fontSize: 13, color: '#1a1a1a', whiteSpace: 'nowrap' }}>
                          {row.user.lastLogin || '—'}
                        </td>

                        {/* INSTALLED APPS */}
                        <td style={{ padding: '11px 16px', fontSize: 13 }}>
                          <AppBadges apps={row.user.ucApps || []} />
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '11px 8px 11px 0', width: 48 }}>
                          <RowMenu user={row.user} avatarColor={AVATAR_COLOR} />
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}

              {userGroups.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: '#717182' }}>
                    No endpoints found
                  </td>
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>

      {/* Footer */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '10px 20px', borderTop: '1px solid rgba(0,0,0,0.1)', fontSize: 13, color: '#717182' }}
      >
        <span>
          Showing {filteredRows.length} endpoint{filteredRows.length !== 1 ? 's' : ''} across {groupByUser ? userGroups.length : new Set(filteredRows.map(r => r.user.id)).size} user{(groupByUser ? userGroups.length : new Set(filteredRows.map(r => r.user.id)).size) !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
