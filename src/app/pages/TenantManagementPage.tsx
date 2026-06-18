import { useMemo, useState, Fragment } from 'react';
import type { ReactNode } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Settings,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  CircleCheck,
  Clock,
  Cpu,
  Copy,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { TenantAvatar } from '../components/TenantAvatar';
import { StatusBadge as DSStatusBadge } from '../components/ds';

// ── Unified tenant data (merges activation + inventory/licensing) ─────────────────

type Status = 'Active' | 'Pending Setup';
type Tier = 'Premier' | 'Advanced' | 'Essential';

interface Tenant {
  id: string;
  name: string;
  status: Status;
  tier: Tier | null;
  licensesUsed: number;
  licensesTotal: number;
  policies: number | null;
  users: number | null;
  supportExpiry: string | null;
  renewalDays: number | null; // days until support expiry; null when N/A
  expired?: boolean;
  firmware: string | null; // version string, or null when unknown
  firmwareOutdated?: boolean;
  activationDate: string;
  lastActivity: string | null;
  activationKey: string;
}

const TENANTS: Tenant[] = [
  {
    id: '1', name: 'Acme Corporation', status: 'Active', tier: 'Premier',
    licensesUsed: 42, licensesTotal: 50, policies: 8, users: 6,
    supportExpiry: '09 Jul 2026', renewalDays: 35, firmware: '7.1.2',
    activationDate: '14 Oct 2026', lastActivity: '2 hrs ago', activationKey: 'ACME-9F2K-7QX4-7H8J',
  },
  {
    id: '2', name: 'Enterprise Solutions', status: 'Active', tier: 'Advanced',
    licensesUsed: 96, licensesTotal: 120, policies: 10, users: 9,
    supportExpiry: '18 Jun 2026', renewalDays: 14, firmware: '7.1.2',
    activationDate: '19 Sep 2026', lastActivity: '5 mins ago', activationKey: 'ENTP-4D8M-1ZR9-3K2P',
  },
  {
    id: '3', name: 'Global Services LLC', status: 'Active', tier: 'Advanced',
    licensesUsed: 64, licensesTotal: 80, policies: 14, users: 12,
    supportExpiry: '12 Aug 2026', renewalDays: 56, firmware: null,
    activationDate: '02 Nov 2026', lastActivity: '18 mins ago', activationKey: 'GLBL-2C7T-8WY5-9M4Q',
  },
  {
    id: '4', name: 'Riverside Dental Office', status: 'Active', tier: 'Essential',
    licensesUsed: 18, licensesTotal: 20, policies: 6, users: 5,
    supportExpiry: '02 May 2026', renewalDays: -46, expired: true, firmware: '7.0.9', firmwareOutdated: true,
    activationDate: '11 Aug 2026', lastActivity: '42 mins ago', activationKey: 'RVSD-6H1N-3PL2-5T8R',
  },
  {
    id: '5', name: 'Cloud Innovations', status: 'Pending Setup', tier: null,
    licensesUsed: 0, licensesTotal: 20, policies: null, users: null,
    supportExpiry: null, renewalDays: null, firmware: null,
    activationDate: '27 Oct 2026', lastActivity: null, activationKey: 'CLDI-8B3V-5KQ7-2W9X',
  },
];

// ── Shared atoms ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  if (status === 'Active') {
    return <DSStatusBadge variant="success" dot>Active</DSStatusBadge>;
  }
  return (
    <DSStatusBadge variant="info">
      <Clock className="w-3 h-3" />
      Pending Setup
    </DSStatusBadge>
  );
}

// Tier is a categorical (non-status) label; it uses neutral chip styling so it
// never competes with the semantic status colors.
const TIER_STYLE: Record<Tier, string> = {
  Premier: 'bg-action-subtle text-action',
  Advanced: 'bg-muted text-foreground',
  Essential: 'bg-muted text-muted-foreground',
};

function TierBadge({ tier }: { tier: Tier | null }) {
  if (!tier) return <span className="text-sm text-muted-foreground">—</span>;
  return <span className={`text-[11px] font-semibold uppercase tracking-[0.04em] px-2.5 py-0.5 rounded-full ${TIER_STYLE[tier]}`}>{tier}</span>;
}

function LicenseMeter({ used, total, compact = false }: { used: number; total: number; compact?: boolean }) {
  const pct = total === 0 ? 0 : Math.round((used / total) * 100);
  const color = pct >= 100 ? 'var(--destructive)' : pct >= 85 ? 'var(--warning)' : 'var(--action)';
  return (
    <div className={compact ? 'w-28' : 'w-36'}>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm font-medium text-foreground tabular-nums">
          {used}<span className="text-muted-foreground font-normal"> / {total}</span>
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
    </div>
  );
}

function RenewalPill({ tenant }: { tenant: Tenant }) {
  if (tenant.status === 'Pending Setup') return <span className="text-sm text-muted-foreground">—</span>;
  if (tenant.expired) {
    return (
      <div>
        <DSStatusBadge variant="error">Expired</DSStatusBadge>
        <div className="text-xs text-muted-foreground mt-1">{tenant.supportExpiry}</div>
      </div>
    );
  }
  const d = tenant.renewalDays ?? 999;
  const urgent = d <= 14;
  const soon = d <= 60;
  const variant = urgent ? 'error' : soon ? 'warning' : 'success';
  return (
    <div>
      <DSStatusBadge variant={variant}>{soon ? `${d}d left` : 'Active'}</DSStatusBadge>
      <div className="text-xs text-muted-foreground mt-1">{tenant.supportExpiry}</div>
    </div>
  );
}

function FirmwareCell({ tenant }: { tenant: Tenant }) {
  if (tenant.status === 'Pending Setup') return <span className="text-sm text-muted-foreground">—</span>;
  if (!tenant.firmware) {
    return <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">Unknown</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
      {tenant.firmware}
      {tenant.firmwareOutdated && <DSStatusBadge variant="warning">Update</DSStatusBadge>}
    </span>
  );
}

function ColHead({ children, align = 'left', className = '' }: { children: ReactNode; align?: 'left' | 'center' | 'right'; className?: string }) {
  const a = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  return (
    <th className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground whitespace-nowrap ${a} ${className}`}>
      {children}
    </th>
  );
}

function RowActions({ tenant }: { tenant: Tenant }) {
  if (tenant.status === 'Pending Setup') {
    return (
      <Button variant="outline" size="sm" className="h-8 rounded-lg gap-1.5">
        <Settings className="w-4 h-4" /> Continue Setup
      </Button>
    );
  }
  return (
    <Button variant="outline" size="sm" className="h-8 rounded-lg">
      View Details
    </Button>
  );
}

// ── Aggregates ────────────────────────────────────────────────────────────────────

function useAggregates() {
  return useMemo(() => {
    const licUsed = TENANTS.reduce((s, t) => s + t.licensesUsed, 0);
    const licTotal = TENANTS.reduce((s, t) => s + t.licensesTotal, 0);
    const renewalsDue = TENANTS.filter((t) => t.status === 'Active' && !t.expired && t.renewalDays !== null && t.renewalDays <= 60).length;
    const expired = TENANTS.filter((t) => t.expired).length;
    const firmwareAttention = TENANTS.filter((t) => t.status === 'Active' && (t.firmwareOutdated || !t.firmware)).length;
    const pending = TENANTS.filter((t) => t.status === 'Pending Setup').length;
    return { licUsed, licTotal, renewalsDue, expired, firmwareAttention, pending };
  }, []);
}

// At-risk first: expired → renewal urgent → firmware → renewal soon → healthy → pending.
function urgencyRank(t: Tenant): number {
  if (t.status === 'Pending Setup') return 6;
  if (t.expired) return 0;
  if (t.renewalDays !== null && t.renewalDays <= 14) return 1;
  if (t.firmwareOutdated || !t.firmware) return 2;
  if (t.renewalDays !== null && t.renewalDays <= 60) return 3;
  return 4;
}
const byUrgency = (a: Tenant, b: Tenant) => urgencyRank(a) - urgencyRank(b) || a.name.localeCompare(b.name);

// Pending tenants cannot be renewed / updated, so they are not selectable for bulk actions.
const isSelectable = (t: Tenant) => t.status !== 'Pending Setup';

function Check({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className="w-4 h-4 rounded border-input text-action focus:ring-action cursor-pointer accent-action"
    />
  );
}

function BulkActionBar({ count, onClear }: { count: number; onClear: () => void }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 bg-action text-action-foreground rounded-2xl px-4 py-2.5">
      <span className="text-sm font-medium">{count} tenant{count > 1 ? 's' : ''} selected</span>
      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-sm font-medium transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Renew
        </button>
        <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-sm font-medium transition-colors">
          <Cpu className="w-3.5 h-3.5" /> Update firmware
        </button>
        <button onClick={onClear} className="h-8 px-3 rounded-lg text-sm font-medium text-white/80 hover:text-white transition-colors">
          Clear
        </button>
      </div>
    </div>
  );
}


// ── OPTION B — Attention-first triage view ────────────────────────────────────────

type AttnFilter = 'all' | 'renewal' | 'expired' | 'firmware' | 'pending';

function OptionB({ search }: { search: string }) {
  const agg = useAggregates();
  const [filter, setFilter] = useState<AttnFilter>('all');
  const [open, setOpen] = useState<string | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());

  const matchesFilter = (t: Tenant) => {
    switch (filter) {
      case 'renewal': return t.status === 'Active' && !t.expired && t.renewalDays !== null && t.renewalDays <= 60;
      case 'expired': return !!t.expired;
      case 'firmware': return t.status === 'Active' && (t.firmwareOutdated || !t.firmware);
      case 'pending': return t.status === 'Pending Setup';
      default: return true;
    }
  };

  const rows = TENANTS
    .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) && matchesFilter(t))
    .sort(byUrgency);

  const selectable = rows.filter(isSelectable);
  const allSelected = selectable.length > 0 && selectable.every((t) => sel.has(t.id));
  const toggle = (id: string) => setSel((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSel(allSelected ? new Set() : new Set(selectable.map((t) => t.id)));

  const chips: { id: AttnFilter; label: string; count: number; tone?: 'red' | 'amber' }[] = [
    { id: 'all', label: 'All Tenants', count: TENANTS.length },
    { id: 'renewal', label: 'Needs Renewal', count: agg.renewalsDue, tone: 'amber' },
    { id: 'expired', label: 'Expired', count: agg.expired, tone: 'red' },
    { id: 'firmware', label: 'Firmware Outdated', count: agg.firmwareAttention, tone: 'amber' },
    { id: 'pending', label: 'Pending Setup', count: agg.pending },
  ];

  return (
    <div className="space-y-5">
      {/* Attention banner */}
      <div className="bg-warning-subtle border border-warning/30 rounded-2xl px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="text-sm text-foreground">
          <span className="font-semibold">{agg.expired} contract expired</span> ·{' '}
          <span className="font-semibold">{agg.renewalsDue} renewals due within 60 days</span> ·{' '}
          <span className="font-semibold">{agg.firmwareAttention} firmware updates available</span>.
          <span className="text-muted-foreground"> Review the flagged tenants below to keep all accounts protected.</span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => {
          const active = filter === c.id;
          const dot = c.tone === 'red' ? 'bg-destructive' : c.tone === 'amber' ? 'bg-warning' : 'bg-muted-foreground';
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`inline-flex items-center gap-2 h-8 px-3 rounded-full border text-sm font-medium transition-colors ${
                active ? 'bg-action text-action-foreground border-action' : 'bg-card text-foreground border-border hover:bg-muted'
              }`}
            >
              {c.id !== 'all' && <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : dot}`} />}
              {c.label}
              <span className={`text-xs tabular-nums ${active ? 'text-white/70' : 'text-muted-foreground'}`}>{c.count}</span>
            </button>
          );
        })}
      </div>

      <BulkActionBar count={sel.size} onClear={() => setSel(new Set())} />

      {/* Lean triage table with expandable detail */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              <ColHead className="w-10"><Check checked={allSelected} onChange={toggleAll} /></ColHead>
              <ColHead className="w-8"> </ColHead>
              <ColHead>Tenant</ColHead>
              <ColHead>Status</ColHead>
              <ColHead>Tier</ColHead>
              <ColHead>Licenses</ColHead>
              <ColHead>Support / Renewal</ColHead>
              <ColHead align="right">Actions</ColHead>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const isOpen = open === t.id;
              return (
                <Fragment key={t.id}>
                  <tr
                    className={`border-b border-border transition-colors cursor-pointer ${sel.has(t.id) ? 'bg-action-subtle' : 'hover:bg-muted/60'}`}
                    onClick={() => setOpen(isOpen ? null : t.id)}
                  >
                    <td className="pl-4 py-4">{isSelectable(t) && <Check checked={sel.has(t.id)} onChange={() => toggle(t.id)} />}</td>
                    <td className="py-4 text-muted-foreground">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <TenantAvatar size={32} />
                      <span className="text-[13px] font-medium text-foreground">{t.name}</span>
                    </div>
                  </td>
                    <td className="px-4 py-4"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-4"><TierBadge tier={t.tier} /></td>
                    <td className="px-4 py-4">
                      {t.status === 'Pending Setup'
                        ? <span className="text-sm text-muted-foreground">—</span>
                        : <LicenseMeter used={t.licensesUsed} total={t.licensesTotal} compact />}
                    </td>
                    <td className="px-4 py-4"><RenewalPill tenant={t} /></td>
                    <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}><RowActions tenant={t} /></td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-muted/40 border-b border-border">
                      <td colSpan={2} />
                      <td colSpan={6} className="px-4 py-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
                          <Detail label="License Breakdown" value={t.status === 'Pending Setup' ? 'Not provisioned' : `${t.licensesUsed} of ${t.licensesTotal} assigned`} />
                          <Detail label="Firmware" value={t.firmware ?? 'Unknown'} flag={t.firmwareOutdated ? 'Update available' : undefined} />
                          <Detail label="Policies" value={t.policies != null ? String(t.policies) : '—'} />
                          <Detail label="Users" value={t.users != null ? String(t.users) : '—'} />
                          <Detail label="Support Expiry" value={t.supportExpiry ?? '—'} flag={t.expired ? 'Expired' : undefined} flagTone="red" />
                          <Detail label="Activation Date" value={t.activationDate} />
                          <Detail label="Last Activity" value={t.lastActivity ?? '—'} />
                          <ActivationKey value={t.activationKey} />
                          <div className="flex items-end gap-2 md:col-span-3">
                            {(t.renewalDays !== null && (t.expired || t.renewalDays <= 60)) && (
                              <Button size="sm" className="h-8 rounded-lg gap-1.5 bg-action hover:bg-action-hover text-action-foreground">
                                <RefreshCw className="w-3.5 h-3.5" /> Renew
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="h-8 rounded-lg gap-1.5">
                              View Details <ArrowUpRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">No tenants match this filter.</div>
        )}
        <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground flex items-center gap-1.5">
          <CircleCheck className="w-3.5 h-3.5 text-success" />
          {rows.length} of {TENANTS.length} tenants shown · click a row to see full inventory &amp; licensing detail
        </div>
      </div>
    </div>
  );
}

function ActivationKey({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const last4 = value.replace(/[^A-Za-z0-9]/g, '').slice(-4);
  const masked = `••••–••••–••••–${last4}`;
  const copy = () => {
    navigator.clipboard?.writeText(value)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })
      .catch(() => {});
  };
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">Activation Key</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-mono text-sm text-foreground tracking-wide select-none">{masked}</span>
        <button
          onClick={copy}
          title="Copy activation key"
          aria-label="Copy activation key"
          className="flex items-center justify-center w-7 h-7 rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {copied ? <CircleCheck className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

function Detail({ label, value, flag, flagTone = 'amber' }: { label: string; value: string; flag?: string; flagTone?: 'amber' | 'red' }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-foreground flex items-center gap-2">
        {value}
        {flag && (
          <DSStatusBadge variant={flagTone === 'red' ? 'error' : 'warning'}>{flag}</DSStatusBadge>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────────

export function TenantManagementPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="flex flex-col gap-7 w-full max-w-[1438px] pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold leading-tight text-foreground">Tenant Management</h1>
        <p className="text-base text-muted-foreground mt-1">
          Monitor activation, licensing, support, and firmware across all your managed tenants
        </p>
      </div>

      {/* Search */}
      <div className="relative w-[302px]">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tenants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 bg-muted border border-input rounded-md pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-action"
        />
      </div>

      <OptionB search={search} />
    </div>
  );
}
