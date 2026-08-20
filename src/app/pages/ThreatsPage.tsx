import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { MoreHorizontal, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { SeverityChip, StatusBadge, DataTable, THead, TH, TR, TD, TablePanel, TableFoot } from '../components/ds';

const FUNNEL_STAGES = [
  { name: 'Blocked at Domain',      short: 'Domain',      count: 1072, pct: '72.1%', color: '#8ba3c7' },
  { name: 'Blocked at Web Address', short: 'Web Address', count: 355,  pct: '23.9%', color: '#60a5fa' },
  { name: 'Blocked at File',        short: 'File',        count: 46,   pct: '3.1%',  color: '#a78bfa' },
  { name: 'Reached Device',         short: 'Device',      count: 13,   pct: '0.87%', color: '#f87171' },
];

function TrafficFunnelChart() {
  const TOTAL = 1486;
  const SEG_W = 185;
  const CHART_H = 160;
  const CY = CHART_H / 2;
  const PAD_X = 20;
  const LABEL_H = 130;
  const W = FUNNEL_STAGES.length * SEG_W + PAD_X * 2;
  const VH = CHART_H + LABEL_H;

  // Height at each boundary = remaining (passed-through) traffic / total
  const passed = [1486, 414, 59, 13, 0];
  const boundH = passed.map(p => Math.max((p / TOTAL) * CHART_H, 1.5));

  return (
    <svg viewBox={`0 0 ${W} ${VH}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {FUNNEL_STAGES.map((s, i) => {
        const x1 = PAD_X + i * SEG_W;
        const x2 = PAD_X + (i + 1) * SEG_W;
        const h1 = boundH[i], h2 = boundH[i + 1];
        const d = `M${x1},${CY - h1 / 2} L${x2},${CY - h2 / 2} L${x2},${CY + h2 / 2} L${x1},${CY + h1 / 2}Z`;
        const tickTopY = CY + h2 / 2;
        const labelY = CHART_H + 14;
        return (
          <g key={s.name}>
            <path d={d} fill={s.color} />
            <line x1={x2} y1={tickTopY} x2={x2} y2={labelY - 2} stroke="#d1d5db" strokeWidth="1" />
            <text
              x={x2}
              y={labelY}
              transform={`rotate(-45, ${x2}, ${labelY})`}
              textAnchor="end"
              fontSize="10.5"
              fontFamily="Inter, system-ui, sans-serif"
              fill="#717182"
            >
              {`${s.short}: ${s.pct}`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const THREAT_PIE = [
  { name: 'Phishing',                    value: 412, color: '#d97706' },
  { name: 'Dangerous Config / History',  value: 340, color: '#f59e0b' },
  { name: 'Spam / Ad Fraud / Spyware',  value: 171, color: '#fbbf24' },
  { name: 'Dangerous 3rd Party Infra',  value: 141, color: '#92400e' },
  { name: 'Risky DNS Transactions',      value: 126, color: '#ca8a04' },
  { name: 'Other / Community Intel',    value: 93,  color: '#9ca3af' },
  { name: 'Malware & Ransomware',        value: 89,  color: '#c8102e' },
  { name: 'New Domains',                 value: 67,  color: '#fb923c' },
  { name: 'Malware C2',                  value: 29,  color: '#7f1d1d' },
];

const STYLES = `
.thr-opt2{display:flex;flex-direction:column;gap:18px;padding-bottom:40px;max-width:1200px;width:100%;--navy:#001b50;--blue:#0066cc;--ink:#1a1a1a;--muted:#717182;--line:rgba(0,0,0,.1);--red:#d4183d;--surface:#fff;--subtle:#ececf0;--bg:#f8f9fa;--success:#16a34a;--warning:#d97706;--shadow-sm:0 1px 2px rgba(0,0,0,.06);--shadow-md:0 4px 12px rgba(0,0,0,.08)}
.thr-opt2 .page-heading{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.thr-opt2 .page-h1{font-size:1.5rem;font-weight:700;letter-spacing:-.0036em;color:#1a1a1a}
.thr-opt2 .page-tenant-badge{font-size:0.6875rem;font-weight:600;padding:3px 10px;border-radius:0.5rem;background:#0066cc1a;color:#0066cc;border:1px solid rgba(0,102,204,.2)}
.thr-opt2 .page-sub{font-size:0.8125rem;color:#717182;width:100%;margin-top:2px;line-height:1.5}
.thr-opt2 .flow-card{background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:1rem;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.thr-opt2 .flow-head{display:flex;align-items:center;gap:10px;padding:14px 20px;border-bottom:1px solid rgba(0,0,0,.1)}
.thr-opt2 .flow-title{font-size:1rem;font-weight:600;color:#1a1a1a}
.thr-opt2 .flow-sub{font-size:0.8125rem;color:#717182}
.thr-opt2 .flow-body{padding:20px 24px;display:flex;align-items:center}
.thr-opt2 .flow-origin{display:flex;flex-direction:column;align-items:center;padding:14px 18px;min-width:100px;flex-shrink:0}
.thr-opt2 .fo-num{font-size:28px;font-weight:700;color:#1a1a1a;letter-spacing:-.025em;line-height:1}
.thr-opt2 .fo-lbl{font-size:0.6875rem;font-weight:600;color:#717182;text-align:center;margin-top:5px;line-height:1.4}
.thr-opt2 .flow-connector{display:flex;flex-direction:column;align-items:center;flex-shrink:0;padding:0 6px}
.thr-opt2 .fc-arrow{font-size:18px;color:#d1d5db;line-height:1}
.thr-opt2 .fc-pass{font-size:0.6875rem;color:#717182;white-space:nowrap;margin-top:3px;text-align:center;line-height:1.4}
.thr-opt2 .flow-stage{flex:1;border-radius:0.75rem;padding:14px 16px;display:flex;flex-direction:column;align-items:center;border:1.5px solid;text-align:center;min-width:0}
.thr-opt2 .flow-stage.s1{background:#e8eef7;border-color:#b4c9e8}
.thr-opt2 .flow-stage.s2{background:#dbeafe;border-color:#93c5fd}
.thr-opt2 .flow-stage.s3{background:#ede9fe;border-color:#c4b5fd}
.thr-opt2 .flow-stage.s4{background:#fff0f0;border-color:#fca5a5}
.thr-opt2 .fs-icon{width:28px;height:28px;border-radius:0.5rem;margin-bottom:8px;flex-shrink:0}
.thr-opt2 .s1 .fs-icon{background:#8ba3c7}
.thr-opt2 .s2 .fs-icon{background:#60a5fa}
.thr-opt2 .s3 .fs-icon{background:#a78bfa}
.thr-opt2 .s4 .fs-icon{background:#fca5a5}
.thr-opt2 .fs-num{font-size:22px;font-weight:700;letter-spacing:-.02em;line-height:1}
.thr-opt2 .s1 .fs-num,.thr-opt2 .s2 .fs-num{color:#1e3a5f}
.thr-opt2 .s3 .fs-num{color:#4c1d95}
.thr-opt2 .s4 .fs-num{color:#d4183d}
.thr-opt2 .fs-lbl{font-size:0.6875rem;font-weight:600;margin-top:4px;line-height:1.4}
.thr-opt2 .s1 .fs-lbl,.thr-opt2 .s2 .fs-lbl{color:#3f5f8f}
.thr-opt2 .s3 .fs-lbl{color:#5b21b6}
.thr-opt2 .s4 .fs-lbl{color:#d4183d}
.thr-opt2 .fs-pct{font-size:0.6875rem;font-weight:600;margin-top:5px;padding:2px 8px;border-radius:9999px}
.thr-opt2 .s1 .fs-pct,.thr-opt2 .s2 .fs-pct{background:#c8d8ee;color:#1e3a5f}
.thr-opt2 .s3 .fs-pct{background:#ddd6fe;color:#4c1d95}
.thr-opt2 .s4 .fs-pct{background:#fee2e2;color:#d4183d}
.thr-opt2 .fs-sub{font-size:0.6875rem;color:#717182;margin-top:4px}
.thr-opt2 .flow-footer{display:flex;align-items:center;gap:6px;padding:10px 20px;background:#f8f9fa;border-top:1px solid rgba(0,0,0,.1);font-size:0.6875rem;color:#717182}
.thr-opt2 .flow-legend{display:flex;align-items:center;gap:14px;margin-left:auto}
.thr-opt2 .fl-item{display:flex;align-items:center;gap:5px;font-size:0.6875rem;font-weight:600}
.thr-opt2 .fl-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.thr-opt2 .insights-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:14px}
.thr-opt2 .ins-card{background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:1rem;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.thr-opt2 .ins-head{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid rgba(0,0,0,.1)}
.thr-opt2 .ins-title{font-size:1rem;font-weight:600;color:#1a1a1a}
.thr-opt2 .ins-meta{font-size:0.6875rem;color:#717182}
.thr-opt2 .ins-body{padding:14px 18px}
.thr-opt2 .dev-row{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.06)}
.thr-opt2 .dev-row:last-child{border-bottom:none}
.thr-opt2 .dev-icon{width:28px;height:28px;border-radius:0.5rem;background:#e8eef7;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.thr-opt2 .dev-icon-dot{width:10px;height:10px;border-radius:2px;background:#8ba3c7}
.thr-opt2 .dev-name{font-size:0.6875rem;font-weight:600;color:#1a1a1a;line-height:1.3;font-family:ui-monospace,'SF Mono',Menlo,monospace}
.thr-opt2 .dev-user{font-size:0.6875rem;color:#717182}
.thr-opt2 .dev-right{margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0}
.thr-opt2 .dev-count{font-size:0.6875rem;font-weight:600;color:#1a1a1a}
.thr-opt2 .dev-state{font-size:0.6875rem;font-weight:600;padding:2px 8px;border-radius:9999px;white-space:nowrap}
.thr-opt2 .ds-alert{background:#d4183d1a;color:#d4183d}
.thr-opt2 .ds-ok{background:#16a34a1a;color:#16a34a}
.thr-opt2 .ds-quar{background:#0066cc1a;color:#0066cc}
.thr-opt2 .section-head{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;row-gap:6px}
.thr-opt2 .sec-h2{font-size:1.125rem;font-weight:700;color:#1a1a1a}
.thr-opt2 .sec-badge{font-size:0.6875rem;font-weight:600;padding:3px 10px;border-radius:0.5rem;background:#ececf0;border:1px solid rgba(0,0,0,.1);color:#717182}
.thr-opt2 .sec-badge.red{background:#d4183d1a;border-color:rgba(212,24,61,.2);color:#d4183d}
.thr-opt2 .o2card{background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:1rem;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.thr-opt2 .filters{display:flex;gap:6px;flex-wrap:wrap}
.thr-opt2 .fchip{font-size:0.6875rem;font-weight:600;padding:4px 11px;border-radius:9999px;border:1px solid rgba(0,0,0,.1);color:#717182;background:#fff;white-space:nowrap;cursor:pointer}
.thr-opt2 .fchip.on{background:#001b50;border-color:#001b50;color:#fff}
.thr-opt2 .bulk-actions{margin-left:auto;display:flex;gap:6px}
.thr-opt2 .xbtn{font-family:inherit;font-size:0.8125rem;font-weight:600;height:36px;padding:0 1rem;border-radius:0.5rem;border:1px solid rgba(0,0,0,.1);background:#fff;color:#1a1a1a;cursor:pointer;display:inline-flex;align-items:center}
.thr-opt2 .xbtn.primary{background:#0066cc;border-color:#0066cc;color:#fff}
.thr-opt2 .xbtn.danger{background:#d4183d1a;border-color:rgba(212,24,61,.25);color:#d4183d}
.thr-opt2 table{width:100%;border-collapse:collapse}
.thr-opt2 thead th{padding:10px 16px;text-align:left;font-size:0.6875rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#717182;background:#ececf0;border-bottom:1px solid rgba(0,0,0,.1);white-space:nowrap}
.thr-opt2 tbody td{padding:12px 16px;font-size:0.8125rem;color:#1a1a1a;border-bottom:1px solid rgba(0,0,0,.06);vertical-align:middle}
.thr-opt2 tbody tr:last-child td{border-bottom:none}
.thr-opt2 tbody tr.hot{background:#fff8f8}
.thr-opt2 tbody tr:hover td{background:#ececf0}
.thr-opt2 tbody tr.hot:hover td{background:#fee2e2}
.thr-opt2 .xcb{width:16px;height:16px;border:1px solid rgba(0,0,0,.2);border-radius:4px;display:inline-block;vertical-align:middle;margin-right:4px}
.thr-opt2 .xcb.on{background:#001b50;border-color:#001b50}
.thr-opt2 .inc-name{font-size:0.8125rem;font-weight:600;color:#0066cc}
.thr-opt2 .inc-ctx{font-size:0.6875rem;color:#717182;margin-top:2px}
.thr-opt2 .grp{display:inline-flex;align-items:center;font-size:0.6875rem;font-weight:600;padding:1.5px 6px;border-radius:0.25rem;background:#ececf0;color:#717182;margin-left:5px;vertical-align:middle}
.thr-opt2 .age{font-size:0.8125rem;color:#717182}
.thr-opt2 .xmono{font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:0.6875rem;color:#717182}
.thr-opt2 .u-cell{display:flex;align-items:center;gap:8px}
.thr-opt2 .u-av-sm{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0}
.thr-opt2 .u-name-sm{font-size:0.8125rem;font-weight:500;color:#1a1a1a}
.thr-opt2 .tier{display:inline-flex;align-items:center;gap:5px;font-size:0.6875rem;font-weight:600;padding:3px 8px;border-radius:0.5rem;white-space:nowrap;border-width:1px;border-style:solid}
.thr-opt2 .t4{background:#fee2e2;color:#ef4444;border-color:rgba(239,68,68,.25)}
.thr-opt2 .t3{background:#ede9fe;color:#7c3aed;border-color:rgba(124,58,237,.25)}
.thr-opt2 .t2{background:#dbeafe;color:#2563eb;border-color:rgba(37,99,235,.25)}
.thr-opt2 .t1{background:#e8eef7;color:#3f5f8f;border-color:#b4c9e8}
.thr-opt2 .tierdot{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.7;flex-shrink:0}
.thr-opt2 .xstate{display:inline-flex;font-size:0.6875rem;font-weight:600;padding:3px 8px;border-radius:0.5rem;white-space:nowrap;border-width:1px;border-style:solid}
.thr-opt2 .s-wait{background:#d977061a;color:#d97706;border-color:rgba(217,119,6,.25)}
.thr-opt2 .s-mit{background:#16a34a1a;color:#16a34a;border-color:rgba(22,163,74,.25)}
.thr-opt2 .s-kill{background:#16a34a1a;color:#16a34a;border-color:rgba(22,163,74,.25)}
.thr-opt2 .sev-chip{display:inline-flex;font-size:0.6875rem;font-weight:600;padding:2px 8px;border-radius:0.5rem;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
.thr-opt2 .sc-crit{background:#fee2e2;color:#ef4444}
.thr-opt2 .sc-high{background:#ffedd5;color:#f97316}
.thr-opt2 .sc-med{background:#fef3c7;color:#d97706}
.thr-opt2 .a-btn{font-family:inherit;display:inline-flex;align-items:center;font-size:0.6875rem;font-weight:600;padding:5px 11px;border-radius:0.5rem;border:1px solid;white-space:nowrap;cursor:pointer}
.thr-opt2 .a-isolate{background:#d4183d1a;color:#d4183d;border-color:rgba(212,24,61,.25)}
.thr-opt2 .a-review{background:#0066cc1a;color:#0066cc;border-color:rgba(0,102,204,.25)}
.thr-opt2 .a-done{background:#ececf0;color:#717182;border-color:rgba(0,0,0,.1)}
.thr-opt2 .a-more{background:#f8f9fa;color:#717182;border-color:rgba(0,0,0,.1);font-size:0.8125rem;padding:4px 9px}
.thr-opt2 .act-cell{display:flex;gap:6px;align-items:center}
.thr-opt2 .breach-tr td{padding:7px 16px;border-top:1px solid rgba(212,24,61,.3);border-bottom:1px solid rgba(212,24,61,.3);background:#fff5f5}
.thr-opt2 .breach-inner{display:flex;align-items:center;gap:10px}
.thr-opt2 .breach-line{flex:1;height:0;border-top:1.5px dashed rgba(212,24,61,.4)}
.thr-opt2 .breach-label{font-size:0.6875rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#d4183d;white-space:nowrap}
.thr-opt2 .sec-table-head{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid rgba(0,0,0,.1)}
.thr-opt2 .sth-title{font-size:0.8125rem;font-weight:600;color:#717182}
.thr-opt2 .sth-filters{display:flex;gap:6px}
.thr-opt2 .sth-filter{height:32px;padding:0 10px;border-radius:0.5rem;font-size:0.8125rem;font-weight:500;border:1px solid rgba(0,0,0,.1);background:#fff;color:#1a1a1a;font-family:inherit}
.thr-opt2 .accordion{border-top:1px solid rgba(0,0,0,.1);margin-top:8px}
.thr-opt2 .acc-trigger{display:flex;align-items:center;gap:12px;padding:16px 0;cursor:pointer;background:none;border:none;width:100%;text-align:left;font-family:inherit}
.thr-opt2 .acc-trigger:hover{opacity:.8}
.thr-opt2 .acc-label{font-size:0.8125rem;font-weight:600;color:#1a1a1a}
.thr-opt2 .acc-sub{font-size:0.8125rem;color:#717182}
.thr-opt2 .acc-arrow{margin-left:auto;font-size:12px;color:#717182;transition:transform .2s}
.thr-opt2 .acc-arrow.open{transform:rotate(180deg)}
.thr-opt2 .acc-body{padding:24px 0 32px;border-top:1px solid rgba(0,0,0,.1)}
.thr-opt2 .annot-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.thr-opt2 .a-section{margin-bottom:18px}
.thr-opt2 .a-section:last-child{margin-bottom:0}
.thr-opt2 .a-sec-title{font-size:0.6875rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#717182;margin-bottom:9px;padding-bottom:6px;border-bottom:1px solid rgba(0,0,0,.1)}
.thr-opt2 .a-list{list-style:none;display:flex;flex-direction:column;gap:7px;padding:0;margin:0}
.thr-opt2 .a-list li{font-size:0.8125rem;line-height:1.55;color:#1a1a1a;padding-left:14px;position:relative}
.thr-opt2 .a-list li::before{content:'';position:absolute;left:0;top:7px;width:5px;height:5px;border-radius:50%;background:rgba(0,0,0,.2)}
`;

const ACTION_STATUS: Record<string, { label: string; variant: 'success' | 'neutral' | 'warning' | 'error' | 'info' }> = {
  'Kill Process':          { label: 'Process Killed',      variant: 'success' },
  'Kill Process Tree':     { label: 'Process Tree Killed', variant: 'success' },
  'Quarantine File':       { label: 'Quarantined',         variant: 'neutral' },
  'Isolate Device':        { label: 'Isolated',            variant: 'neutral' },
  'Unisolate Device':      { label: 'Unisolated',          variant: 'success' },
  'Add to Exclusions':     { label: 'Excluded',            variant: 'neutral' },
  'Restore Affected File': { label: 'File Restored',       variant: 'success' },
};

const DEVICE_THREATS_TENANT = [
  { id:1, name:'Ransom.Malbazar',          sub:'Ransomware · In Memory · ×8',         severity:'Critical', device:'DESKTOP-CT7UT4D', userInitials:'BM', userName:'Bob Martinez',        avatarColor:'#6b7280', status:'Not Quarantined', time:'2026-05-29 08:01' },
  { id:2, name:'cmd.exe',                  sub:'Suspicious Shell · Process Behavior',  severity:'High',     device:'DESKTOP-CT7UT4D', userInitials:'BM', userName:'Bob Martinez',        avatarColor:'#6b7280', status:'Not Quarantined', time:'2026-05-29 08:33' },
  { id:3, name:'Exploit.CVE-2024-1234',    sub:'Exploit · In Memory',                 severity:'Critical', device:'DESKTOP-CT7UT4D', userInitials:'BM', userName:'Bob Martinez',        avatarColor:'#6b7280', status:'Not Quarantined', time:'2026-05-29 07:42' },
  { id:4, name:'Ransomware.LockBit3',      sub:'Ransomware · In Memory',              severity:'Critical', device:'LAPTOP-RD-088',   userInitials:'MK', userName:'Mark Klein',          avatarColor:'#374151', status:'Process Killed',  time:'2026-05-29 02:17' },
  { id:5, name:'Malware C2 callback',      sub:'Malware C2 · ×3 · Dentrix Cloud',     severity:'Critical', device:'DESKTOP-CT7UT4D', userInitials:'MM', userName:'Mark Martinez',       avatarColor:'#c8102e', status:'Process Killed',  time:'2026-05-29 08:01' },
  { id:6, name:'Malware & Ransomware',     sub:'Malware Prevention · Blocked at file', severity:'High',    device:'LAPTOP-RD-088',   userInitials:'MM', userName:'Mark Martinez',       avatarColor:'#c8102e', status:'Process Killed',  time:'2026-05-29 07:58' },
  { id:7, name:'Phishing domain blocked',  sub:'Phishing · ×4 · HR Records Portal',   severity:'High',     device:'203.0.113.17',    userInitials:'?',  userName:'unknown@extern.com',  avatarColor:'#9ca3af', status:'Process Killed',  time:'2026-05-29 08:31' },
];

export function ThreatsPage() {
  const [annotOpen, setAnnotOpen]   = useState(false);
  const [rowActions, setRowActions] = useState<Record<number, string>>({});

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="thr-opt2">

        {/* page heading */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <div className="page-h1">Threats</div>
              <div className="page-tenant-badge">Riverside Dental Office</div>
            </div>
            <div className="page-sub">Security posture for this tenant — enforcement layers, top users at risk, open device incidents</div>
          </div>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] text-[var(--color-text)] transition-colors shrink-0">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>

        {/* ── TRAFFIC FLOW ── */}
        <div className="flow-card">
          <div className="flow-head">
            <div className="flow-title">Security Traffic Flow</div>
            <div className="flow-sub">How 1,486 threats against Riverside Dental were intercepted this period</div>
          </div>
          <div style={{ padding: '20px 24px 24px' }}>
            {/* Legend */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {FUNNEL_STAGES.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.6875rem', color: '#1a1a1a', fontWeight: 600 }}>{s.name}</span>
                  <span style={{ fontSize: '0.6875rem', color: '#717182' }}>{s.count.toLocaleString()} · {s.pct}</span>
                </div>
              ))}
            </div>
            {/* Funnel chart */}
            <TrafficFunnelChart />
            {/* Footer note */}
            <div style={{ marginTop: '6px', fontSize: '0.6875rem', color: '#717182' }}>
              1,473 threats stopped before reaching any Riverside Dental device
            </div>
          </div>
        </div>

        {/* ── SECURITY INSIGHTS ── */}
        <div className="insights-grid">

          {/* Threat type breakdown */}
          <div className="ins-card">
            <div className="ins-head">
              <span className="ins-title">Threat by type</span>
              <span className="ins-meta">1,473 blocked events</span>
            </div>
            <div className="ins-body" style={{ paddingBottom: '10px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={THREAT_PIE}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {THREAT_PIE.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,.1)', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
                    itemStyle={{ color: '#1a1a1a', fontWeight: 600 }}
                    labelStyle={{ display: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Device threats */}
          <div className="ins-card">
            <div className="ins-head">
              <span className="ins-title">Device threats</span>
              <span className="ins-meta">13 this period · 3 awaiting action</span>
            </div>
            <div className="ins-body">
              {([
                ['#fca5a5', 'DESKTOP-CT7UT4D', 'Bob Martinez · 11 incidents', '11 threats', 'ds-alert', '3 open'],
                ['#a78bfa', 'LAPTOP-RD-088', 'Mark Klein · LockBit3', '1 threat', 'ds-ok', 'Process killed'],
                [null, 'LAPTOP-RD-071', 'Chris Jensen · AgentTesla', '1 threat', 'ds-ok', 'Process killed'],
                [null, 'DESKTOP-RD-045', 'James Hardy · TrickBot', '1 threat', 'ds-ok', 'Process killed'],
                [null, 'DESKTOP-RD-033', 'Sara Lee · BrowseFox', '1 threat', 'ds-quar', 'Quarantined'],
              ] as [string | null, string, string, string, string, string][]).map(([dotColor, device, user, count, stateCls, stateLabel]) => (
                <div className="dev-row" key={device}>
                  <div className="dev-icon">
                    <div className="dev-icon-dot" style={dotColor ? { background: dotColor } : undefined} />
                  </div>
                  <div>
                    <div className="dev-name">{device}</div>
                    <div className="dev-user">{user}</div>
                  </div>
                  <div className="dev-right">
                    <div className="dev-count">{count}</div>
                    <div className={`dev-state ${stateCls}`}>{stateLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── DEVICE THREATS ── */}
        <div>
          <div className="section-head">
            <div className="sec-h2">Device threats</div>
            <span className="sec-badge red">3 awaiting action</span>
          </div>
          <TablePanel>
          <DataTable>
            <THead>
              <tr>
                {['Threat Name', 'Severity', 'Device', 'User', 'Status', 'Timestamp', 'Action'].map((h) => (
                  <TH key={h}>{h}</TH>
                ))}
              </tr>
            </THead>
            <tbody>
              {DEVICE_THREATS_TENANT.map((r) => {
                const appliedAction  = rowActions[r.id];
                const s              = appliedAction ? ACTION_STATUS[appliedAction] : null;
                const effectiveLabel = appliedAction ? ACTION_STATUS[appliedAction]?.label : r.status;
                const isProcessKilled = effectiveLabel === 'Process Killed' || effectiveLabel === 'Process Tree Killed';
                const isQuarantined   = effectiveLabel === 'Quarantined';
                const isIsolated      = effectiveLabel === 'Isolated';

                return (
                  <TR key={r.id}>
                    {/* Threat Name */}
                    <TD>
                      <div className="font-medium text-[var(--color-text)]">{r.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{r.sub}</div>
                    </TD>
                    {/* Severity */}
                    <TD>
                      <SeverityChip level={r.severity === 'Critical' ? 'crit' : r.severity === 'High' ? 'high' : 'med'}>
                        {r.severity}
                      </SeverityChip>
                    </TD>
                    {/* Device */}
                    <TD>
                      <span className="font-mono text-xs text-[var(--color-text)]">{r.device}</span>
                    </TD>
                    {/* User */}
                    <TD>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
                          style={{ background: r.avatarColor }}>
                          {r.userInitials}
                        </div>
                        <span className="text-sm text-[var(--color-text)]">{r.userName}</span>
                      </div>
                    </TD>
                    {/* Status */}
                    <TD>
                      {s ? (
                        <StatusBadge variant={s.variant} dot>{s.label}</StatusBadge>
                      ) : (
                        <StatusBadge
                          variant={r.status === 'Not Quarantined' ? 'warning' : r.status === 'Process Killed' ? 'success' : 'neutral'}
                          dot>
                          {r.status}
                        </StatusBadge>
                      )}
                    </TD>
                    {/* Timestamp */}
                    <TD>
                      <span className="text-sm text-[var(--color-text-muted)]">{r.time}</span>
                    </TD>
                    {/* Action */}
                    <TD>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]">
                            <MoreHorizontal size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={isProcessKilled}
                            onSelect={() => setRowActions((prev) => ({ ...prev, [r.id]: 'Kill Process' }))}>
                            Kill Process
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isProcessKilled}
                            onSelect={() => setRowActions((prev) => ({ ...prev, [r.id]: 'Kill Process Tree' }))}>
                            Kill Process Tree
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isQuarantined}
                            onSelect={() => setRowActions((prev) => ({ ...prev, [r.id]: 'Quarantine File' }))}>
                            Quarantine File
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setRowActions((prev) => ({
                              ...prev,
                              [r.id]: isIsolated ? 'Unisolate Device' : 'Isolate Device',
                            }))}>
                            {isIsolated ? 'Unisolate Device' : 'Isolate Device'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setRowActions((prev) => ({ ...prev, [r.id]: 'Add to Exclusions' }))}>
                            Add to Exclusions
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setRowActions((prev) => ({ ...prev, [r.id]: 'Restore Affected File' }))}>
                            Restore Affected File
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </DataTable>
          <TableFoot>
            <span>Showing {DEVICE_THREATS_TENANT.length} threats</span>
          </TableFoot>
          </TablePanel>
        </div>

        {/* ── DOMAIN THREATS ── */}
        <div>
          <div className="section-head">
            <div className="sec-h2">Domain Threats</div>
            <span className="sec-badge">1,473 events · last 7 days</span>
          </div>
          <TablePanel>
            {/* toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-[13px] text-[var(--color-text-muted)]">All blocked threat events — Riverside Dental</span>
              <div className="flex items-center gap-2">
                <select className="text-[13px] border border-border rounded-md px-2 py-1 bg-[var(--color-surface)] text-[var(--color-text)] outline-none cursor-pointer">
                  <option>All Threat Types</option>
                  <option>Phishing</option>
                  <option>Malware C2</option>
                  <option>Malware &amp; Ransomware</option>
                  <option>Dangerous Config</option>
                </select>
                <select className="text-[13px] border border-border rounded-md px-2 py-1 bg-[var(--color-surface)] text-[var(--color-text)] outline-none cursor-pointer">
                  <option>All Severities</option>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                </select>
              </div>
            </div>
            <DataTable>
              <THead>
                <tr>
                  {['Timestamp', 'Threat Type', 'User', 'Source IP', 'Destination App', 'Policy Matched', 'Severity', 'Action'].map((h) => (
                    <TH key={h}>{h}</TH>
                  ))}
                </tr>
              </THead>
              <tbody>
                {([
                  ['2026-05-29 08:42', 'Malware C2',                        'mark@riversidedental.com',    '192.168.1.42',  'Dentrix Cloud',     'Malware C2 Block',          'crit', 'Critical'],
                  ['2026-05-29 08:31', 'Phishing',                          'unknown@extern.com',          '203.0.113.17',  'HR Records Portal', 'Phishing Block Policy',     'high', 'High'],
                  ['2026-05-29 08:19', 'Spam / Ad Fraud / Spyware',         'jessica@riversidedental.com', '10.0.0.88',     'Microsoft 365',     'Spam & Spyware Policy',     'high', 'High'],
                  ['2026-05-29 07:58', 'Malware & Ransomware',              'mark@riversidedental.com',    '192.168.1.42',  'Storage Server',    'Malware Prevention Policy', 'crit', 'Critical'],
                  ['2026-05-29 07:44', 'Risky DNS Transactions',            'admin@riversidedental.com',   '10.0.1.5',      '—',                 'Risky DNS Block',           'med',  'Medium'],
                  ['2026-05-29 07:33', 'Phishing',                          'temp.vendor@extern.com',      '198.51.100.44', 'QuickBooks',        'Phishing Block Policy',     'high', 'High'],
                  ['2026-05-29 07:21', 'Dangerous Configuration / History', 'maria@riversidedental.com',   '10.0.0.21',     'Dentrix Cloud',     'Config Risk Policy',        'med',  'Medium'],
                  ['2026-05-29 07:10', 'New Domains',                       'jessica@riversidedental.com', '91.108.4.12',   'Microsoft 365',     'New Domain Block Policy',   'med',  'Medium'],
                ] as [string,string,string,string,string,string,string,string][]).map(([ts, type, user, ip, app, policy, sev, sevLabel], i) => (
                  <TR key={i}>
                    <TD><span className="font-mono text-xs text-[var(--color-text-muted)]">{ts}</span></TD>
                    <TD>{type}</TD>
                    <TD><span className="text-[var(--color-text-muted)]">{user}</span></TD>
                    <TD><span className="font-mono text-xs text-[var(--color-text-muted)]">{ip}</span></TD>
                    <TD>{app}</TD>
                    <TD><span className="text-xs text-[var(--color-text-muted)]">{policy}</span></TD>
                    <TD>
                      <SeverityChip level={sev as 'crit' | 'high' | 'med'}>{sevLabel}</SeverityChip>
                    </TD>
                    <TD>
                      <StatusBadge variant="success" dot>Blocked</StatusBadge>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </DataTable>
            <TableFoot>
              <span>Showing 8 of 1,473 events — sorted by severity</span>
              <div className="flex gap-1.5">
                {(['‹', '1', '2', '3', '›'] as string[]).map((p, i) => (
                  <button
                    key={i}
                    disabled={p === '‹' && true && i === 0}
                    className={[
                      'w-7 h-7 border border-border rounded-md text-[13px] cursor-pointer',
                      p === '1'
                        ? 'bg-[var(--color-action)] text-[var(--color-action-foreground)] border-[var(--color-action)]'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]',
                    ].join(' ')}>
                    {p}
                  </button>
                ))}
              </div>
            </TableFoot>
          </TablePanel>
        </div>

        {/* ── DESIGN DECISIONS ── */}
        <div className="accordion">
          <button className="acc-trigger" onClick={() => setAnnotOpen(o => !o)}>
            <span className="acc-label">Design decisions</span>
            <span className="acc-sub">Tenant page vs MSP page — what changed and why</span>
            <span className={`acc-arrow${annotOpen ? ' open' : ''}`}>▾</span>
          </button>
          {annotOpen && (
            <div className="acc-body">
              <div className="annot-grid">
                <div>
                  <div className="a-section">
                    <div className="a-sec-title">Structural alignment with MSP Option 2</div>
                    <ul className="a-list">
                      <li>Same three-section layout: Traffic Flow → Security Insights → Response Queue. An MSP already familiar with their Option 2 view reads this page immediately.</li>
                      <li>Scope selector changes from "All Tenants · 4" to "Riverside Dental Office" with a colour dot. Breadcrumb adds the tenant level. Sidenav shows a tenant context badge.</li>
                      <li>"← All Tenants" back control in the topbar and sidenav — operator never loses their way back to the MSP view.</li>
                    </ul>
                  </div>
                  <div className="a-section">
                    <div className="a-sec-title">Traffic Flow — tenant scoped</div>
                    <ul className="a-list">
                      <li>Same four-stage funnel. Numbers replace the MSP totals with Riverside Dental's own: 1,486 total, 1,072 at domain (72.1%), 355 at URL (23.9%), 46 at file (3.1%), 13 reached device (0.87%).</li>
                      <li>Domain % is lower for this tenant (72% vs 93% MSP-wide) because their phishing and config volumes pull more traffic into lower layers.</li>
                    </ul>
                  </div>
                </div>
                <div>
                  <div className="a-section">
                    <div className="a-sec-title">Insights columns change at tenant scope</div>
                    <ul className="a-list">
                      <li>MSP centre card = "Tenant risk" (which customer). Tenant centre card = "Top users at risk" (which person within this customer).</li>
                      <li>MSP right card = "Response overview" (cross-tenant stats). Tenant right card = "Device incidents" (specific machines, users, and threat names).</li>
                      <li>Threat type breakdown uses Riverside Dental's real counts — Phishing 412, Config 340, Spam 171, 3rd Party 141.</li>
                    </ul>
                  </div>
                  <div className="a-section">
                    <div className="a-sec-title">Queue — no Tenant column</div>
                    <ul className="a-list">
                      <li>Tenant column removed. Column slot replaced by Device and User as first-class columns — the identifiers the operator needs at this level.</li>
                      <li>Bulk action bar gains "Isolate device" as a primary action — at tenant scope, device isolation is in-context.</li>
                      <li>Blocked event log added below the queue as a secondary table — at tenant scope, the full event history is relevant context.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
