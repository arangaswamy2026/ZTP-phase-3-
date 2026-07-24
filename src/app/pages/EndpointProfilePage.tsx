import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Plus, ChevronDown, ChevronUp, X, ShieldOff, Ban, HardDrive, Sliders } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────

type EPRuleType = 'exclusion' | 'blocklist' | 'device' | 'custom';

interface EPRule {
  name: string;
  status: 'Enabled' | 'Disabled';
  type?: string;
  value?: string;
  hashType?: string;
  hash?: string;
  deviceClass?: string;
  action?: string;
  actionTaken?: string;
  severity?: string;
}

interface EPState {
  monitorMode: boolean;
  agentVersion: string;
  advOpen: boolean;
  advanced: Record<string, boolean>;
  rules: Record<EPRuleType, EPRule[]>;
}

type ModalState =
  | { open: false }
  | { open: true; type: EPRuleType; name: string; status: 'Enabled' | 'Disabled'; epType: string; value: string; hashType: string; action: string; actionTaken: string; severity: string; nameError: boolean };

// ── Constants ────────────────────────────────────────────────────────

const ADV_SETTINGS = ['Memory detection', 'Behavior detection', 'File detection', 'RTDMI cloud analysis', 'Telemetry cloud upload', 'Anti-tamper', 'Debug logs'];
const AGENT_VERSIONS = ['Always update to latest', '9.2.1.4012', '9.2.0.3890', '9.1.8.3402'];

const EMPTY_COPY: Record<EPRuleType, { title: string; body: string }> = {
  exclusion: { title: 'No exclusions configured', body: 'Files or hashes excluded from scanning will appear here.' },
  blocklist: { title: 'No blocklist entries configured', body: 'Hashes blocked from execution will appear here.' },
  device: { title: 'No device control rules configured', body: 'USB, camera, and other device class rules will appear here.' },
  custom: { title: 'No custom rules configured', body: 'Behavioral detection and response rules will appear here.' },
};

const RULE_COLS: Record<EPRuleType, string[]> = {
  exclusion: ['Type', 'Name', 'Value', 'Status'],
  blocklist: ['Hash type', 'Name', 'Hash', 'Status'],
  device: ['Class', 'Name', 'Action', 'Status'],
  custom: ['Name', 'Action taken', 'Severity', 'Status'],
};

const RULE_LABELS: Record<EPRuleType, string> = {
  exclusion: 'Exclusion',
  blocklist: 'Blocklist',
  device: 'Device control',
  custom: 'Custom rule',
};

const RULE_ICONS: Record<EPRuleType, React.ReactNode> = {
  exclusion: <ShieldOff className="w-5 h-5 text-[#717182]" />,
  blocklist:  <Ban        className="w-5 h-5 text-[#717182]" />,
  device:     <HardDrive  className="w-5 h-5 text-[#717182]" />,
  custom:     <Sliders    className="w-5 h-5 text-[#717182]" />,
};

// ── Sub-components ───────────────────────────────────────────────────

function EPStatusBadge({ status }: { status: 'Enabled' | 'Disabled' }) {
  return status === 'Enabled'
    ? <span className="inline-flex items-center rounded-full bg-[#eaf6ee] px-[8px] py-[2px] text-[11px] font-semibold text-[#1c7a3d]">Enabled</span>
    : <span className="inline-flex items-center rounded-full bg-[#f1f2f5] px-[8px] py-[2px] text-[11px] font-semibold text-[#6a7282]">Disabled</span>;
}

function EPToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-[38px] h-[21px] rounded-full relative transition-colors shrink-0 ${checked ? 'bg-[#0066cc]' : 'bg-[#ececf0]'}`}
    >
      <div className={`absolute top-[3px] w-[15px] h-[15px] rounded-full bg-white transition-transform ${checked ? 'translate-x-[20px]' : 'translate-x-[3px]'}`} />
    </button>
  );
}

function EPRuleTable({ type, rules, onAdd }: { type: EPRuleType; rules: EPRule[]; onAdd: () => void }) {
  const cols = RULE_COLS[type];
  const empty = EMPTY_COPY[type];

  return (
    <div className="bg-white rounded-[12px] border border-[#e5e7eb] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] overflow-hidden">
      <div className="px-[28px] py-[20px] flex flex-col gap-[16px]">
        <div className="flex items-center justify-between">
          <h3 className="font-['Inter',sans-serif] font-bold text-[15px] leading-[20px] text-[#101828]">{RULE_LABELS[type]}</h3>
          <button onClick={onAdd} className="flex items-center gap-[5px] h-[32px] px-[12px] rounded-[8px] border border-[#e5e7eb] bg-white text-[13px] font-medium text-[#364153] hover:bg-[#f9fafb]">
            <Plus className="w-[12px] h-[12px]" /> Create rule
          </button>
        </div>
        {rules.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-[12px] border border-dashed border-[#e5e7eb] rounded-[12px] py-[36px] px-[24px] bg-[#f9fafb]">
            <div className="w-10 h-10 rounded-[10px] bg-[#ececf0] flex items-center justify-center">
              {RULE_ICONS[type]}
            </div>
            <div>
              <p className="font-['Inter',sans-serif] font-bold text-[15px] text-[#101828]">{empty.title}</p>
              <p className="font-['Inter',sans-serif] font-normal text-[13px] text-[#6a7282] mt-[4px]">{empty.body}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[10px] border border-[#e5e7eb] overflow-hidden">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                  {cols.map((c) => (
                    <th key={c} className="px-[12px] py-[8px] text-left font-['Inter',sans-serif] font-medium text-[11px] uppercase tracking-[0.5px] text-[#6a7282]">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.map((r, i) => (
                  <tr key={i} className="border-b border-[#f3f4f6] last:border-b-0 hover:bg-[#fafafa]">
                    {cols.map((c) => (
                      <td key={c} className="px-[12px] py-[10px]">
                        {c === 'Status' ? <EPStatusBadge status={r.status} /> :
                         c === 'Type' ? <span className="text-[#364153]">{r.type ?? '—'}</span> :
                         c === 'Name' ? <span className="font-medium text-[#101828]">{r.name}</span> :
                         c === 'Value' ? <span className="text-[#364153]">{r.value ?? '—'}</span> :
                         c === 'Hash type' ? <span className="text-[#364153]">{r.hashType ?? '—'}</span> :
                         c === 'Hash' ? <span className="font-mono text-[12px] text-[#364153]">{r.hash ?? '—'}</span> :
                         c === 'Class' ? <span className="text-[#364153]">{r.deviceClass ?? '—'}</span> :
                         c === 'Action' ? <span className="text-[#364153]">{r.action ?? '—'}</span> :
                         c === 'Action taken' ? <span className="text-[#364153]">{r.actionTaken ?? '—'}</span> :
                         c === 'Severity' ? <span className="text-[#364153]">{r.severity ?? '—'}</span> : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EPCreateModal({ modal, onClose, onChange, onSave }: {
  modal: ModalState;
  onClose: () => void;
  onChange: (patch: Partial<Omit<ModalState, 'open'>>) => void;
  onSave: () => void;
}) {
  if (!modal.open) return null;
  const { type } = modal;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[12px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] w-[460px] max-w-[calc(100vw-32px)] max-h-[86vh] overflow-y-auto p-[24px]">
        <div className="flex items-start justify-between mb-[4px]">
          <h2 className="text-[15px] font-bold text-[#1a1a1a]">
            {type === 'exclusion' ? 'Create exclusion' : type === 'blocklist' ? 'Create blocklist entry' : type === 'device' ? 'Create device control rule' : 'Create custom rule'}
          </h2>
          <button onClick={onClose} className="w-[28px] h-[28px] flex items-center justify-center rounded-[6px] hover:bg-[#f3f4f6] text-[#6a7282]">
            <X className="w-[16px] h-[16px]" />
          </button>
        </div>
        <p className="text-[13px] text-[#717182] mb-[18px]">
          {type === 'exclusion' ? 'Exclude a file path or hash from scanning.' : type === 'blocklist' ? 'Block execution of a specific file hash.' : type === 'device' ? 'Allow or block a class of removable devices.' : 'Define a behavioral detection or response rule.'}
        </p>

        {type === 'exclusion' && (
          <>
            <div className="mb-[14px]">
              <label className="block text-[13px] font-medium text-[#1a1a1a] mb-[6px]">Type</label>
              <div className="flex border border-[#ececf0] rounded-[8px] overflow-hidden">
                {['File path', 'Hash'].map((v) => (
                  <button key={v} onClick={() => onChange({ epType: v })}
                    className={`flex-1 py-[8px] text-[13px] border-0 ${modal.epType === v ? 'bg-[#eff6ff] text-[#0066cc] font-semibold' : 'bg-white text-[#717182]'} ${v === 'Hash' ? 'border-l border-[#ececf0]' : ''}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-[14px]">
              <label className="block text-[13px] font-medium text-[#1a1a1a] mb-[6px]">Name</label>
              <input type="text" value={modal.name} onChange={(e) => onChange({ name: e.target.value, nameError: false })}
                placeholder="Name this exclusion"
                className={`w-full h-[36px] px-[10px] border rounded-[8px] text-[13px] outline-none focus:border-[#0066cc] ${modal.nameError ? 'border-[#d4183d]' : 'border-[rgba(0,0,0,0.1)]'}`} />
            </div>
            <div className="mb-[14px]">
              <label className="block text-[13px] font-medium text-[#1a1a1a] mb-[6px]">Value</label>
              <input type="text" value={modal.value} onChange={(e) => onChange({ value: e.target.value })}
                placeholder="C:\path\to\folder\** or file hash"
                className="w-full h-[36px] px-[10px] border border-[#e5e7eb] rounded-[8px] text-[14px] outline-none focus:border-[#0066cc]" />
            </div>
          </>
        )}

        {type === 'blocklist' && (
          <>
            <div className="mb-[14px]">
              <label className="block text-[13px] font-medium text-[#1a1a1a] mb-[6px]">Hash type</label>
              <select value={modal.hashType} onChange={(e) => onChange({ hashType: e.target.value })}
                className="w-full h-[36px] px-[10px] border border-[rgba(0,0,0,0.1)] rounded-[8px] text-[13px] bg-white outline-none focus:border-[#0066cc]">
                {['MD5', 'SHA1', 'SHA256'].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="mb-[14px]">
              <label className="block text-[13px] font-medium text-[#1a1a1a] mb-[6px]">Name</label>
              <input type="text" value={modal.name} onChange={(e) => onChange({ name: e.target.value, nameError: false })}
                placeholder="Name this entry"
                className={`w-full h-[36px] px-[10px] border rounded-[8px] text-[13px] outline-none focus:border-[#0066cc] ${modal.nameError ? 'border-[#d4183d]' : 'border-[rgba(0,0,0,0.1)]'}`} />
            </div>
            <div className="mb-[14px]">
              <label className="block text-[13px] font-medium text-[#1a1a1a] mb-[6px]">Hash</label>
              <input type="text" value={modal.value} onChange={(e) => onChange({ value: e.target.value })}
                placeholder="Paste the file hash"
                className="w-full h-[36px] px-[10px] border border-[#e5e7eb] rounded-[8px] text-[14px] outline-none focus:border-[#0066cc]" />
            </div>
          </>
        )}

        {type === 'device' && (
          <>
            <div className="mb-[14px]">
              <label className="block text-[13px] font-medium text-[#1a1a1a] mb-[6px]">Device class</label>
              <select value={modal.value} onChange={(e) => onChange({ value: e.target.value })}
                className="w-full h-[36px] px-[10px] border border-[rgba(0,0,0,0.1)] rounded-[8px] text-[13px] bg-white outline-none focus:border-[#0066cc]">
                {['USB', 'USB device', 'Camera', 'Modem', 'Bluetooth'].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="mb-[14px]">
              <label className="block text-[13px] font-medium text-[#1a1a1a] mb-[6px]">Name</label>
              <input type="text" value={modal.name} onChange={(e) => onChange({ name: e.target.value, nameError: false })}
                placeholder="Name this rule"
                className={`w-full h-[36px] px-[10px] border rounded-[8px] text-[13px] outline-none focus:border-[#0066cc] ${modal.nameError ? 'border-[#d4183d]' : 'border-[rgba(0,0,0,0.1)]'}`} />
            </div>
            <div className="mb-[14px]">
              <label className="block text-[13px] font-medium text-[#1a1a1a] mb-[6px]">Action</label>
              <div className="flex border border-[#ececf0] rounded-[8px] overflow-hidden">
                {['Block', 'Allow'].map((v) => (
                  <button key={v} onClick={() => onChange({ action: v })}
                    className={`flex-1 py-[8px] text-[13px] ${modal.action === v ? 'bg-[#eff6ff] text-[#0066cc] font-semibold' : 'bg-white text-[#717182]'} ${v === 'Allow' ? 'border-l border-[#ececf0]' : ''}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {type === 'custom' && (
          <>
            <div className="mb-[14px]">
              <label className="block text-[13px] font-medium text-[#1a1a1a] mb-[6px]">Name</label>
              <input type="text" value={modal.name} onChange={(e) => onChange({ name: e.target.value, nameError: false })}
                placeholder="Name this rule"
                className={`w-full h-[36px] px-[10px] border rounded-[8px] text-[13px] outline-none focus:border-[#0066cc] ${modal.nameError ? 'border-[#d4183d]' : 'border-[rgba(0,0,0,0.1)]'}`} />
            </div>
            <div className="mb-[14px]">
              <label className="block text-[13px] font-medium text-[#1a1a1a] mb-[6px]">Action taken</label>
              <select value={modal.actionTaken} onChange={(e) => onChange({ actionTaken: e.target.value })}
                className="w-full h-[36px] px-[10px] border border-[rgba(0,0,0,0.1)] rounded-[8px] text-[13px] bg-white outline-none focus:border-[#0066cc]">
                {['Detect only', 'Kill', 'Kill and quarantine'].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="mb-[14px]">
              <label className="block text-[13px] font-medium text-[#1a1a1a] mb-[6px]">Severity</label>
              <select value={modal.severity} onChange={(e) => onChange({ severity: e.target.value })}
                className="w-full h-[36px] px-[10px] border border-[rgba(0,0,0,0.1)] rounded-[8px] text-[13px] bg-white outline-none focus:border-[#0066cc]">
                {['Info', 'Low', 'Medium', 'High'].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
          </>
        )}

        <div className="mb-[18px]">
          <label className="block text-[13px] font-medium text-[#1a1a1a] mb-[6px]">Status</label>
          <div className="flex border border-[#ececf0] rounded-[8px] overflow-hidden">
            {(['Enabled', 'Disabled'] as const).map((v) => (
              <button key={v} onClick={() => onChange({ status: v })}
                className={`flex-1 py-[8px] text-[13px] ${modal.status === v ? 'bg-[#eff6ff] text-[#0066cc] font-semibold' : 'bg-white text-[#717182]'} ${v === 'Disabled' ? 'border-l border-[#ececf0]' : ''}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-[8px]">
          <button onClick={onClose} className="h-[36px] px-[16px] rounded-[8px] border border-[#ececf0] bg-white text-[13px] font-medium text-[#1a1a1a] hover:bg-[#f8f9fa]">Cancel</button>
          <button onClick={onSave} className="h-[36px] px-[16px] rounded-[8px] bg-[#0066cc] text-white text-[13px] font-medium hover:bg-[#0052a6]">Create rule</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

export function EndpointProfilePage() {
  const navigate = useNavigate();

  const [ep, setEp] = useState<EPState>({
    monitorMode: true,
    agentVersion: 'Always update to latest',
    advOpen: true,
    advanced: Object.fromEntries(ADV_SETTINGS.map((s, i) => [s, i < 6])),
    rules: { exclusion: [], blocklist: [], device: [], custom: [] },
  });

  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [activeRuleTypes, setActiveRuleTypes] = useState<EPRuleType[]>([]);
  const [modal, setModal] = useState<ModalState>({ open: false });

  React.useEffect(() => {
    if (!createMenuOpen) return;
    const close = () => setCreateMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [createMenuOpen]);

  const openModal = (type: EPRuleType) => {
    setModal({ open: true, type, name: '', status: 'Enabled', epType: 'File path', value: type === 'device' ? 'USB' : '', hashType: 'MD5', action: 'Block', actionTaken: 'Detect only', severity: 'Info', nameError: false });
  };

  const handleSaveRule = () => {
    if (!modal.open) return;
    if (!modal.name.trim()) { setModal({ ...modal, nameError: true }); return; }
    const { type } = modal;
    const rule: EPRule = { name: modal.name.trim(), status: modal.status };
    if (type === 'exclusion') { rule.type = modal.epType; rule.value = modal.value || '—'; }
    if (type === 'blocklist') { rule.hashType = modal.hashType; rule.hash = modal.value ? modal.value.slice(0, 12) + (modal.value.length > 12 ? '…' : '') : '—'; }
    if (type === 'device') { rule.deviceClass = modal.value; rule.action = modal.action; }
    if (type === 'custom') { rule.actionTaken = modal.actionTaken; rule.severity = modal.severity; }
    setEp((prev) => ({ ...prev, rules: { ...prev.rules, [type]: [...prev.rules[type], rule] } }));
    if (!activeRuleTypes.includes(type)) setActiveRuleTypes((prev) => [...prev, type]);
    setModal({ open: false });
  };

  const handleCreateMenuSelect = (type: EPRuleType) => {
    setCreateMenuOpen(false);
    if (!activeRuleTypes.includes(type)) setActiveRuleTypes((prev) => [...prev, type]);
    openModal(type);
  };

  return (
    <div className="flex flex-col gap-[24px] w-full max-w-[900px]">
      <PageHeader
        title="Organisation Endpoint Profile"
        subtitle="Configure endpoint detection, response settings and advanced protection. Sensor settings is the only policy applied by default. Other policy types require created rules to take effect."
        back={{ label: 'Back to Access Policies', onClick: () => navigate('/access-policies') }}
      />

      {/* Sensor settings */}
      <div className="bg-white rounded-[12px] border border-[#e5e7eb] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="px-[28px] py-[20px]">
        <h3 className="font-['Inter',sans-serif] font-bold text-[15px] leading-[20px] text-[#101828] mb-[4px]">Sensor settings</h3>
        <p className="font-['Inter',sans-serif] font-normal text-[13px] leading-[20px] text-[#6a7282] mb-[16px]">These two controls are required. Other policy types stay empty until created and given rules.</p>

        <div className="flex items-center justify-between py-[14px] border-t border-[#e5e7eb]">
          <div>
            <p className="font-['Inter',sans-serif] font-medium text-[14px] text-[#101828]">Monitor mode</p>
            <p className="font-['Inter',sans-serif] font-normal text-[13px] text-[#6a7282] mt-[2px]">When on, the agent detects activity without taking action.</p>
          </div>
          <EPToggle checked={ep.monitorMode} onChange={(v) => setEp((p) => ({ ...p, monitorMode: v }))} />
        </div>

        <div className="flex items-center justify-between py-[14px] border-t border-[#e5e7eb]">
          <div>
            <p className="font-['Inter',sans-serif] font-medium text-[14px] text-[#101828]">Agent version</p>
            <p className="font-['Inter',sans-serif] font-normal text-[13px] text-[#6a7282] mt-[2px]">Choose a fixed build, or always update to the latest.</p>
          </div>
          <select
            value={ep.agentVersion}
            onChange={(e) => setEp((p) => ({ ...p, agentVersion: e.target.value }))}
            className="h-[36px] px-[10px] border border-[rgba(0,0,0,0.1)] rounded-[8px] text-[13px] bg-white outline-none focus:border-[#0066cc] w-[220px]"
          >
            {AGENT_VERSIONS.map((v) => <option key={v}>{v}</option>)}
          </select>
        </div>

        <div className="border-t border-[#e5e7eb] pt-[6px]">
          <button
            onClick={() => setEp((p) => ({ ...p, advOpen: !p.advOpen }))}
            className="flex items-center gap-[6px] py-[8px] font-['Inter',sans-serif] font-medium text-[13px] text-[#364153] select-none"
          >
            {ep.advOpen ? <ChevronUp className="w-[14px] h-[14px]" /> : <ChevronDown className="w-[14px] h-[14px]" />}
            Advanced protection settings
          </button>
          {ep.advOpen && (
            <div className="bg-[#f9fafb] rounded-[8px] px-[14px] mt-[4px]">
              {ADV_SETTINGS.map((s, i) => (
                <div key={s} className={`flex items-center justify-between py-[10px] ${i > 0 ? 'border-t border-[#e5e7eb]' : ''}`}>
                  <span className="font-['Inter',sans-serif] font-normal text-[13px] text-[#364153]">{s}</span>
                  <EPToggle checked={ep.advanced[s]} onChange={(v) => setEp((p) => ({ ...p, advanced: { ...p.advanced, [s]: v } }))} />
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Rule sections — always shown so empty states are visible */}
      {(['exclusion', 'blocklist', 'device', 'custom'] as EPRuleType[]).map((type) => (
        <EPRuleTable
          key={type}
          type={type}
          rules={ep.rules[type]}
          onAdd={() => openModal(type)}
        />
      ))}

      <div className="flex items-center justify-end gap-[10px] pb-[8px]">
        <Button
          variant="outline"
          className="rounded-[8px] border-[#d1d5db] px-[20px]"
          onClick={() => navigate('/access-policies')}
        >
          <span className="font-['Inter',sans-serif] font-medium text-[14px] leading-[20px] text-[#364153]">
            Cancel
          </span>
        </Button>
        <Button
          className="rounded-[8px] bg-[#0066cc] hover:bg-[#0052a6] text-white px-[20px]"
          onClick={() => navigate('/access-policies')}
        >
          <span className="font-['Inter',sans-serif] font-medium text-[14px] leading-[20px] text-white">
            Save Changes
          </span>
        </Button>
      </div>

      <EPCreateModal
        modal={modal}
        onClose={() => setModal({ open: false })}
        onChange={(patch) => setModal((prev) => prev.open ? { ...prev, ...patch } : prev)}
        onSave={handleSaveRule}
      />
    </div>
  );
}
