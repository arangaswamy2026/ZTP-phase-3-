import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Search, X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

interface LogRow {
  id: number;
  dateTime: string;
  logId: number;
  priority: 'Alert' | 'Inform' | 'Warning' | 'Error';
  message: string;
}

const LOGS: LogRow[] = [
  { id: 1,  dateTime: '00:05:14 Mar 3', logId: 1781, priority: 'Alert',   message: 'Firmware Auto-Upgrade status : Update Server is not reachable' },
  { id: 2,  dateTime: '00:06:53 Mar 3', logId: 1799, priority: 'Inform',  message: 'No new firmware available' },
  { id: 3,  dateTime: '00:15:42 Mar 3', logId: 1804, priority: 'Inform',  message: 'System started successfully' },
  { id: 4,  dateTime: '01:00:01 Mar 3', logId: 1812, priority: 'Inform',  message: 'Scheduled firmware check initiated' },
  { id: 5,  dateTime: '01:00:03 Mar 3', logId: 1813, priority: 'Inform',  message: 'No new firmware available' },
  { id: 6,  dateTime: '02:05:22 Mar 3', logId: 1820, priority: 'Warning', message: 'CPU utilization exceeded 80% threshold' },
  { id: 7,  dateTime: '02:07:11 Mar 3', logId: 1821, priority: 'Inform',  message: 'CPU utilization returned to normal' },
  { id: 8,  dateTime: '03:00:01 Mar 3', logId: 1835, priority: 'Inform',  message: 'Scheduled firmware check initiated' },
  { id: 9,  dateTime: '03:00:04 Mar 3', logId: 1836, priority: 'Alert',   message: 'Firmware Auto-Upgrade status : Update Server is not reachable' },
  { id: 10, dateTime: '04:12:09 Mar 3', logId: 1849, priority: 'Inform',  message: 'Tunnel re-established to ZTP cloud' },
  { id: 11, dateTime: '04:33:55 Mar 3', logId: 1853, priority: 'Warning', message: 'Memory utilization at 74%' },
  { id: 12, dateTime: '05:00:01 Mar 3', logId: 1861, priority: 'Inform',  message: 'Scheduled firmware check initiated' },
  { id: 13, dateTime: '05:00:02 Mar 3', logId: 1862, priority: 'Inform',  message: 'No new firmware available' },
  { id: 14, dateTime: '06:18:33 Mar 3', logId: 1874, priority: 'Error',   message: 'Tunnel disconnected — retrying in 30s' },
  { id: 15, dateTime: '06:18:48 Mar 3', logId: 1875, priority: 'Inform',  message: 'Tunnel reconnected successfully' },
  { id: 16, dateTime: '07:00:01 Mar 3', logId: 1882, priority: 'Inform',  message: 'Scheduled firmware check initiated' },
  { id: 17, dateTime: '07:00:03 Mar 3', logId: 1883, priority: 'Inform',  message: 'No new firmware available' },
  { id: 18, dateTime: '08:45:12 Mar 3', logId: 1895, priority: 'Warning', message: 'Disk usage at 68% on primary partition' },
  { id: 19, dateTime: '09:00:01 Mar 3', logId: 1901, priority: 'Inform',  message: 'Scheduled firmware check initiated' },
  { id: 20, dateTime: '09:00:06 Mar 3', logId: 1902, priority: 'Alert',   message: 'Firmware Auto-Upgrade status : Update Server is not reachable' },
];

const PRIORITY_CFG: Record<LogRow['priority'], { bg: string; color: string; icon: string }> = {
  Alert:   { bg: '#d4183d1a', color: '#d4183d', icon: '!' },
  Error:   { bg: '#d4183d1a', color: '#d4183d', icon: '✕' },
  Warning: { bg: '#d977061a', color: '#d97706', icon: '!' },
  Inform:  { bg: '#0066cc1a', color: '#0066cc', icon: 'i' },
};

export function SystemLogsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | LogRow['priority']>('all');

  const filtered = useMemo(() => LOGS.filter(r => {
    if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!r.message.toLowerCase().includes(q) && !String(r.logId).includes(q)) return false;
    }
    return true;
  }), [search, priorityFilter]);

  return (
    <div className="space-y-5 pb-10">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-[13px] font-medium text-[#0066cc] hover:text-[#0052a6] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <PageHeader
        title="System Logs"
        subtitle="Firmware and system event logs for ZTP Connector"
      />

      <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap px-5 py-3 border-b border-[rgba(0,0,0,0.08)]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#717182]" />
            <input
              type="search"
              placeholder="Search logs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ height: '32px', paddingLeft: '32px', paddingRight: '12px', width: '220px', fontSize: '13px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', background: '#f8f9fa', color: '#1a1a1a', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#0066cc'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,102,204,0.15)'; }}
              onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          <div className="relative">
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as typeof priorityFilter)}
              style={{ height: '32px', paddingLeft: '10px', paddingRight: '28px', fontSize: '13px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', background: '#ffffff', color: '#1a1a1a', outline: 'none', fontFamily: 'inherit', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="all">Priority</option>
              <option value="Alert">Alert</option>
              <option value="Error">Error</option>
              <option value="Warning">Warning</option>
              <option value="Inform">Inform</option>
            </select>
            <svg viewBox="0 0 10 6" width="10" height="6" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#717182' }}>
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>

          {priorityFilter !== 'all' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', height: '24px', padding: '0 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: '#d4183d1a', color: '#d4183d' }}>
              {priorityFilter}
              <button onClick={() => setPriorityFilter('all')} style={{ opacity: 0.7, lineHeight: 1, background: 'none', border: 'none', color: '#d4183d', cursor: 'pointer', padding: 0 }}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#ececf0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                {['Date & Time', 'ID', 'Priority', 'Message'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#717182', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '64px 16px', textAlign: 'center', fontSize: '13px', color: '#717182' }}>
                    No logs match the current filters.
                  </td>
                </tr>
              ) : filtered.map((row, i) => {
                const cfg = PRIORITY_CFG[row.priority];
                const isLast = i === filtered.length - 1;
                return (
                  <tr
                    key={row.id}
                    style={{ background: '#ffffff', borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.07)', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fa')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
                  >
                    <td style={{ padding: '11px 16px', verticalAlign: 'middle', fontSize: '13px', color: '#717182', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}>
                      {row.dateTime}
                    </td>
                    <td style={{ padding: '11px 16px', verticalAlign: 'middle', fontSize: '13px', color: '#1a1a1a', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}>
                      {row.logId}
                    </td>
                    <td style={{ padding: '11px 16px', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: cfg.color, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, flexShrink: 0 }}>
                          {cfg.icon}
                        </span>
                        {row.priority}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', verticalAlign: 'middle', fontSize: '13px', color: '#1a1a1a', lineHeight: '1.4' }}>
                      {row.message}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '10px 20px', background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <span style={{ fontSize: '13px', color: '#717182' }}>Showing {filtered.length} of {LOGS.length} entries</span>
        </div>
      </div>
    </div>
  );
}
