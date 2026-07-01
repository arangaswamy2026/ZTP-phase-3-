import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronRight } from 'lucide-react@0.487.0';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge, TablePanel, DataTable, THead, TH, TR, TD, TableFoot } from '../components/ds';

// ── Types ──────────────────────────────────────────────────────────────────────

type EntryResult = 'Success' | 'Failed';
type TimePeriod = '15d' | '7d' | 'yesterday';

interface LogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail?: string;
  actorRole: string;
  isSystem?: boolean;
  action: string;
  affectedObject: string;
  result: EntryResult;
  detail: {
    actionCategory: string;
    actorRole: string;
    orgScope: string;
    sourceRef: string;
    resultNote: string;
    extraKey?: string;
    extraValue?: string;
  };
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const LOG_ENTRIES: LogEntry[] = [
  {
    id: 'e1',
    timestamp: '2026-06-30 09:14:33',
    actorName: 'Dr. Maria Henderson',
    actorEmail: 'maria@riversidedental.com',
    actorRole: 'Super Admin',
    action: 'Config Change',
    affectedObject: 'Policy: "Block Adult Content / SIA"',
    result: 'Success',
    detail: { actionCategory: 'System Log · Policy Update', actorRole: 'UM Super Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'CSE System Log · evt #SL-99182 ↗', resultNote: 'Success' },
  },
  {
    id: 'e2',
    timestamp: '2026-06-30 08:52:11',
    actorName: 'Mark Stevens',
    actorEmail: 'mark@riversidedental.com',
    actorRole: 'Admin',
    action: 'Authentication',
    affectedObject: 'Console login (MFA)',
    result: 'Failed',
    detail: { actionCategory: 'Login / Session · MFA challenge failed', actorRole: 'Tenant / Org Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'NSM Change Report · row 11204 ↗', resultNote: 'Failed — invalid OTP' },
  },
  {
    id: 'e3',
    timestamp: '2026-06-30 08:30:00',
    actorName: 'System',
    actorRole: 'System',
    isSystem: true,
    action: 'Export / Audit Action',
    affectedObject: 'Scheduled log download (CSV)',
    result: 'Success',
    detail: { actionCategory: 'Log Download · 30-day CSV', actorRole: 'System', orgScope: 'All managed orgs (3)', sourceRef: 'NSM Log Downloads · job #DL-7741 ↗', resultNote: 'Success', extraKey: 'Note', extraValue: 'Export itself recorded as an audit entry' },
  },
  {
    id: 'e4',
    timestamp: '2026-06-30 07:44:05',
    actorName: 'Dr. Maria Henderson',
    actorEmail: 'maria@riversidedental.com',
    actorRole: 'Super Admin',
    action: 'Admin Audit Action',
    affectedObject: 'Trust Profile: enabled "Disk Encryption"',
    result: 'Success',
    detail: { actionCategory: 'System Log · Profile Modify', actorRole: 'UM Super Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'CSE System Log · evt #SL-99090 ↗', resultNote: 'Success' },
  },
  {
    id: 'e5',
    timestamp: '2026-06-29 22:18:44',
    actorName: 'Jessica Torres',
    actorEmail: 'jessica@riversidedental.com (deleted)',
    actorRole: 'Admin',
    action: 'Config Change',
    affectedObject: 'Connector: re-authorized ZT tunnel',
    result: 'Success',
    detail: { actionCategory: 'Change Report · Connector Update', actorRole: 'Tenant / Org Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'NSM Change Report · row 10980 ↗', resultNote: 'Success', extraKey: 'Note', extraValue: 'Actor identity preserved as captured at write time' },
  },
  {
    id: 'e6',
    timestamp: '2026-06-29 21:05:29',
    actorName: 'Mark Stevens',
    actorEmail: 'mark@riversidedental.com',
    actorRole: 'Admin',
    action: 'Authentication',
    affectedObject: 'Console login (MFA)',
    result: 'Success',
    detail: { actionCategory: 'Login / Session · MFA passed', actorRole: 'Tenant / Org Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'NSM Change Report · row 11187 ↗', resultNote: 'Success' },
  },
  {
    id: 'e7',
    timestamp: '2026-06-29 19:33:17',
    actorName: 'Dr. Maria Henderson',
    actorEmail: 'maria@riversidedental.com',
    actorRole: 'Super Admin',
    action: 'Config Change',
    affectedObject: 'Zone Policy: updated "Guest to Employee" rules',
    result: 'Success',
    detail: { actionCategory: 'Change Report · Policy Update', actorRole: 'UM Super Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'CSE System Log · evt #SL-98941 ↗', resultNote: 'Success' },
  },
  {
    id: 'e8',
    timestamp: '2026-06-29 17:10:02',
    actorName: 'System',
    actorRole: 'System',
    isSystem: true,
    action: 'Admin Audit Action',
    affectedObject: 'Certificate rotation — TLS wildcard',
    result: 'Success',
    detail: { actionCategory: 'System Log · Certificate Lifecycle', actorRole: 'System', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'CSE System Log · evt #SL-98900 ↗', resultNote: 'Success', extraKey: 'Note', extraValue: 'Auto-renewal triggered 30 days before expiry' },
  },
  {
    id: 'e9',
    timestamp: '2026-06-29 15:48:55',
    actorName: 'Mark Stevens',
    actorEmail: 'mark@riversidedental.com',
    actorRole: 'Admin',
    action: 'Config Change',
    affectedObject: 'User: added "priya@riversidedental.com"',
    result: 'Success',
    detail: { actionCategory: 'Change Report · User Provisioning', actorRole: 'Tenant / Org Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'NSM Change Report · row 11150 ↗', resultNote: 'Success' },
  },
  {
    id: 'e10',
    timestamp: '2026-06-29 14:22:40',
    actorName: 'Dr. Maria Henderson',
    actorEmail: 'maria@riversidedental.com',
    actorRole: 'Super Admin',
    action: 'Export / Audit Action',
    affectedObject: 'Compliance report export (PDF)',
    result: 'Success',
    detail: { actionCategory: 'Log Download · Compliance PDF', actorRole: 'UM Super Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'NSM Log Downloads · job #DL-7698 ↗', resultNote: 'Success' },
  },
  {
    id: 'e11',
    timestamp: '2026-06-29 12:07:18',
    actorName: 'Mark Stevens',
    actorEmail: 'mark@riversidedental.com',
    actorRole: 'Admin',
    action: 'Authentication',
    affectedObject: 'Console login (MFA)',
    result: 'Failed',
    detail: { actionCategory: 'Login / Session · MFA challenge failed', actorRole: 'Tenant / Org Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'NSM Change Report · row 11098 ↗', resultNote: 'Failed — OTP expired' },
  },
  {
    id: 'e12',
    timestamp: '2026-06-29 11:55:03',
    actorName: 'Mark Stevens',
    actorEmail: 'mark@riversidedental.com',
    actorRole: 'Admin',
    action: 'Authentication',
    affectedObject: 'Console login (MFA)',
    result: 'Success',
    detail: { actionCategory: 'Login / Session · MFA passed', actorRole: 'Tenant / Org Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'NSM Change Report · row 11099 ↗', resultNote: 'Success' },
  },
  {
    id: 'e13',
    timestamp: '2026-06-29 10:30:47',
    actorName: 'Dr. Maria Henderson',
    actorEmail: 'maria@riversidedental.com',
    actorRole: 'Super Admin',
    action: 'Admin Audit Action',
    affectedObject: 'Internet Policy: blocked "Social Media" category',
    result: 'Success',
    detail: { actionCategory: 'System Log · Policy Update', actorRole: 'UM Super Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'CSE System Log · evt #SL-98812 ↗', resultNote: 'Success' },
  },
  {
    id: 'e14',
    timestamp: '2026-06-28 23:59:01',
    actorName: 'System',
    actorRole: 'System',
    isSystem: true,
    action: 'Export / Audit Action',
    affectedObject: 'Scheduled log download (CSV)',
    result: 'Success',
    detail: { actionCategory: 'Log Download · Daily CSV', actorRole: 'System', orgScope: 'All managed orgs (3)', sourceRef: 'NSM Log Downloads · job #DL-7690 ↗', resultNote: 'Success', extraKey: 'Note', extraValue: 'Nightly scheduled export completed successfully' },
  },
  {
    id: 'e15',
    timestamp: '2026-06-28 18:14:22',
    actorName: 'Dr. Maria Henderson',
    actorEmail: 'maria@riversidedental.com',
    actorRole: 'Super Admin',
    action: 'Config Change',
    affectedObject: 'Connector: updated allowed IP ranges',
    result: 'Success',
    detail: { actionCategory: 'Change Report · Connector Update', actorRole: 'UM Super Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'NSM Change Report · row 11055 ↗', resultNote: 'Success' },
  },
  {
    id: 'e16',
    timestamp: '2026-06-28 16:40:09',
    actorName: 'Mark Stevens',
    actorEmail: 'mark@riversidedental.com',
    actorRole: 'Admin',
    action: 'Config Change',
    affectedObject: 'Profile: removed "USB Storage" restriction',
    result: 'Failed',
    detail: { actionCategory: 'System Log · Profile Modify', actorRole: 'Tenant / Org Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'CSE System Log · evt #SL-98744 ↗', resultNote: 'Failed — insufficient privileges' },
  },
  {
    id: 'e17',
    timestamp: '2026-06-28 14:02:58',
    actorName: 'Dr. Maria Henderson',
    actorEmail: 'maria@riversidedental.com',
    actorRole: 'Super Admin',
    action: 'Admin Audit Action',
    affectedObject: 'User: revoked session for "mark@riversidedental.com"',
    result: 'Success',
    detail: { actionCategory: 'Change Report · Session Management', actorRole: 'UM Super Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'NSM Change Report · row 11020 ↗', resultNote: 'Success' },
  },
  {
    id: 'e18',
    timestamp: '2026-06-28 11:27:34',
    actorName: 'System',
    actorRole: 'System',
    isSystem: true,
    action: 'Admin Audit Action',
    affectedObject: 'IDP sync — Azure AD (1,204 users)',
    result: 'Success',
    detail: { actionCategory: 'System Log · IDP Sync', actorRole: 'System', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'CSE System Log · evt #SL-98700 ↗', resultNote: 'Success', extraKey: 'Note', extraValue: '1,204 users synced, 2 deprovisioned' },
  },
  {
    id: 'e19',
    timestamp: '2026-06-28 09:11:50',
    actorName: 'Dr. Maria Henderson',
    actorEmail: 'maria@riversidedental.com',
    actorRole: 'Super Admin',
    action: 'Config Change',
    affectedObject: 'Private Access Policy: added "Dentrix" application',
    result: 'Success',
    detail: { actionCategory: 'Change Report · Policy Update', actorRole: 'UM Super Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'NSM Change Report · row 10995 ↗', resultNote: 'Success' },
  },
  {
    id: 'e20',
    timestamp: '2026-06-27 20:45:16',
    actorName: 'Mark Stevens',
    actorEmail: 'mark@riversidedental.com',
    actorRole: 'Admin',
    action: 'Authentication',
    affectedObject: 'Console login (Password)',
    result: 'Failed',
    detail: { actionCategory: 'Login / Session · Invalid credentials', actorRole: 'Tenant / Org Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'NSM Change Report · row 10960 ↗', resultNote: 'Failed — account locked after 3 attempts' },
  },
  {
    id: 'e21',
    timestamp: '2026-06-27 18:30:00',
    actorName: 'System',
    actorRole: 'System',
    isSystem: true,
    action: 'Export / Audit Action',
    affectedObject: 'Scheduled log download (CSV)',
    result: 'Success',
    detail: { actionCategory: 'Log Download · Daily CSV', actorRole: 'System', orgScope: 'All managed orgs (3)', sourceRef: 'NSM Log Downloads · job #DL-7655 ↗', resultNote: 'Success' },
  },
  {
    id: 'e22',
    timestamp: '2026-06-27 15:18:42',
    actorName: 'Dr. Maria Henderson',
    actorEmail: 'maria@riversidedental.com',
    actorRole: 'Super Admin',
    action: 'Config Change',
    affectedObject: 'Trust Profile: set MFA enforcement to "Always"',
    result: 'Success',
    detail: { actionCategory: 'System Log · Profile Modify', actorRole: 'UM Super Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'CSE System Log · evt #SL-98610 ↗', resultNote: 'Success' },
  },
  {
    id: 'e23',
    timestamp: '2026-06-27 13:05:29',
    actorName: 'Mark Stevens',
    actorEmail: 'mark@riversidedental.com',
    actorRole: 'Admin',
    action: 'Admin Audit Action',
    affectedObject: 'Downloaded endpoint posture report',
    result: 'Success',
    detail: { actionCategory: 'Log Download · Posture Report', actorRole: 'Tenant / Org Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'NSM Log Downloads · job #DL-7640 ↗', resultNote: 'Success' },
  },
  {
    id: 'e24',
    timestamp: '2026-06-27 10:51:07',
    actorName: 'Dr. Maria Henderson',
    actorEmail: 'maria@riversidedental.com',
    actorRole: 'Super Admin',
    action: 'Config Change',
    affectedObject: 'Zone Policy: created "Contractor Zone"',
    result: 'Success',
    detail: { actionCategory: 'Change Report · Policy Create', actorRole: 'UM Super Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'NSM Change Report · row 10902 ↗', resultNote: 'Success' },
  },
  {
    id: 'e25',
    timestamp: '2026-06-26 22:00:00',
    actorName: 'System',
    actorRole: 'System',
    isSystem: true,
    action: 'Export / Audit Action',
    affectedObject: 'Scheduled log download (CSV)',
    result: 'Success',
    detail: { actionCategory: 'Log Download · Daily CSV', actorRole: 'System', orgScope: 'All managed orgs (3)', sourceRef: 'NSM Log Downloads · job #DL-7621 ↗', resultNote: 'Success' },
  },
  {
    id: 'e26',
    timestamp: '2026-06-26 17:39:14',
    actorName: 'Mark Stevens',
    actorEmail: 'mark@riversidedental.com',
    actorRole: 'Admin',
    action: 'Config Change',
    affectedObject: 'User: updated role for "dana@riversidedental.com" to Read-Only',
    result: 'Success',
    detail: { actionCategory: 'Change Report · User Modify', actorRole: 'Tenant / Org Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'NSM Change Report · row 10871 ↗', resultNote: 'Success' },
  },
  {
    id: 'e27',
    timestamp: '2026-06-26 14:22:58',
    actorName: 'Dr. Maria Henderson',
    actorEmail: 'maria@riversidedental.com',
    actorRole: 'Super Admin',
    action: 'Admin Audit Action',
    affectedObject: 'Connector: firmware upgrade initiated (ZTOS 1.0.0.1284)',
    result: 'Success',
    detail: { actionCategory: 'Change Report · Firmware Update', actorRole: 'UM Super Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'NSM Change Report · row 10845 ↗', resultNote: 'Success', extraKey: 'Note', extraValue: 'Upgrade completed in maintenance window' },
  },
  {
    id: 'e28',
    timestamp: '2026-06-26 11:08:31',
    actorName: 'System',
    actorRole: 'System',
    isSystem: true,
    action: 'Admin Audit Action',
    affectedObject: 'IDP sync — Azure AD (1,201 users)',
    result: 'Failed',
    detail: { actionCategory: 'System Log · IDP Sync', actorRole: 'System', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'CSE System Log · evt #SL-98511 ↗', resultNote: 'Failed — Azure AD token expired', extraKey: 'Note', extraValue: 'Sync retried and succeeded at 11:24 UTC' },
  },
  {
    id: 'e29',
    timestamp: '2026-06-26 09:47:19',
    actorName: 'Dr. Maria Henderson',
    actorEmail: 'maria@riversidedental.com',
    actorRole: 'Super Admin',
    action: 'Config Change',
    affectedObject: 'Internet Policy: updated DNS filtering rules',
    result: 'Success',
    detail: { actionCategory: 'Change Report · Policy Update', actorRole: 'UM Super Admin', orgScope: 'Riverside Dental Office (org-4821)', sourceRef: 'NSM Change Report · row 10810 ↗', resultNote: 'Success' },
  },
  {
    id: 'e30',
    timestamp: '2026-06-25 16:30:00',
    actorName: 'System',
    actorRole: 'System',
    isSystem: true,
    action: 'Export / Audit Action',
    affectedObject: 'Scheduled log download (CSV)',
    result: 'Success',
    detail: { actionCategory: 'Log Download · Daily CSV', actorRole: 'System', orgScope: 'All managed orgs (3)', sourceRef: 'NSM Log Downloads · job #DL-7598 ↗', resultNote: 'Success' },
  },
];

const ACTOR_NAMES = ['Dr. Maria Henderson', 'Mark Stevens', 'Jessica Torres', 'System'];
const ACTION_TYPES = ['Admin Audit Action', 'Config Change', 'Authentication', 'Export / Audit Action'];

// ── Sub-components ─────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.04em] text-muted-foreground bg-muted px-1.5 py-px rounded-[4px] align-middle">
      {role}
    </span>
  );
}

function ChevronCell({ open }: { open: boolean }) {
  return (
    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-150 ${open ? 'rotate-90' : ''}`} />
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function ActivityPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('15d');
  const [userFilter, setUserFilter] = useState('any');
  const [actionFilter, setActionFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');

  const filtered = useMemo(() => {
    return LOG_ENTRIES.filter((e) => {
      if (search) {
        const q = search.toLowerCase();
        const hit =
          e.actorName.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          e.affectedObject.toLowerCase().includes(q) ||
          (e.actorEmail?.toLowerCase().includes(q) ?? false);
        if (!hit) return false;
      }
      if (userFilter !== 'any' && e.actorName !== userFilter) return false;
      if (actionFilter !== 'all' && e.action !== actionFilter) return false;
      if (resultFilter !== 'all' && e.result !== resultFilter) return false;
      return true;
    });
  }, [search, userFilter, actionFilter, resultFilter]);

  const chevronSvg = (
    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#717182]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
  );

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Audit Log"
        subtitle="Consolidated administrator audit trail — every config change, access decision, authentication, and export action."
      />

      {/* Toolbar — all filters on one row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#717182] pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="h-[36px] pl-8 pr-3 w-64 text-[13px] text-[#1a1a1a] border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white focus:outline-none focus:outline-2 focus:outline-[#0066cc] focus:outline-offset-[1px] focus:border-[#0066cc] placeholder:text-[#717182]"
          />
        </div>

        {/* Vertical divider */}
        <div className="w-px h-[22px] bg-[rgba(0,0,0,0.1)] shrink-0" />

        {/* Time period */}
        <div className="relative">
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
            className="h-[36px] pl-3 pr-8 text-[13px] text-[#1a1a1a] border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white cursor-pointer appearance-none focus:outline-none focus:outline-2 focus:outline-[#0066cc]"
          >
            <option value="15d">Last 15 days</option>
            <option value="7d">Last 7 days</option>
            <option value="yesterday">Yesterday</option>
          </select>
          {chevronSvg}
        </div>

        {/* User filter */}
        <div className="relative">
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="h-[36px] pl-3 pr-8 text-[13px] text-[#1a1a1a] border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white cursor-pointer appearance-none focus:outline-none focus:outline-2 focus:outline-[#0066cc]"
          >
            <option value="any">User: All</option>
            {ACTOR_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          {chevronSvg}
        </div>

        {/* Action filter */}
        <div className="relative">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-[36px] pl-3 pr-8 text-[13px] text-[#1a1a1a] border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white cursor-pointer appearance-none focus:outline-none focus:outline-2 focus:outline-[#0066cc]"
          >
            <option value="all">Action: All</option>
            {ACTION_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          {chevronSvg}
        </div>

        {/* Result filter */}
        <div className="relative">
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="h-[36px] pl-3 pr-8 text-[13px] text-[#1a1a1a] border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white cursor-pointer appearance-none focus:outline-none focus:outline-2 focus:outline-[#0066cc]"
          >
            <option value="all">Result: All</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
          </select>
          {chevronSvg}
        </div>

        {/* Export CSV — pushed to the right */}
        <button className="ml-auto h-[36px] px-4 flex items-center gap-2 text-[13px] font-bold text-white bg-[#0066cc] hover:bg-[#0052a6] rounded-[8px] transition-colors shrink-0">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Entry count line */}
      <div className="text-[13px] text-muted-foreground">
        Sorted by timestamp ↓ · UTC · {filtered.length} of {LOG_ENTRIES.length} entries
      </div>

      {/* Table */}
      <TablePanel>
        <DataTable>
          <THead>
            <tr>
              <TH className="w-8 px-3" />
              <TH>Timestamp (UTC)</TH>
              <TH>User</TH>
              <TH>Action</TH>
              <TH>Affected Object</TH>
              <TH>Result</TH>
            </tr>
          </THead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-[13px] text-muted-foreground text-center">
                  No entries match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => {
                const isOpen = openId === entry.id;
                const detailFields: [string, string][] = [
                  ['Action Category', entry.detail.actionCategory],
                  ['Actor Role',      entry.detail.actorRole],
                  ['Org Scope',       entry.detail.orgScope],
                  ['Source Reference',entry.detail.sourceRef],
                  ['Result',          entry.detail.resultNote],
                  ...(entry.detail.extraKey
                    ? [[entry.detail.extraKey, entry.detail.extraValue!] as [string, string]]
                    : []),
                ];
                return (
                  <React.Fragment key={entry.id}>
                    <TR
                      className="cursor-pointer"
                      onClick={() => setOpenId(isOpen ? null : entry.id)}
                    >
                      <TD className="px-3 w-8">
                        <ChevronCell open={isOpen} />
                      </TD>
                      <TD className="tabular-nums whitespace-nowrap text-muted-foreground">
                        {entry.timestamp}
                      </TD>
                      <TD>
                        {entry.isSystem ? (
                          <span className="text-[13px] text-muted-foreground">System</span>
                        ) : (
                          <div className="flex flex-col leading-snug">
                            <span className="text-[13px] text-foreground ">{entry.actorName}</span>
                            {entry.actorEmail && (
                              <span className="text-[11px] text-muted-foreground">{entry.actorEmail}</span>
                            )}
                          </div>
                        )}
                      </TD>
                      <TD>
                        <span className="text-[13px] text-foreground">{entry.action}</span>
                        <RoleBadge role={entry.actorRole} />
                      </TD>
                      <TD className="text-foreground">{entry.affectedObject}</TD>
                      <TD>
                        <StatusBadge variant={entry.result === 'Success' ? 'success' : 'error'} dot>
                          {entry.result}
                        </StatusBadge>
                      </TD>
                    </TR>

                    {isOpen && (
                      <tr className="border-b border-border bg-muted/30">
                        <td colSpan={6}>
                          <div className="px-11 py-4 grid grid-cols-2 gap-x-10 gap-y-2.5">
                            {detailFields.map(([key, val]) => (
                              <div key={key} className="flex gap-2.5">
                                <span className="min-w-[140px] text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground shrink-0 pt-px">
                                  {key}
                                </span>
                                <span className={`text-[13px] text-foreground ${key === 'Source Reference' ? 'text-action cursor-pointer hover:underline' : ''}`}>
                                  {val}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </DataTable>

        <TableFoot>
          <span>Showing 1–{filtered.length} of {LOG_ENTRIES.length} entries</span>
          <div className="flex gap-1.5">
            {(['‹', '1', '2', '3', '4', '›'] as const).map((p, i) => (
              <button
                key={i}
                className={`h-[28px] min-w-[28px] px-2 text-[13px] border rounded-[6px] transition-colors ${
                  p === '1'
                    ? 'bg-action text-white border-action'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </TableFoot>
      </TablePanel>
    </div>
  );
}
