import { useState, useMemo, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router';
import { Search, Download, ChevronLeft, ChevronRight, ChevronDown, Shield, ShieldAlert, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { SeverityChip, StatusBadge, DataTable, THead, TH, TR, TD, TablePanel, TableFoot } from '../components/ds';

// ── Data ──────────────────────────────────────────────────────────────────────

const SEV: Record<string, { level: 'crit' | 'high' | 'med'; bar: string }> = {
  Critical: { level: 'crit', bar: 'var(--destructive)' },
  High:     { level: 'high', bar: 'var(--warning)' },
  Medium:   { level: 'med',  bar: 'color-mix(in srgb, var(--warning) 55%, #ffffff)' },
};

const THREAT_TYPES = [
  { key: 'unauthorized', label: 'Unauthorized Access',    display: 'Unauthorized Access Attempt',      severity: 'High'     },
  { key: 'posture',      label: 'Device Posture Failure', display: 'Non-Compliant Device Blocked',     severity: 'Medium'   },
  { key: 'c2',           label: 'C2 attempts',            display: 'C2 Attempts',                      severity: 'Critical' },
  { key: 'lateral',      label: 'Lateral Movement',       display: 'Port Scanning / Lateral Movement', severity: 'Critical' },
  { key: 'dns',          label: 'Malicious DNS',          display: 'DNS-Based Threat',                 severity: 'Medium'   },
  { key: 'mfa',          label: 'MFA Failure',            display: 'MFA Challenge Failed / Bypassed',  severity: 'High'     },
  { key: 'geo',          label: 'Geo Block',              display: 'Geo / Location-Based Block',       severity: 'Medium'   },
] as const;

type ThreatKey = typeof THREAT_TYPES[number]['key'];

const RANGE_MULT: Record<string, number> = { today: 0.05, yesterday: 0.14, '7d': 1, '30d': 4.3, custom: 1 };

interface TenantData {
  id: string; name: string; color: string;
  counts: Record<ThreatKey, number>;
}

const TENANTS: TenantData[] = [
  { id: 'riverside',  name: 'Riverside Dental Office',   color: '#4f46e5', counts: { unauthorized:412,posture:340,c2:29,lateral:18,dns:126,mfa:171,geo:141 } },
  { id: 'bayarea',    name: 'Bay Area Ortho Group',       color: '#0ea5e9', counts: { unauthorized:87, posture:54, c2:11,lateral:7, dns:38, mfa:29, geo:22  } },
  { id: 'sunstate',   name: 'SunState Insurance LLC',     color: '#10b981', counts: { unauthorized:63, posture:41, c2:7, lateral:4, dns:19, mfa:13, geo:9   } },
  { id: 'pinehurst',  name: 'Pinehurst Law Partners',     color: '#f59e0b', counts: { unauthorized:22, posture:14, c2:0, lateral:0, dns:8,  mfa:6,  geo:4   } },
  { id: 'clearwater', name: 'Clearwater Tech (inactive)', color: '#9ca3af', counts: { unauthorized:0,  posture:0,  c2:0, lateral:0, dns:0,  mfa:0,  geo:0   } },
  { id: 'northridge', name: 'Northridge Medical Group',   color: '#8b5cf6', counts: { unauthorized:0,  posture:0,  c2:0, lateral:0, dns:0,  mfa:0,  geo:0   } },
];

interface ThreatEvent {
  ts: string; type: string; user: string; ip: string;
  app: string; policy: string; severity: string; action: string;
}

const EVENTS_BY_TENANT: Record<string, ThreatEvent[]> = {
  riverside: [
    { ts:'2026-05-29 08:42', type:'C2 attempts',            user:'mark@riversidedental.com',         ip:'192.168.1.42',  app:'Dentrix Cloud',     policy:'C2 Block — Private App',     severity:'Critical', action:'Blocked' },
    { ts:'2026-05-29 08:31', type:'Unauthorized Access',    user:'unknown@extern.com',               ip:'203.0.113.17',  app:'HR Records Portal', policy:'Engineering to HR Policy',   severity:'High',     action:'Blocked' },
    { ts:'2026-05-29 08:19', type:'MFA Failure',            user:'jessica@riversidedental.com',      ip:'10.0.0.88',     app:'Microsoft 365',     policy:'MFA Enforcement Policy',     severity:'High',     action:'Blocked' },
    { ts:'2026-05-29 07:58', type:'Lateral Movement',       user:'mark@riversidedental.com',         ip:'192.168.1.42',  app:'Storage Server',    policy:'IoT to Storage Policy',      severity:'Critical', action:'Blocked' },
    { ts:'2026-05-29 07:44', type:'Malicious DNS',          user:'admin@riversidedental.com',        ip:'10.0.1.5',      app:'—',                  policy:'DNS Threat Block',           severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-29 07:33', type:'Unauthorized Access',    user:'temp.vendor@extern.com',           ip:'198.51.100.44', app:'QuickBooks',         policy:'Vendor Access Policy',       severity:'High',     action:'Blocked' },
    { ts:'2026-05-29 07:21', type:'Device Posture Failure', user:'maria@riversidedental.com',        ip:'10.0.0.21',     app:'Dentrix Cloud',      policy:'Device Trust Policy',        severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-29 07:10', type:'Geo Block',              user:'jessica@riversidedental.com',      ip:'91.108.4.12',   app:'Microsoft 365',      policy:'Geo Restriction Policy',     severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-29 06:55', type:'MFA Failure',            user:'mark@riversidedental.com',         ip:'10.0.0.88',     app:'QuickBooks',         policy:'MFA Enforcement Policy',     severity:'High',     action:'Blocked' },
    { ts:'2026-05-29 06:42', type:'C2 attempts',            user:'jessica@riversidedental.com',      ip:'192.168.1.51',  app:'Dentrix Cloud',      policy:'C2 Block — Private App',     severity:'Critical', action:'Blocked' },
    { ts:'2026-05-28 17:12', type:'Unauthorized Access',    user:'unknown@extern.com',               ip:'203.0.113.22',  app:'Patient Records DB', policy:'Engineering to HR Policy',   severity:'High',     action:'Blocked' },
    { ts:'2026-05-28 16:55', type:'Malicious DNS',          user:'admin@riversidedental.com',        ip:'10.0.1.5',      app:'—',                  policy:'DNS Threat Block',           severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-28 15:33', type:'Device Posture Failure', user:'mark@riversidedental.com',         ip:'10.0.0.88',     app:'Microsoft 365',      policy:'Device Trust Policy',        severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-28 14:20', type:'MFA Failure',            user:'jessica@riversidedental.com',      ip:'10.0.0.51',     app:'QuickBooks',         policy:'MFA Enforcement Policy',     severity:'High',     action:'Blocked' },
    { ts:'2026-05-28 13:07', type:'Geo Block',              user:'dr.henderson@riversidedental.com', ip:'77.88.8.1',     app:'Dentrix Cloud',      policy:'Geo Restriction Policy',     severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-27 10:44', type:'Lateral Movement',       user:'mark@riversidedental.com',         ip:'192.168.1.42',  app:'File Server',        policy:'IoT to Storage Policy',      severity:'Critical', action:'Blocked' },
    { ts:'2026-05-27 09:22', type:'Unauthorized Access',    user:'temp.vendor2@extern.com',          ip:'198.51.100.77', app:'HR Records Portal',  policy:'Engineering to HR Policy',   severity:'High',     action:'Blocked' },
    { ts:'2026-05-26 15:11', type:'C2 attempts',            user:'mark@riversidedental.com',         ip:'192.168.1.42',  app:'Dentrix Cloud',      policy:'C2 Block — Private App',     severity:'Critical', action:'Blocked' },
    { ts:'2026-05-26 11:03', type:'MFA Failure',            user:'maria@riversidedental.com',        ip:'10.0.0.21',     app:'Microsoft 365',      policy:'MFA Enforcement Policy',     severity:'High',     action:'Blocked' },
    { ts:'2026-05-25 16:48', type:'Malicious DNS',          user:'jessica@riversidedental.com',      ip:'10.0.0.51',     app:'—',                  policy:'DNS Threat Block',           severity:'Medium',   action:'Blocked' },
  ],
  bayarea: [
    { ts:'2026-05-29 09:11', type:'C2 attempts',            user:'user1@bayareaortho.com',           ip:'10.1.0.5',      app:'Ortho EHR',          policy:'C2 Block — Private App',     severity:'Critical', action:'Blocked' },
    { ts:'2026-05-29 08:50', type:'Unauthorized Access',    user:'extern@unknown.net',               ip:'185.220.101.5', app:'Billing Portal',     policy:'Vendor Access Policy',       severity:'High',     action:'Blocked' },
    { ts:'2026-05-28 14:22', type:'MFA Failure',            user:'receptionist@bayareaortho.com',    ip:'10.1.0.12',     app:'Microsoft 365',      policy:'MFA Enforcement Policy',     severity:'High',     action:'Blocked' },
    { ts:'2026-05-27 11:05', type:'Device Posture Failure', user:'dr.kim@bayareaortho.com',          ip:'10.1.0.7',      app:'Ortho EHR',          policy:'Device Trust Policy',        severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-27 09:33', type:'Geo Block',              user:'user2@bayareaortho.com',           ip:'84.17.52.3',    app:'Billing Portal',     policy:'Geo Restriction Policy',     severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-26 16:44', type:'Malicious DNS',          user:'admin@bayareaortho.com',           ip:'10.1.0.1',      app:'—',                  policy:'DNS Threat Block',           severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-25 10:12', type:'Lateral Movement',       user:'user1@bayareaortho.com',           ip:'10.1.0.5',      app:'File Server',        policy:'IoT to Storage Policy',      severity:'Critical', action:'Blocked' },
  ],
  sunstate: [
    { ts:'2026-05-29 07:55', type:'Unauthorized Access',    user:'agent@sunstateins.com',            ip:'10.2.0.18',     app:'Policy Portal',      policy:'Agent Access Policy',        severity:'High',     action:'Blocked' },
    { ts:'2026-05-28 13:44', type:'C2 attempts',            user:'server@sunstateins.com',           ip:'10.2.0.5',      app:'Claims System',      policy:'C2 Block — Private App',     severity:'Critical', action:'Blocked' },
    { ts:'2026-05-27 11:22', type:'MFA Failure',            user:'manager@sunstateins.com',          ip:'10.2.0.22',     app:'Microsoft 365',      policy:'MFA Enforcement Policy',     severity:'High',     action:'Blocked' },
    { ts:'2026-05-26 09:10', type:'Device Posture Failure', user:'agent2@sunstateins.com',           ip:'10.2.0.19',     app:'Policy Portal',      policy:'Device Trust Policy',        severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-25 14:05', type:'Malicious DNS',          user:'admin@sunstateins.com',            ip:'10.2.0.1',      app:'—',                  policy:'DNS Threat Block',           severity:'Medium',   action:'Blocked' },
  ],
  pinehurst: [
    { ts:'2026-05-29 10:05', type:'Unauthorized Access',    user:'extern@unknown.net',               ip:'45.33.32.156',  app:'Legal Doc Vault',    policy:'Vendor Access Policy',       severity:'High',     action:'Blocked' },
    { ts:'2026-05-28 15:30', type:'MFA Failure',            user:'paralegal@pinehurst.law',          ip:'10.3.0.9',      app:'Microsoft 365',      policy:'MFA Enforcement Policy',     severity:'High',     action:'Blocked' },
    { ts:'2026-05-27 12:11', type:'Geo Block',              user:'attorney@pinehurst.law',           ip:'109.238.1.5',   app:'Legal Doc Vault',    policy:'Geo Restriction Policy',     severity:'Medium',   action:'Blocked' },
    { ts:'2026-05-26 09:55', type:'Malicious DNS',          user:'admin@pinehurst.law',              ip:'10.3.0.1',      app:'—',                  policy:'DNS Threat Block',           severity:'Medium',   action:'Blocked' },
  ],
  clearwater: [],
  northridge: [],
};

// ── Device threats data ───────────────────────────────────────────────────────

interface DeviceThreat {
  id: number; name: string; sub: string;
  severity: string; endpoint: string;
  ui: string; uname: string; uemail: string;
  status: string; time: string;
}

const DEVICE_THREATS: DeviceThreat[] = [
  { id:1,  name:'Ransom.Malbazar',       sub:'Ransomware · In Memory',              severity:'High',   endpoint:'DESKTOP-CT7UT4D',  ui:'BM', uname:'Bob Martinez',  uemail:'bob.martinez@gav-india.com',   status:'Not Quarantined', time:'2026-08-24 09:53' },
  { id:2,  name:'Ransom.Malbazar',       sub:'Ransomware · In Memory',              severity:'High',   endpoint:'DESKTOP-CT7UT4D',  ui:'BM', uname:'Bob Martinez',  uemail:'bob.martinez@gav-india.com',   status:'Not Quarantined', time:'2026-08-24 09:52' },
  { id:3,  name:'cmd.exe',               sub:'Suspicious Shell · Process Behavior', severity:'High',   endpoint:'DESKTOP-CT7UT4D',  ui:'BM', uname:'Bob Martinez',  uemail:'bob.martinez@gav-india.com',   status:'Not Quarantined', time:'2026-08-24 09:51' },
  { id:4,  name:'Ransom.Malbazar',       sub:'Ransomware · In Memory',              severity:'High',   endpoint:'DESKTOP-CT7UT4D',  ui:'BM', uname:'Bob Martinez',  uemail:'bob.martinez@gav-india.com',   status:'Process Killed',  time:'2026-08-24 09:47' },
  { id:5,  name:'Ransom.Malbazar',       sub:'Ransomware · In Memory',              severity:'High',   endpoint:'DESKTOP-CT7UT4D',  ui:'BM', uname:'Bob Martinez',  uemail:'bob.martinez@gav-india.com',   status:'Process Killed',  time:'2026-08-24 09:46' },
  { id:6,  name:'harmless_md5_1.txt',    sub:'Suspicious File · On Scan',           severity:'Medium', endpoint:'VTB280-PC1',        ui:'SY', uname:'System',        uemail:'system@qa.sonicwall.com',      status:'Quarantined',     time:'2026-08-24 09:37' },
  { id:7,  name:'ae1bc3bfec00e96fc4ab70',sub:'PUA · On Download',                  severity:'Low',    endpoint:'DESKTOP-M5K8HOU',  ui:'TJ', uname:'Theron James',  uemail:'theron@yashpersonal.com',      status:'Quarantined',     time:'2026-08-24 09:30' },
  { id:8,  name:'Ransom.Malbazar',       sub:'Ransomware · In Memory',              severity:'High',   endpoint:'DESKTOP-CT7UT4D',  ui:'BM', uname:'Bob Martinez',  uemail:'bob.martinez@gav-india.com',   status:'Process Killed',  time:'2026-08-24 09:25' },
  { id:9,  name:'Ransom.Malbazar',       sub:'Ransomware · In Memory',              severity:'High',   endpoint:'DESKTOP-CT7UT4D',  ui:'BM', uname:'Bob Martinez',  uemail:'bob.martinez@gav-india.com',   status:'Process Killed',  time:'2026-08-24 09:24' },
  { id:10, name:'Ransom.Malbazar',       sub:'Ransomware · In Memory',              severity:'High',   endpoint:'DESKTOP-CT7UT4D',  ui:'BM', uname:'Bob Martinez',  uemail:'bob.martinez@gav-india.com',   status:'Process Killed',  time:'2026-08-24 09:22' },
  { id:11, name:'Trojan.GenericKD',      sub:'Trojan · On Download',                severity:'High',   endpoint:'LAPTOP-QA-007',    ui:'AC', uname:'Alice Chen',    uemail:'alice.chen@qa.sonicwall.com',  status:'Process Killed',  time:'2026-08-24 09:18' },
  { id:12, name:'Adware.InstallCore',    sub:'Adware · On Scan',                    severity:'Medium', endpoint:'DESKTOP-M5K8HOU',  ui:'TJ', uname:'Theron James',  uemail:'theron@yashpersonal.com',      status:'Quarantined',     time:'2026-08-24 09:09' },
  { id:13, name:'PUP.Optional.Bundler',  sub:'PUP · On Scan',                       severity:'Low',    endpoint:'VTB280-PC2',        ui:'CN', uname:'Charlie Nwosu', uemail:'charlie.n@qa.sonicwall.com',   status:'Quarantined',     time:'2026-08-24 09:00' },
  { id:14, name:'Exploit.CVE-2024-1234', sub:'Exploit · In Memory',                 severity:'High',   endpoint:'DESKTOP-CT7UT4D',  ui:'BM', uname:'Bob Martinez',  uemail:'bob.martinez@gav-india.com',   status:'Process Killed',  time:'2026-08-24 08:58' },
  { id:15, name:'Backdoor.Agent.XZ',     sub:'Backdoor · On Process Behavior',      severity:'High',   endpoint:'LAPTOP-QA-012',    ui:'DO', uname:'Diana Osei',    uemail:'diana.osei@qa.sonicwall.com',  status:'Quarantined',     time:'2026-08-24 08:30' },
  { id:16, name:'Spyware.AgentTesla',    sub:'Spyware · On Download',               severity:'Medium', endpoint:'LAPTOP-YP-003',    ui:'EP', uname:'Evan Park',     uemail:'evan.park@yashpersonal.com',   status:'Quarantined',     time:'2026-08-24 08:00' },
  { id:17, name:'Worm.Conficker.B',      sub:'Worm · On Process Behavior',          severity:'High',   endpoint:'DESKTOP-GI-044',   ui:'PS', uname:'Priya Sharma',  uemail:'priya.sharma@gav-india.com',   status:'Process Killed',  time:'2026-08-24 07:58' },
  { id:18, name:'Trojan.Dropper.Win32',  sub:'Trojan · On Scan',                    severity:'Medium', endpoint:'VTB280-PC3',        ui:'SY', uname:'System',        uemail:'system@qa.sonicwall.com',      status:'Quarantined',     time:'2026-08-24 07:00' },
  { id:19, name:'Rootkit.Necurs',        sub:'Rootkit · In Memory',                 severity:'High',   endpoint:'DESKTOP-GI-055',   ui:'RK', uname:'Ravi Kumar',    uemail:'ravi.kumar@gav-india.com',     status:'Process Killed',  time:'2026-08-24 06:55' },
  { id:20, name:'Adware.Crossrider',     sub:'Adware · On Download',                severity:'Low',    endpoint:'DESKTOP-M5K8HOU',  ui:'TJ', uname:'Theron James',  uemail:'theron@yashpersonal.com',      status:'Quarantined',     time:'2026-08-24 06:00' },
  { id:21, name:'Ransomware.Lockbit',    sub:'Ransomware · In Memory',              severity:'High',   endpoint:'LAPTOP-QA-021',    ui:'FW', uname:'Fiona Walsh',   uemail:'fiona.walsh@qa.sonicwall.com', status:'Process Killed',  time:'2026-08-24 05:58' },
  { id:22, name:'Miner.XMRig',           sub:'Cryptominer · On Process Behavior',   severity:'Medium', endpoint:'DESKTOP-GI-066',   ui:'SP', uname:'Suresh Pillai', uemail:'suresh.pillai@gav-india.com',  status:'Process Killed',  time:'2026-08-24 05:00' },
];

// ── Domain threat events ──────────────────────────────────────────────────────

interface DomainThreatEvent {
  id: number; type: string; tenant: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  device: string; status: string; ts: string;
}

const DOMAIN_THREAT_EVENTS: DomainThreatEvent[] = [
  { id:1,  type:'Malware C2',                                  tenant:'Riverside Dental Office',  severity:'Critical', device:'DESKTOP-RD-042',  status:'Blocked', ts:'2026-08-20 08:42' },
  { id:2,  type:'Phishing',                                    tenant:'Riverside Dental Office',  severity:'High',     device:'LAPTOP-RD-007',   status:'Blocked', ts:'2026-08-20 08:31' },
  { id:3,  type:'Malware & Ransomware',                        tenant:'Bay Area Ortho Group',     severity:'Critical', device:'DESKTOP-BAO-011', status:'Blocked', ts:'2026-08-20 08:19' },
  { id:4,  type:'Risky DNS Transactions',                      tenant:'Riverside Dental Office',  severity:'Medium',   device:'TABLET-RD-003',   status:'Blocked', ts:'2026-08-20 07:58' },
  { id:5,  type:'Dangerous Nameserver',                        tenant:'SunState Insurance LLC',   severity:'High',     device:'DESKTOP-SS-019',  status:'Blocked', ts:'2026-08-20 07:44' },
  { id:6,  type:'Bots / Cryptomining',                         tenant:'Riverside Dental Office',  severity:'High',     device:'DESKTOP-RD-088',  status:'Blocked', ts:'2026-08-20 07:33' },
  { id:7,  type:'Malicious SSL Cert',                          tenant:'Bay Area Ortho Group',     severity:'High',     device:'LAPTOP-BAO-005',  status:'Blocked', ts:'2026-08-20 07:21' },
  { id:8,  type:'Spam / Ad Fraud / Spyware',                   tenant:'Riverside Dental Office',  severity:'Medium',   device:'DESKTOP-RD-021',  status:'Blocked', ts:'2026-08-20 07:10' },
  { id:9,  type:'Malware C2',                                  tenant:'Riverside Dental Office',  severity:'Critical', device:'DESKTOP-RD-042',  status:'Blocked', ts:'2026-08-20 06:55' },
  { id:10, type:'Phishing',                                    tenant:'Pinehurst Law Partners',   severity:'High',     device:'LAPTOP-PH-009',   status:'Blocked', ts:'2026-08-20 06:42' },
  { id:11, type:'Dangerous 3rd Party Infrastructure',          tenant:'Riverside Dental Office',  severity:'Medium',   device:'DESKTOP-RD-051',  status:'Blocked', ts:'2026-08-19 17:12' },
  { id:12, type:'Other Known Bad (Community Intelligence)',    tenant:'Bay Area Ortho Group',     severity:'Medium',   device:'DESKTOP-BAO-003', status:'Blocked', ts:'2026-08-19 16:55' },
  { id:13, type:'Dangerous Configuration / History',          tenant:'SunState Insurance LLC',   severity:'Medium',   device:'SERVER-SS-001',   status:'Blocked', ts:'2026-08-19 15:33' },
  { id:14, type:'New Domains',                                 tenant:'Riverside Dental Office',  severity:'Low',      device:'DESKTOP-RD-088',  status:'Blocked', ts:'2026-08-19 14:20' },
  { id:15, type:'Malware & Ransomware',                        tenant:'Riverside Dental Office',  severity:'Critical', device:'LAPTOP-RD-012',   status:'Blocked', ts:'2026-08-19 13:07' },
  { id:16, type:'Risky DNS Transactions',                      tenant:'Bay Area Ortho Group',     severity:'Medium',   device:'DESKTOP-BAO-007', status:'Blocked', ts:'2026-08-19 11:55' },
  { id:17, type:'Bots / Cryptomining',                         tenant:'Pinehurst Law Partners',   severity:'High',     device:'DESKTOP-PH-002',  status:'Blocked', ts:'2026-08-19 10:44' },
  { id:18, type:'Dangerous Nameserver',                        tenant:'Riverside Dental Office',  severity:'High',     device:'DESKTOP-RD-042',  status:'Blocked', ts:'2026-08-19 09:22' },
  { id:19, type:'Malware C2',                                  tenant:'SunState Insurance LLC',   severity:'Critical', device:'SERVER-SS-002',   status:'Blocked', ts:'2026-08-19 08:11' },
  { id:20, type:'Malicious SSL Cert',                          tenant:'Riverside Dental Office',  severity:'High',     device:'LAPTOP-RD-007',   status:'Blocked', ts:'2026-08-18 16:48' },
];

// ── Security Traffic Flow funnel ──────────────────────────────────────────────

const BT_FUNNEL_STAGES = [
  { name: 'Blocked at Domain',      short: 'Domain',      count: 19400, pct: '93.3%', color: '#60a5fa' },
  { name: 'Blocked at Web Address', short: 'Web Address', count: 1240,  pct: '6.0%',  color: '#818cf8' },
  { name: 'Blocked at File',        short: 'File',        count: 128,   pct: '0.6%',  color: '#a78bfa' },
  { name: 'Reached Device',         short: 'Device',      count: 16,    pct: '0.08%', color: '#f87171' },
];

function BlockedThreatsFunnelChart() {
  const TOTAL = 20784;
  const SEG_W = 185;
  const CHART_H = 160;
  const CY = CHART_H / 2;
  const PAD_X = 20;
  const W = BT_FUNNEL_STAGES.length * SEG_W + PAD_X * 2;
  const VH = CHART_H;

  const passed = [TOTAL, 1384, 144, 16, 0];
  const boundH = passed.map((p) => Math.max((p / TOTAL) * CHART_H, 1.5));

  return (
    <svg viewBox={`0 0 ${W} ${VH}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {BT_FUNNEL_STAGES.map((s, i) => {
        const x1 = PAD_X + i * SEG_W;
        const x2 = PAD_X + (i + 1) * SEG_W;
        const h1 = boundH[i], h2 = boundH[i + 1];
        const d = `M${x1},${CY - h1 / 2} L${x2},${CY - h2 / 2} L${x2},${CY + h2 / 2} L${x1},${CY + h1 / 2}Z`;
        return (
          <g key={s.name}>
            <path d={d} fill={s.color} />
          </g>
        );
      })}
    </svg>
  );
}

// ── Security Traffic Flow static data (kept for reference) ────────────────────

const FLOW_STAGES = [
  {
    key: 'domain', label: 'Domain', sub: 'DNS-layer enforcement',
    count: 19400, pct: '93.3%', passed: 1384,
    bg: 'bg-blue-50', border: 'border-blue-200',
    numColor: 'text-blue-900', labelColor: 'text-blue-700',
    pctBg: 'bg-blue-100', pctText: 'text-blue-900', icon: 'bg-blue-400',
  },
  {
    key: 'url', label: 'Web Address', sub: 'URL-layer enforcement',
    count: 1240, pct: '6.0%', passed: 144,
    bg: 'bg-blue-100', border: 'border-blue-300',
    numColor: 'text-blue-900', labelColor: 'text-blue-700',
    pctBg: 'bg-blue-200', pctText: 'text-blue-900', icon: 'bg-blue-500',
  },
  {
    key: 'file', label: 'File', sub: 'Sandbox analysis',
    count: 128, pct: '0.6%', passed: 16,
    bg: 'bg-violet-50', border: 'border-violet-200',
    numColor: 'text-violet-900', labelColor: 'text-violet-700',
    pctBg: 'bg-violet-100', pctText: 'text-violet-900', icon: 'bg-violet-400',
  },
  {
    key: 'device', label: 'Reached Device', sub: 'Device agent active',
    count: 16, pct: '0.08%', passed: null,
    bg: 'bg-red-50', border: 'border-red-200',
    numColor: 'text-destructive', labelColor: 'text-destructive',
    pctBg: 'bg-red-100', pctText: 'text-destructive', icon: 'bg-red-300',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function scaled(n: number, range: string) {
  return Math.round(n * (RANGE_MULT[range] ?? 1));
}
function tenantTotal(t: TenantData, range: string) {
  return scaled(Object.values(t.counts).reduce((a, b) => a + b, 0), range);
}
function tenantCritical(t: TenantData, range: string) {
  return scaled(t.counts.c2 + t.counts.lateral, range);
}
function exportCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, trend, accent }: {
  label: string; value: string; sub?: string;
  trend?: { text: string; up: boolean }; accent?: boolean;
}) {
  return (
    <div className={`border rounded-2xl shadow-sm p-5 flex-1 min-w-[150px] ${accent ? 'bg-action text-action-foreground' : 'bg-card'}`}>
      <div className={`text-[11px] font-semibold uppercase tracking-[0.04em] ${accent ? 'text-action-foreground/70' : 'text-muted-foreground'}`}>{label}</div>
      <div className={`text-[28px] font-bold mt-1.5 mb-1 ${accent ? 'text-action-foreground' : 'text-foreground'}`}>{value}</div>
      {trend && (
        <div className={`text-xs font-medium ${accent ? 'text-action-foreground/70' : 'text-muted-foreground'}`}>
          {trend.up ? '↑' : '↓'} {trend.text}
        </div>
      )}
      {sub && <div className={`text-xs ${accent ? 'text-action-foreground/70' : 'text-muted-foreground'}`}>{sub}</div>}
    </div>
  );
}

// ── Time range selector ────────────────────────────────────────────────────────

const RANGES = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d',        label: 'Last 7 days' },
  { key: '30d',       label: 'Last 30 days' },
  { key: 'custom',    label: 'Custom Range' },
];

function RangeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 pl-3 pr-7 text-xs font-medium border border-border rounded-lg bg-card hover:bg-muted text-foreground focus:outline-none cursor-pointer appearance-none"
      >
        {RANGES.map((r) => (
          <option key={r.key} value={r.key}>{r.label}</option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ── PAGE_SIZE ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ── All events (all tenants) ──────────────────────────────────────────────────

const ALL_EVENTS = Object.entries(EVENTS_BY_TENANT).flatMap(([id, evts]) => {
  const tenant = TENANTS.find((t) => t.id === id)!;
  return evts.map((e) => ({ ...e, tenantId: id, tenantName: tenant?.name ?? id, tenantColor: tenant?.color ?? '#9ca3af' }));
}).sort((a, b) => b.ts.localeCompare(a.ts));

const LOG_PAGE_SIZE = 10;

// ── Threat type colors ────────────────────────────────────────────────────────

const THREAT_TYPE_COLORS: Record<string, string> = {
  unauthorized: '#d97706',
  posture:      '#3b82f6',
  c2:           '#dc2626',
  lateral:      '#f87171',
  dns:          '#0ea5e9',
  mfa:          '#f59e0b',
  geo:          '#8b5cf6',
};

const DEVICE_THREAT_TYPE_COLORS: Record<string, string> = {
  'Ransomware':       '#ef4444',
  'Trojan':           '#f97316',
  'Adware':           '#d97706',
  'Cryptominer':      '#8b5cf6',
  'Spyware':          '#ec4899',
  'Worm':             '#06b6d4',
  'Backdoor':         '#dc2626',
  'Rootkit':          '#7c3aed',
  'Exploit':          '#b45309',
  'PUP':              '#6b7280',
  'PUA':              '#9ca3af',
  'Suspicious Shell': '#f59e0b',
  'Suspicious File':  '#3b82f6',
};

const DEVICE_THREATS_BY_TYPE = (() => {
  const counts: Record<string, number> = {};
  DEVICE_THREATS.forEach((r) => {
    const type = r.sub.split(' · ')[0];
    counts[type] = (counts[type] ?? 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      key:   label.toLowerCase().replace(/\s+/g, '-'),
      label,
      count,
      color: DEVICE_THREAT_TYPE_COLORS[label] ?? '#9ca3af',
    }));
})();

// ── Donut pie chart ───────────────────────────────────────────────────────────

function ThreatPieChart({ data }: {
  data: Array<{ key: string; label: string; count: number; color: string }>;
}) {
  const [hoveredIdx, setHoveredIdx]     = useState<number | null>(null);
  const [tooltipPos, setTooltipPos]     = useState({ x: 0, y: 0 });

  const total = data.reduce((s, d) => s + d.count, 0);
  const cx = 100, cy = 100, outerR = 78, innerR = 48;

  let angle = -Math.PI / 2;
  const segments = data.map((d) => {
    const sweep = total > 0 ? (d.count / total) * 2 * Math.PI : 0;
    const start = angle;
    const end   = angle + sweep;
    angle = end;

    const cos1 = Math.cos(start), sin1 = Math.sin(start);
    const cos2 = Math.cos(end),   sin2 = Math.sin(end);
    const large = sweep > Math.PI ? 1 : 0;

    const ox1 = cx + outerR * cos1, oy1 = cy + outerR * sin1;
    const ox2 = cx + outerR * cos2, oy2 = cy + outerR * sin2;
    const ix1 = cx + innerR * cos1, iy1 = cy + innerR * sin1;
    const ix2 = cx + innerR * cos2, iy2 = cy + innerR * sin2;

    const path = sweep < 0.001 ? '' :
      `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${large} 1 ${ox2} ${oy2} ` +
      `L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`;

    return { ...d, path };
  });

  const hovered = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div className="flex flex-col items-center px-3 py-3">
      <div className="relative w-44 h-44">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx={cx} cy={cy} r={outerR + 1} fill="white" />
          {segments.map((seg, i) =>
            seg.path ? (
              <path
                key={seg.key}
                d={seg.path}
                fill={seg.color}
                opacity={hoveredIdx === null || hoveredIdx === i ? 1 : 0.35}
                className="cursor-pointer transition-opacity duration-150"
                onMouseEnter={(e) => {
                  setHoveredIdx(i);
                  const rect = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect();
                  setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                onMouseMove={(e) => {
                  const rect = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect();
                  setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ filter: hoveredIdx === i ? 'brightness(1.1)' : undefined }}
              />
            ) : null
          )}
          <circle cx={cx} cy={cy} r={innerR - 1} fill="white" />
          <text x={cx} y={cy + 7} textAnchor="middle"
            style={{ fontSize: 22, fontWeight: 800, fill: '#1a1a1a' }}>
            {total.toLocaleString()}
          </text>
        </svg>

        {hovered && (
          <div
            className="absolute pointer-events-none z-10 bg-white border border-border rounded-lg shadow-md px-3 py-2"
            style={{
              left: tooltipPos.x + 14,
              top:  tooltipPos.y - 14,
              transform: tooltipPos.x > 180 ? 'translateX(calc(-100% - 28px))' : undefined,
            }}
          >
            <div className="text-[13px] font-bold" style={{ color: hovered.color }}>
              {hovered.count.toLocaleString()}
            </div>
            <div className="text-[12px] text-muted-foreground mt-0.5 whitespace-nowrap">{hovered.label}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tier chip helper ──────────────────────────────────────────────────────────

function TierChip({ tier, label }: { tier: 1 | 2 | 3 | 4; label?: string }) {
  const styles = {
    1: 'bg-destructive-subtle text-destructive',
    2: 'bg-warning-subtle text-warning',
    3: 'bg-action-subtle text-action',
    4: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] leading-none whitespace-nowrap ${styles[tier]}`}>
      {label ?? `T${tier}`}
    </span>
  );
}

// ── Action → status mapping ───────────────────────────────────────────────────

const ACTION_STATUS: Record<string, { label: string; variant: 'success' | 'neutral' | 'warning' | 'error' | 'info' }> = {
  'Kill Process':               { label: 'Process Killed',      variant: 'success' },
  'Kill Process Tree':          { label: 'Process Tree Killed', variant: 'success' },
  'Quarantine File':            { label: 'Quarantined',         variant: 'neutral' },
  'Isolate Device':             { label: 'Isolated',            variant: 'neutral' },
  'Unisolate Device':           { label: 'Unisolated',          variant: 'success' },
  'Add to Exclusions':          { label: 'Excluded',            variant: 'neutral' },
  'Restore Affected File':      { label: 'File Restored',       variant: 'success' },
};

// ── All-Tenants view (Option 2 layout) ───────────────────────────────────────

function AllTenantsView({
  range,
  onRangeChange,
  onDrilldown,
}: {
  range: string;
  onRangeChange: (r: string) => void;
  onDrilldown: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [devicePage, setDevicePage]   = useState(1);
  const [domainPage, setDomainPage]   = useState(1);
  const [rowActions, setRowActions]   = useState<Record<number, string>>({});
  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());

  const [deviceSearch,          setDeviceSearch]          = useState('');
  const [deviceStatusFilter,    setDeviceStatusFilter]    = useState('');
  const [deviceSeverityFilter,  setDeviceSeverityFilter]  = useState('');
  const [domainSearch,          setDomainSearch]          = useState('');
  const [domainStatusFilter,    setDomainStatusFilter]    = useState('');
  const [domainSeverityFilter,  setDomainSeverityFilter]  = useState('');

  // ── Aggregate data ──────────────────────────────────────────────────────────
  const aggCounts = THREAT_TYPES.map((tt) => ({
    ...tt,
    count: Math.round(TENANTS.reduce((s, t) => s + t.counts[tt.key], 0) * (RANGE_MULT[range] ?? 1)),
  }));

  const sorted = [...TENANTS].sort((a, b) => tenantTotal(b, range) - tenantTotal(a, range));
  const maxTotal = Math.max(...sorted.map((t) => tenantTotal(t, range)), 1);

  const activeTenants = sorted.filter((t) => tenantTotal(t, range) > 0);

  // ── Response overview stats ─────────────────────────────────────────────────
  const needActionRows  = DEVICE_THREATS.filter((r) => r.status === 'Not Quarantined');
  const autoContainedCount = DEVICE_THREATS.filter((r) => r.status === 'Process Killed').length;
  const quarantinedCount   = DEVICE_THREATS.filter((r) => r.status === 'Quarantined').length;
  const containedTotal     = autoContainedCount + quarantinedCount;

  // ── Response queue rows (filtered) ─────────────────────────────────────────
  const deviceSearchLower = deviceSearch.toLowerCase();
  const filteredDeviceThreats = DEVICE_THREATS.filter((r) => {
    if (deviceSearch && !r.name.toLowerCase().includes(deviceSearchLower) &&
        !r.endpoint.toLowerCase().includes(deviceSearchLower) &&
        !r.uname.toLowerCase().includes(deviceSearchLower)) return false;
    if (deviceStatusFilter && r.status !== deviceStatusFilter) return false;
    if (deviceSeverityFilter && r.severity !== deviceSeverityFilter) return false;
    return true;
  });
  const queueNeedAction  = filteredDeviceThreats.filter((r) => r.status === 'Not Quarantined');
  const queueContained   = filteredDeviceThreats.filter((r) => r.status !== 'Not Quarantined');

  // ── Device threats pagination ───────────────────────────────────────────────
  const DEVICE_PAGE_SIZE = 10;
  const allDeviceRows    = [...queueNeedAction, ...queueContained];
  const deviceTotalPages = Math.max(1, Math.ceil(allDeviceRows.length / DEVICE_PAGE_SIZE));
  const safeDevicePage   = Math.min(devicePage, deviceTotalPages);
  const devicePageRows   = allDeviceRows.slice((safeDevicePage - 1) * DEVICE_PAGE_SIZE, safeDevicePage * DEVICE_PAGE_SIZE);
  const deviceSepAbsIdx  = queueNeedAction.length;
  const devicePageStart  = (safeDevicePage - 1) * DEVICE_PAGE_SIZE;
  const deviceSepRelIdx  = deviceSepAbsIdx - devicePageStart;
  const showDeviceSep    = deviceSepRelIdx > 0 && deviceSepRelIdx < devicePageRows.length;

  // ── Checkbox helpers ────────────────────────────────────────────────────────
  const allChecked  = devicePageRows.length > 0 && devicePageRows.every((r) => checkedRows.has(r.id));
  const someChecked = !allChecked && devicePageRows.some((r) => checkedRows.has(r.id));
  function toggleAll() {
    setCheckedRows((prev) => {
      const next = new Set(prev);
      if (allChecked) devicePageRows.forEach((r) => next.delete(r.id));
      else devicePageRows.forEach((r) => next.add(r.id));
      return next;
    });
  }
  function toggleRow(id: number) {
    setCheckedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // ── Domain threats pagination ───────────────────────────────────────────────
  const domainSearchLower = domainSearch.toLowerCase();
  const filteredDomainEvents = DOMAIN_THREAT_EVENTS.filter((r) => {
    if (domainSearch && !r.type.toLowerCase().includes(domainSearchLower) &&
        !r.device.toLowerCase().includes(domainSearchLower) &&
        !r.tenant.toLowerCase().includes(domainSearchLower)) return false;
    if (domainStatusFilter && r.status !== domainStatusFilter) return false;
    if (domainSeverityFilter && r.severity !== domainSeverityFilter) return false;
    return true;
  });
  const DOMAIN_PAGE_SIZE  = 10;
  const domainTotalPages  = Math.max(1, Math.ceil(filteredDomainEvents.length / DOMAIN_PAGE_SIZE));
  const safeDomainPage    = Math.min(domainPage, domainTotalPages);
  const domainPageEvents  = filteredDomainEvents.slice((safeDomainPage - 1) * DOMAIN_PAGE_SIZE, safeDomainPage * DOMAIN_PAGE_SIZE);

  // ── Export ──────────────────────────────────────────────────────────────────
  function handleExport() {
    exportCSV(
      ['Incident','Severity','Device','User','Email','Status','Time'],
      DEVICE_THREATS.map((r) => [r.name, r.severity, r.endpoint, r.uname, r.uemail, r.status, r.time]),
      'threats-response-queue.csv',
    );
  }

  const rangeLabel: Record<string, string> = {
    today: 'Today', yesterday: 'Yesterday', '7d': 'Last 7 days', '30d': 'Last 30 days', custom: 'Custom range',
  };

  return (
    <div className="space-y-5 pb-10">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Threats</h1>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <RangeSelector value={range} onChange={onRangeChange} />
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-border rounded-lg bg-card hover:bg-muted text-foreground transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* ── Security Traffic Flow (full width) ───────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border">
          <span className="text-sm font-bold text-foreground">Security Traffic Flow</span>
          <span className="text-xs text-muted-foreground">
            How 20,784 threats were intercepted across enforcement layers — {rangeLabel[range] ?? range}
          </span>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center gap-5 flex-wrap mb-3">
            {BT_FUNNEL_STAGES.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-[13px] font-semibold text-foreground">{s.name}</span>
                <span className="text-[13px] font-semibold text-foreground">{s.count.toLocaleString()}</span>
              </div>
            ))}
            <span className="ml-auto text-[13px] text-muted-foreground whitespace-nowrap">
              20,768 threats stopped before reaching any device
            </span>
          </div>
          <BlockedThreatsFunnelChart />
        </div>
      </div>

      {/* ── Insights 3-col grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3.5">

        {/* Domain threats by type */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-bold text-foreground">Domain threats by type</span>
            <span className="text-[11px] text-muted-foreground">{rangeLabel[range] ?? range}</span>
          </div>
          <ThreatPieChart
            data={aggCounts.map((tt) => ({
              key:   tt.key,
              label: tt.label,
              count: tt.count,
              color: THREAT_TYPE_COLORS[tt.key] ?? '#9ca3af',
            }))}
          />
        </div>

        {/* Tenants by risk */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-bold text-foreground">Tenants by risk</span>
            <button
              onClick={() => navigate('/tenant-management')}
              className="text-[11px] font-medium text-action hover:text-action/80 transition-colors"
            >
              View all
            </button>
          </div>
          <div className="px-4 py-3 space-y-2.5">
            {activeTenants.slice(0, 4).map((t) => {
              const tot = tenantTotal(t, range);
              const crit = tenantCritical(t, range);
              return (
                <div key={t.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onDrilldown(t.id)}
                      className="flex items-center gap-1.5 min-w-0 text-left group"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="text-[11px] font-medium text-foreground group-hover:text-action truncate transition-colors">{t.name}</span>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {crit > 0 && (
                        <StatusBadge variant="error">{crit} crit</StatusBadge>
                      )}
                      <span className="text-[11px] font-bold text-foreground tabular-nums">{tot.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(tot / maxTotal) * 100}%`, backgroundColor: t.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device threats by type */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-bold text-foreground">Device threats by type</span>
          </div>
          <ThreatPieChart data={DEVICE_THREATS_BY_TYPE} />
        </div>

      </div>

      {/* ── Device Threats ───────────────────────────────────────────────────── */}
      <div>
        {/* section header */}
        <h2 className="text-base font-bold text-foreground mb-3">Device threats</h2>

        {/* Response overview cards */}
        <div className="flex gap-3 mb-4">
          {[
            { label: 'Total Device Threats', value: DEVICE_THREATS.length,  sub: 'Reached device',      variant: 'info' as const    },
            { label: 'Awaiting Action',       value: needActionRows.length,  sub: 'Needs MSP response',  variant: 'warning' as const },
            { label: 'Quarantined',           value: quarantinedCount,       sub: 'File isolated',       variant: 'neutral' as const },
            { label: 'Auto Contained',        value: autoContainedCount,     sub: 'Process killed',      variant: 'success' as const },
          ].map(({ label, value, sub, variant }) => (
            <div key={label} className="flex-1 bg-card border border-border rounded-[12px] p-4 shadow-sm min-w-0">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.04em] mb-1">{label}</div>
              <div className="text-[26px] font-extrabold text-foreground tabular-nums leading-none mb-2">{value}</div>
              <StatusBadge variant={variant}>{sub}</StatusBadge>
            </div>
          ))}
        </div>

        <TablePanel>
          {/* toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-wrap">
            <div className="relative w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search threats…"
                value={deviceSearch}
                onChange={(e) => { setDeviceSearch(e.target.value); setDevicePage(1); }}
                className="w-full pl-8 pr-3 h-8 text-[13px] border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-action/40"
              />
            </div>
            <select
              value={deviceStatusFilter}
              onChange={(e) => { setDeviceStatusFilter(e.target.value); setDevicePage(1); }}
              className="h-8 px-2.5 text-[13px] border border-border rounded-lg bg-card text-foreground outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Not Quarantined">Not Quarantined</option>
              <option value="Process Killed">Process Killed</option>
              <option value="Quarantined">Quarantined</option>
            </select>
            <select
              value={deviceSeverityFilter}
              onChange={(e) => { setDeviceSeverityFilter(e.target.value); setDevicePage(1); }}
              className="h-8 px-2.5 text-[13px] border border-border rounded-lg bg-card text-foreground outline-none cursor-pointer"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <DataTable>
              <THead>
                <tr>
                  <TH className="w-8 pr-0">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = someChecked; }}
                      onChange={toggleAll}
                      className="w-3.5 h-3.5 accent-[#0066cc] cursor-pointer"
                    />
                  </TH>
                  {['Timestamp', 'Threat Name', 'Severity', 'Tenant', 'Device', 'Status', 'Action'].map((h) => (
                    <TH key={h}>{h}</TH>
                  ))}
                </tr>
              </THead>
              <tbody>
                {devicePageRows.map((r, relIdx) => {
                  const isNeedAction = r.status === 'Not Quarantined';
                  const sepHere = showDeviceSep && relIdx === deviceSepRelIdx;
                  return (
                    <Fragment key={r.id}>
                      {sepHere && (
                        <tr>
                          <td colSpan={8} className="px-5 py-2 bg-muted/50 border-y border-border">
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                              <Shield className="w-3.5 h-3.5 text-success shrink-0" />
                              Blocked before reaching device — 20,768 events in period
                            </div>
                          </td>
                        </tr>
                      )}
                      <TR>
                        {/* Checkbox */}
                        <TD className="w-8 pr-0">
                          <input
                            type="checkbox"
                            checked={checkedRows.has(r.id)}
                            onChange={() => toggleRow(r.id)}
                            className="w-3.5 h-3.5 accent-[#0066cc] cursor-pointer"
                          />
                        </TD>
                        {/* Timestamp */}
                        <TD><span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">{r.time}</span></TD>
                        {/* Threat Name */}
                        <TD>
                          <span className="text-[13px] font-semibold text-foreground">{r.name}</span>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{r.sub}</div>
                        </TD>
                        {/* Severity */}
                        <TD>
                          {r.severity === 'Low'
                            ? <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.04em] px-2 py-0.5 rounded-full bg-green-100 text-green-700">Low</span>
                            : <SeverityChip level={r.severity === 'Critical' ? 'crit' : r.severity === 'High' ? 'high' : 'med'}>{r.severity}</SeverityChip>
                          }
                        </TD>
                        {/* Tenant */}
                        <TD>
                          <span className="text-[12px] font-medium text-foreground">Riverside Dental</span>
                        </TD>
                        {/* Device */}
                        <TD className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">{r.endpoint}</TD>
                        {/* Status */}
                        <TD>
                          {(() => {
                            const applied = rowActions[r.id];
                            if (applied) {
                              const s = ACTION_STATUS[applied];
                              return <StatusBadge variant={s.variant} dot>{s.label}</StatusBadge>;
                            }
                            return (
                              <StatusBadge
                                variant={r.status === 'Not Quarantined' ? 'warning' : r.status === 'Process Killed' ? 'success' : 'neutral'}
                                dot
                              >
                                {r.status === 'Not Quarantined' ? 'Not Quarantined' : r.status === 'Process Killed' ? 'Process Killed' : 'Quarantined'}
                              </StatusBadge>
                            );
                          })()}
                        </TD>
                        {/* Action */}
                        <TD>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-7 h-7 flex items-center justify-center rounded-md border border-border hover:bg-muted text-muted-foreground transition-colors">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              {(() => {
                                const appliedAction  = rowActions[r.id];
                                const effectiveLabel = appliedAction
                                  ? ACTION_STATUS[appliedAction]?.label
                                  : r.status;
                                const isProcessKilled  = effectiveLabel === 'Process Killed' || effectiveLabel === 'Process Tree Killed';
                                const isQuarantined    = effectiveLabel === 'Quarantined';

                                return (
                                  <>
                                    <DropdownMenuItem
                                      className="text-xs cursor-pointer"
                                      disabled={isProcessKilled}
                                      onClick={() => setRowActions((prev) => ({ ...prev, [r.id]: 'Kill Process' }))}
                                    >
                                      Kill Process
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-xs cursor-pointer"
                                      disabled={isProcessKilled}
                                      onClick={() => setRowActions((prev) => ({ ...prev, [r.id]: 'Kill Process Tree' }))}
                                    >
                                      Kill Process Tree
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-xs cursor-pointer"
                                      disabled={isQuarantined}
                                      onClick={() => setRowActions((prev) => ({ ...prev, [r.id]: 'Quarantine File' }))}
                                    >
                                      Quarantine File
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-xs cursor-pointer"
                                      onClick={() => setRowActions((prev) => ({
                                        ...prev,
                                        [r.id]: prev[r.id] === 'Isolate Device' ? 'Unisolate Device' : 'Isolate Device',
                                      }))}
                                    >
                                      {rowActions[r.id] === 'Isolate Device' ? 'Unisolate Device' : 'Isolate / Unisolate Device'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-xs cursor-pointer"
                                      onClick={() => setRowActions((prev) => ({ ...prev, [r.id]: 'Add to Exclusions' }))}
                                    >
                                      Add to Exclusions
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-xs cursor-pointer"
                                      onClick={() => setRowActions((prev) => ({ ...prev, [r.id]: 'Restore Affected File' }))}
                                    >
                                      Restore Affected File
                                    </DropdownMenuItem>
                                  </>
                                );
                              })()}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TD>
                      </TR>
                    </Fragment>
                  );
                })}
              </tbody>
            </DataTable>
          </div>

          {/* table footer */}
          <TableFoot>
            <span>
              Showing {(safeDevicePage - 1) * DEVICE_PAGE_SIZE + 1}–{Math.min(safeDevicePage * DEVICE_PAGE_SIZE, allDeviceRows.length)} of {allDeviceRows.length}{allDeviceRows.length < DEVICE_THREATS.length ? ` (filtered from ${DEVICE_THREATS.length})` : ''} device threat events
            </span>
            {deviceTotalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDevicePage((p) => Math.max(1, p - 1))}
                  disabled={safeDevicePage <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: deviceTotalPages }, (_, i) => i + 1)
                  .filter((p) => deviceTotalPages <= 7 || p <= 2 || p >= deviceTotalPages - 1 || Math.abs(p - safeDevicePage) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-muted-foreground">…</span>
                      )}
                      <button
                        onClick={() => setDevicePage(p)}
                        className={`w-7 h-7 flex items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                          p === safeDevicePage
                            ? 'bg-action text-action-foreground border-action'
                            : 'border-border hover:bg-muted text-foreground'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setDevicePage((p) => Math.min(deviceTotalPages, p + 1))}
                  disabled={safeDevicePage >= deviceTotalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </TableFoot>
        </TablePanel>
      </div>

      {/* ── Domain Threats ───────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2.5 mb-3 flex-wrap">
          <h2 className="text-base font-bold text-foreground">Domain threats</h2>
        </div>
        <TablePanel>
          {/* toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-wrap">
            <div className="relative w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search threats…"
                value={domainSearch}
                onChange={(e) => { setDomainSearch(e.target.value); setDomainPage(1); }}
                className="w-full pl-8 pr-3 h-8 text-[13px] border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-action/40"
              />
            </div>
            <select
              value={domainStatusFilter}
              onChange={(e) => { setDomainStatusFilter(e.target.value); setDomainPage(1); }}
              className="h-8 px-2.5 text-[13px] border border-border rounded-lg bg-card text-foreground outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Blocked">Blocked</option>
            </select>
            <select
              value={domainSeverityFilter}
              onChange={(e) => { setDomainSeverityFilter(e.target.value); setDomainPage(1); }}
              className="h-8 px-2.5 text-[13px] border border-border rounded-lg bg-card text-foreground outline-none cursor-pointer"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <DataTable>
              <THead>
                <tr>
                  {['Timestamp', 'Threat Type', 'Tenant', 'Severity', 'Device', 'Status'].map((h) => (
                    <TH key={h}>{h}</TH>
                  ))}
                </tr>
              </THead>
              <tbody>
                {domainPageEvents.map((r) => (
                  <TR key={r.id}>
                    <TD><span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">{r.ts}</span></TD>
                    <TD><span className="font-semibold">{r.type}</span></TD>
                    <TD>{r.tenant}</TD>
                    <TD>
                      {r.severity === 'Low'
                        ? <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.04em] px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d]">Low</span>
                        : <SeverityChip level={r.severity === 'Critical' ? 'crit' : r.severity === 'High' ? 'high' : 'med'}>{r.severity}</SeverityChip>
                      }
                    </TD>
                    <TD><span className="font-mono text-xs text-[var(--color-text-muted)]">{r.device}</span></TD>
                    <TD><StatusBadge variant="neutral">{r.status}</StatusBadge></TD>
                  </TR>
                ))}
              </tbody>
            </DataTable>
          </div>
          <TableFoot>
            <span>
              Showing {(safeDomainPage - 1) * DOMAIN_PAGE_SIZE + 1}–{Math.min(safeDomainPage * DOMAIN_PAGE_SIZE, filteredDomainEvents.length)} of {filteredDomainEvents.length}{filteredDomainEvents.length < DOMAIN_THREAT_EVENTS.length ? ` (filtered from ${DOMAIN_THREAT_EVENTS.length})` : ''} domain-layer threat events
            </span>
            {domainTotalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDomainPage((p) => Math.max(1, p - 1))}
                  disabled={safeDomainPage <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: domainTotalPages }, (_, i) => i + 1)
                  .filter((p) => domainTotalPages <= 7 || p <= 2 || p >= domainTotalPages - 1 || Math.abs(p - safeDomainPage) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-muted-foreground">…</span>
                      )}
                      <button
                        onClick={() => setDomainPage(p)}
                        className={`w-7 h-7 flex items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                          p === safeDomainPage
                            ? 'bg-action text-action-foreground border-action'
                            : 'border-border hover:bg-muted text-foreground'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setDomainPage((p) => Math.min(domainTotalPages, p + 1))}
                  disabled={safeDomainPage >= domainTotalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </TableFoot>
        </TablePanel>
      </div>

    </div>
  );
}

// ── Per-tenant drill-down view ─────────────────────────────────────────────────

function DrilldownView({
  tenantId,
  range,
  onRangeChange,
  onBack,
}: {
  tenantId: string;
  range: string;
  onRangeChange: (r: string) => void;
  onBack: () => void;
}) {
  const tenant = TENANTS.find((t) => t.id === tenantId)!;
  const allEvents = EVENTS_BY_TENANT[tenantId] ?? [];

  const [search,       setSearch]       = useState('');
  const [filterThreat, setFilterThreat] = useState('');
  const [filterApp,    setFilterApp]    = useState('');
  const [filterSev,    setFilterSev]    = useState('');
  const [page,         setPage]         = useState(1);

  const apps = useMemo(
    () => [...new Set(allEvents.map((e) => e.app).filter((a) => a && a !== '—'))].sort(),
    [allEvents],
  );

  const filtered = useMemo(() => {
    return allEvents.filter((e) => {
      const q = search.toLowerCase();
      if (q && !e.user.toLowerCase().includes(q) && !e.ip.includes(q)) return false;
      if (filterThreat && e.type !== filterThreat) return false;
      if (filterApp    && e.app !== filterApp)     return false;
      if (filterSev    && e.severity !== filterSev) return false;
      return true;
    });
  }, [allEvents, search, filterThreat, filterApp, filterSev]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageEvents = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const tot          = tenantTotal(tenant, range);
  const crit         = tenantCritical(tenant, range);
  const unauthorized = scaled(tenant.counts.unauthorized, range);
  const mfa          = scaled(tenant.counts.mfa, range);

  function handleExport() {
    exportCSV(
      ['Timestamp','Threat Type','User','Source IP','Destination App','Policy Matched','Severity','Action Taken'],
      filtered.map((e) => [e.ts, e.type, e.user, e.ip, e.app, e.policy, e.severity, e.action]),
      `blocked-threats-${tenantId}.csv`,
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-[#0066cc] hover:text-[#0052a6] mb-2 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
            Threats
          </button>
          <h1 className="text-2xl font-bold text-foreground">{tenant.name} — Blocked Threats</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filterSev ? `${filterSev} severity threats for this tenant` : 'Blocked threats filtered by tenant'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <RangeSelector value={range} onChange={onRangeChange} />
          <button onClick={onBack} className="h-8 px-3 text-xs font-medium border border-border rounded-lg bg-card hover:bg-muted text-foreground transition-colors">
            ← All Tenants
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium border border-border rounded-lg bg-card hover:bg-muted text-foreground transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex gap-4 flex-wrap">
        <StatCard label="Total Blocked"      value={tot.toLocaleString()}    sub="in selected period" accent />
        <StatCard label="Critical Events"    value={crit.toString()}         sub="C2 + lateral movement" />
        <StatCard label="Unauthorized Access" value={unauthorized.toString()} trend={{ text: 'Top threat type', up: true }} />
        <StatCard label="MFA Failures"       value={mfa.toString()} />
      </div>

      {/* Event log */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <span className="text-sm font-medium text-foreground">Event Log — {tenant.name}</span>
          <span className="text-xs text-muted-foreground">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap px-5 py-3 border-b border-border">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search user or IP…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-8 pl-8 pr-3 w-52 text-sm border border-input rounded-lg bg-muted focus:outline-none focus:border-action focus:bg-card"
            />
          </div>
          {[
            { id: 'threat', label: 'All Threat Types', value: filterThreat, set: setFilterThreat, options: THREAT_TYPES.map((t) => t.label) },
            { id: 'app',    label: 'All Applications',  value: filterApp,    set: setFilterApp,    options: apps },
            { id: 'sev',    label: 'All Severities',    value: filterSev,    set: setFilterSev,    options: ['Critical','High','Medium'] },
          ].map(({ id, label, value, set, options }) => (
            <select
              key={id}
              value={value}
              onChange={(e) => { set(e.target.value); setPage(1); }}
              className="h-8 px-2.5 text-sm border border-input rounded-lg bg-card focus:outline-none cursor-pointer text-foreground"
            >
              <option value="">{label}</option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          <button
            onClick={() => { setSearch(''); setFilterThreat(''); setFilterApp(''); setFilterSev(''); setPage(1); }}
            className="h-8 px-3 text-xs font-medium border border-border rounded-lg bg-card hover:bg-muted text-muted-foreground transition-colors ml-auto"
          >
            Clear Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {allEvents.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Shield className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
              <div className="text-sm font-semibold text-foreground">No blocked threats in selected period</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">No events match the current filters.</div>
          ) : (
            <DataTable>
              <THead>
                <tr>
                  {['Timestamp','Threat Type','User','Source IP','Destination App','Policy Matched','Severity','Action'].map((h) => (
                    <TH key={h}>{h}</TH>
                  ))}
                </tr>
              </THead>
              <tbody>
                {pageEvents.map((e, i) => (
                  <TR key={i}>
                    <TD className="text-xs text-muted-foreground whitespace-nowrap font-mono">{e.ts}</TD>
                    <TD className="text-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        {SEV[e.severity]?.level === 'crit'
                          ? <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-destructive" />
                          : <Shield className="w-3.5 h-3.5 shrink-0 text-warning" />}
                        {e.type}
                      </span>
                    </TD>
                    <TD className="text-foreground">{e.user}</TD>
                    <TD className="text-xs font-mono text-muted-foreground">{e.ip}</TD>
                    <TD className="text-foreground">{e.app}</TD>
                    <TD className="text-xs text-muted-foreground">{e.policy}</TD>
                    <TD><SeverityChip level={SEV[e.severity]?.level ?? 'med'}>{e.severity}</SeverityChip></TD>
                    <TD><StatusBadge variant="neutral">{e.action}</StatusBadge></TD>
                  </TR>
                ))}
              </tbody>
            </DataTable>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-muted-foreground">
            <span>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} events
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => totalPages <= 7 || p <= 2 || p >= totalPages - 1 || Math.abs(p - safePage) <= 1)
                .map((p, idx, arr) => (
                  <span key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-muted-foreground">…</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 flex items-center justify-center rounded-md border text-xs font-medium transition-colors ${
                        p === safePage
                          ? 'bg-action text-action-foreground border-action'
                          : 'border-border hover:bg-muted text-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Root page component ────────────────────────────────────────────────────────

export function BlockedThreatsPage() {
  const [range, setRange]             = useState('yesterday');
  const [drilldownId, setDrilldownId] = useState<string | null>(null);

  const handleDrilldown = useCallback((id: string) => {
    setDrilldownId(id);
  }, []);

  const handleBack = useCallback(() => {
    setDrilldownId(null);
  }, []);

  if (drilldownId) {
    return (
      <DrilldownView
        tenantId={drilldownId}
        range={range}
        onRangeChange={setRange}
        onBack={handleBack}
      />
    );
  }

  return (
    <AllTenantsView
      range={range}
      onRangeChange={setRange}
      onDrilldown={handleDrilldown}
    />
  );
}
