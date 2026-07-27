import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Server, MoreVertical, Settings, Info, X, Search, ChevronLeft, CheckCircle2 } from 'lucide-react@0.487.0';
import { TablePanel, DataTable, THead, TH, TR, TD, TableFoot, StatusBadge as DSStatusBadge } from './ds';
import { Avatar, AvatarFallback } from './ui/avatar';

const AVATAR_COLOR = 'bg-[#6b7fa8]';

function emailInitials(email: string): string {
  const local = email.split('@')[0];
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

interface ConnectorCard {
  type: 'secure-remote-access' | 'service-tunnel';
  typeLabel: string;
  name: string;
  status: 'online' | 'offline';
  cpu?: number;
  mem?: number;
  privateNetworks?: { label: string; ipRange: string };
  internalDomains?: string[];
  policyRules?: string[];
}

// ── Days of week ────────────────────────────────────────────────────────────────
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── TimeSlider ───────────────────────────────────────────────────────────────────
function TimeSlider({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  const pct = max === 0 ? 0 : (value / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-[#717182] w-6 shrink-0">{label}</span>
      <div className="relative flex-1 h-6 flex items-center">
        {/* track bg */}
        <div className="absolute inset-x-[11px] h-[2px] bg-[#d1d5db] rounded-full" />
        {/* filled portion */}
        <div
          className="absolute h-[2px] bg-[#94a3b8] rounded-full"
          style={{ left: '11px', width: `calc((100% - 22px) * ${pct / 100})` }}
        />
        {/* orange thumb with value */}
        <div
          className="absolute w-[22px] h-[22px] rounded-full bg-[#0066cc] flex items-center justify-center text-white text-[10px] font-bold shadow pointer-events-none z-10"
          style={{ left: `calc(11px + (100% - 22px) * ${pct / 100})`, transform: 'translateX(-50%)' }}
        >
          {value}
        </div>
        {/* invisible native range for interaction */}
        <input
          type="range"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />
      </div>
    </div>
  );
}

// ── CalendarPicker ───────────────────────────────────────────────────────────────
const CAL_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function CalendarPicker({
  dateStr, hr, min, onDateChange, onHrChange, onMinChange
}: {
  dateStr: string; hr: number; min: number;
  onDateChange: (d: string) => void;
  onHrChange: (v: number) => void;
  onMinChange: (v: number) => void;
}) {
  const selected = new Date(dateStr + 'T00:00:00');
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { day: number; month: 'prev' | 'cur' | 'next' }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, month: 'prev' });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, month: 'cur' });
  let next = 1;
  while (cells.length % 7 !== 0) cells.push({ day: next++, month: 'next' });

  const isSelected = (cell: typeof cells[0]) =>
    cell.month === 'cur' &&
    cell.day === selected.getDate() &&
    viewYear === selected.getFullYear() &&
    viewMonth === selected.getMonth();

  const selectDay = (cell: typeof cells[0]) => {
    const m = cell.month === 'prev' ? viewMonth - 1 : cell.month === 'next' ? viewMonth + 1 : viewMonth;
    const y = m < 0 ? viewYear - 1 : m > 11 ? viewYear + 1 : viewYear;
    const mm = ((m % 12) + 12) % 12;
    onDateChange(`${y}-${String(mm + 1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`);
    if (cell.month !== 'cur') { setViewMonth(mm); setViewYear(y); }
  };

  return (
    <div className="bg-white border border-[#d1d5db] rounded-[10px] shadow-xl w-[210px] pb-3" style={{boxShadow:'0 8px 32px rgba(0,0,0,0.18)'}}>
      {/* Month nav */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#f1f3f5] text-[#717182]">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-[13px] font-semibold text-[#1a1a1a]">{CAL_MONTHS[viewMonth].toUpperCase()} {viewYear}</span>
        <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#f1f3f5] text-[#717182]">
          <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 px-2 mb-1">
        {CAL_DAYS.map(d => (
          <span key={d} className="text-center text-[11px] font-medium text-[#94a3b8] py-1">{d}</span>
        ))}
      </div>
      {/* Date grid */}
      <div className="grid grid-cols-7 px-2">
        {cells.map((cell, i) => (
          <button
            key={i}
            onClick={() => selectDay(cell)}
            className={`relative flex items-center justify-center h-7 w-7 mx-auto rounded-full text-[12px] transition-colors
              ${isSelected(cell) ? 'bg-[#0066cc] text-white font-semibold' : ''}
              ${!isSelected(cell) && cell.month === 'cur' ? 'text-[#1a1a1a] hover:bg-[#f1f3f5]' : ''}
              ${cell.month !== 'cur' ? 'text-[#c8ccd4]' : ''}
            `}
          >
            {cell.day}
          </button>
        ))}
      </div>
      {/* Hr / Min sliders */}
      <div className="px-3 mt-3 flex flex-col gap-3">
        <TimeSlider label="Hr" value={hr} max={23} onChange={onHrChange} />
        <TimeSlider label="Min" value={min} max={59} onChange={onMinChange} />
      </div>
    </div>
  );
}

// ── FirmwareToast ────────────────────────────────────────────────────────────────
export function FirmwareToast({ fileName, firmware, model, onDismiss, tenants }: { fileName: string; firmware: string; model: string; onDismiss: () => void; tenants?: string[] }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 10000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const TOAST_PILL_MAX = 3;
  const tenantList = tenants ?? [];
  const visibleTenants = tenantList.slice(0, TOAST_PILL_MAX);
  const tenantOverflow = tenantList.length - TOAST_PILL_MAX;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-[#16a34a] px-6 py-3.5 flex items-center gap-4 shadow-[0_2px_12px_rgba(22,163,74,0.25)]">
      <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
      <div className="flex-1 flex items-center gap-6 min-w-0">
        <p className="text-[13px] font-semibold text-white shrink-0">Local firmware upgrade added successfully</p>
        {tenantList.length > 0 ? (
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="text-[13px] text-white/80 shrink-0">
              <span className="font-medium text-white">{fileName}</span> queued for installation across{' '}
              <span className="font-medium text-white">{tenantList.length} tenant{tenantList.length > 1 ? 's' : ''}</span>:
            </span>
            {visibleTenants.map((t) => (
              <span key={t} className="inline-flex items-center h-[20px] px-2 text-[11px] font-medium text-white bg-white/20 border border-white/30 rounded-full whitespace-nowrap shrink-0">
                {t}
              </span>
            ))}
            {tenantOverflow > 0 && (
              <span className="inline-flex items-center h-[20px] px-2 text-[11px] font-medium text-white bg-white/10 border border-white/20 rounded-full whitespace-nowrap shrink-0">
                +{tenantOverflow} more
              </span>
            )}
          </div>
        ) : (
          <p className="text-[13px] text-white/80 leading-snug truncate">
            <span className="font-medium text-white">{fileName}</span> has been uploaded and queued for installation on this connector.
          </p>
        )}
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-white/60">Firmware</span>
            <span className="text-[12px] font-medium text-white">{firmware}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-white/60">Model</span>
            <span className="text-[12px] font-medium text-white">{model}</span>
          </div>
        </div>
      </div>
      <button onClick={onDismiss} className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-white/20 text-white shrink-0 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── UploadFirmwareModal ─────────────────────────────────────────────────────────
type UploadStep = 'idle' | 'confirm' | 'uploading' | 'scheduled';

const DEPLOY_OPTIONS = [
  {
    value: 'now',
    label: 'Now',
    description: "Overrides each device's preset upgrade schedule and starts installation immediately for all selected tenants.",
  },
  {
    value: 'later',
    label: 'Later',
    description: 'Overrides each device\'s preset schedule and applies this exact date and time to all selected tenants.',
  },
  {
    value: 'tenant-schedule',
    label: 'Follow individual tenant schedule',
    description: 'Each device installs at its own preset time. Times vary by tenant – no single upgrade window applies.',
  },
] as const;

function formatDeployWindow(dateStr: string, hr: number, min: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  const dateLabel = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  const to12 = (h: number) => { const m = h % 12; return m === 0 ? 12 : m; };
  const pad = (n: number) => String(n).padStart(2, '0');
  const ampm = hr < 12 ? 'AM' : 'PM';
  const endHr = (hr + 1) % 24;
  const timeRangeLabel = `${pad(to12(hr))}:${pad(min)} - ${pad(to12(endHr))}:${pad(min)} ${ampm}`;
  return { dateLabel, timeRangeLabel };
}

/* Shared sub-components */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#717182] mb-1.5">
      {children}
    </p>
  );
}

function FieldBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-9 px-3 flex items-center border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white text-[13px] text-[#1a1a1a]">
      {children}
    </div>
  );
}

function FieldBoxWithChevron({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-9 px-3 flex items-center justify-between border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white text-[13px] text-[#1a1a1a]">
      <span>{children}</span>
      <svg className="w-4 h-4 text-[#717182] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
  );
}

export function UploadFirmwareModal({ open, onClose, onSuccess, tenants }: { open: boolean; onClose: () => void; onSuccess?: (fileName: string) => void; tenants?: string[] }) {
  const [step, setStep] = useState<UploadStep>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deploy, setDeploy] = useState<'now' | 'later' | 'tenant-schedule'>('now');
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [scheduleHr,        setScheduleHr]        = useState(0);
  const [scheduleMin,       setScheduleMin]       = useState(0);
  const [schedulePickerOpen, setSchedulePickerOpen] = useState(false);
  const [showAllTenants, setShowAllTenants] = useState(false);
  const firmwareVersion = '7.3.3-7015';
  const tenant          = 'Riverside Dental';
  const model           = 'NSv 270';
  const inputRef  = useRef<HTMLInputElement>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) setFile(picked);
  };

  const startUpload = () => {
    if (!file) return;
    setStep('uploading');
    setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timerRef.current!);
          setTimeout(() => { const name = file?.name ?? ''; handleClose(); onSuccess?.(name); }, 300);
          return 100;
        }
        return prev + 4;
      });
    }, 80);
  };

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStep('idle');
    setFile(null);
    setProgress(0);
    onClose();
  };

  if (!open) return null;

  /* Tenant pills — shown when multiple tenants are passed */
  const PILL_MAX = 5;
  const tenantList = tenants ?? [];
  const pillsToShow = showAllTenants ? tenantList : tenantList.slice(0, PILL_MAX);
  const overflow = tenantList.length - PILL_MAX;

  /* Modal shell classes (design system: bg-surface, radius-lg 16px, border, shadow-lg) */
  const modalCard = 'relative z-10 bg-white rounded-[16px] border border-[rgba(0,0,0,0.1)] shadow-[0_12px_32px_rgba(0,0,0,0.12)] w-[520px] flex flex-col';
  const divider   = 'h-px bg-[rgba(0,0,0,0.1)] shrink-0';
  const modalTitle = 'text-[18px] font-semibold text-[#1a1a1a]';
  const closeBtn  = 'w-7 h-7 flex items-center justify-center rounded-[8px] hover:bg-[#ececf0] text-[#717182]';

  /* Button variants (design system: radius-md 8px, height 36px) */
  const btnOutline  = 'h-9 px-4 text-[13px] font-medium text-[#1a1a1a] bg-transparent border border-[rgba(0,0,0,0.1)] rounded-[8px] hover:bg-[#ececf0] transition-colors';
  const btnPrimary  = 'h-9 px-4 text-[13px] font-medium text-white bg-[#0066cc] rounded-[8px] hover:bg-[#0052a6] transition-colors disabled:opacity-50 disabled:pointer-events-none';
  const btnDisabled = 'h-9 px-4 text-[13px] font-medium text-[#717182] bg-[#ececf0] border border-[rgba(0,0,0,0.1)] rounded-[8px] opacity-50 pointer-events-none';

  // ── Idle ────────────────────────────────────────────────────────────────
  if (step === 'idle') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
        <div className={modalCard}>
          <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className={modalTitle}>Add Local Firmware Upgrade</h2>
              {tenantList.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {pillsToShow.map((t) => (
                    <span key={t} className="inline-flex items-center h-[22px] px-2 text-[11px] font-medium text-[#1a1a1a] bg-[#ececf0] border border-[rgba(0,0,0,0.1)] rounded-full whitespace-nowrap">
                      {t}
                    </span>
                  ))}
                  {!showAllTenants && overflow > 0 && (
                    <button
                      onClick={() => setShowAllTenants(true)}
                      className="inline-flex items-center h-[22px] px-2 text-[11px] font-medium text-[#0066cc] bg-[#eff6ff] border border-[#bfdbfe] rounded-full whitespace-nowrap hover:bg-[#dbeafe] transition-colors"
                    >
                      +{overflow} more
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[13px] font-medium text-[#717182] mt-0.5">{tenant}</p>
              )}
            </div>
            <button onClick={handleClose} className={closeBtn}><X className="w-4 h-4" /></button>
          </div>
          <div className={divider} />

          <div className="px-6 py-5 flex flex-col gap-5">
            <div>
              <FieldLabel>Upload Firmware File <span className="text-[#d4183d] normal-case">*</span></FieldLabel>
              {!file ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-[8px] px-6 py-8 cursor-pointer transition-colors ${
                    dragging ? 'border-[#0066cc] bg-[#eff6ff]' : 'border-[rgba(0,0,0,0.15)] hover:border-[#0066cc] hover:bg-[#f8fbff] bg-white'
                  }`}
                >
                  <input ref={inputRef} type="file" accept=".bin,.img,.swu,.zip" className="hidden" onChange={handleFileChange} />
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#717182" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p className="text-[13px] text-[#717182]">Click or drag a file to this area to upload.</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-[#f8f9fa] border border-[rgba(0,0,0,0.1)] rounded-[8px] px-3 py-2.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#717182" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  <p className="text-[13px] text-[#1a1a1a] flex-1 truncate">{file.name}</p>
                  <button onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ''; }} className="w-5 h-5 flex items-center justify-center rounded-[6px] hover:bg-[#ececf0] text-[#717182] shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {file && (
              <>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#717182]">Firmware</p>
                    <p className="text-[13px] text-[#1a1a1a] mt-0.5">{firmwareVersion}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#717182]">Model</p>
                    <p className="text-[13px] text-[#1a1a1a] mt-0.5">{model}</p>
                  </div>
                </div>

                {/* Upgrade Time */}
                <div>
                  <FieldLabel>Upgrade Time</FieldLabel>
                  <div className="flex flex-col gap-3">
                    {DEPLOY_OPTIONS.map(({ value, label, description }) => {
                      const selected = deploy === value;
                      return (
                        <div
                          key={value}
                          onClick={() => setDeploy(value)}
                          className={`border rounded-[10px] px-4 py-3.5 cursor-pointer transition-colors ${
                            selected ? 'border-[#0066cc] bg-[#eff6ff]' : 'border-[rgba(0,0,0,0.1)] hover:border-[rgba(0,0,0,0.2)]'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`mt-[2px] w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                                selected ? 'border-[#0066cc]' : 'border-[rgba(0,0,0,0.25)]'
                              }`}
                            >
                              {selected && <span className="w-[7px] h-[7px] rounded-full bg-[#0066cc]" />}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-[#1a1a1a]">{label}</p>
                              <div className="flex items-start gap-1.5 mt-1">
                                <Info className="w-3.5 h-3.5 text-[#94a3b8] shrink-0 mt-px" />
                                <p className="text-[12px] text-[#64748b] leading-snug">{description}</p>
                              </div>

                              {value === 'later' && selected && (
                                <div className="mt-3 relative">
                                  <FieldLabel>Date &amp; Time</FieldLabel>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setSchedulePickerOpen(o => !o); }}
                                    className={`h-9 w-full px-3 text-[13px] border rounded-[8px] bg-white flex items-center gap-4 ${
                                      schedulePickerOpen ? 'border-[#0066cc]' : 'border-[rgba(0,0,0,0.1)]'
                                    }`}
                                  >
                                    {(() => {
                                      const { dateLabel, timeRangeLabel } = formatDeployWindow(scheduleDate, scheduleHr, scheduleMin);
                                      return (
                                        <span className="flex-1 flex items-center gap-4 text-left text-[#1a1a1a]">
                                          <span>{dateLabel}</span>
                                          <span>{timeRangeLabel}</span>
                                        </span>
                                      );
                                    })()}
                                    <svg className="w-3.5 h-3.5 text-[#717182] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                                  </button>
                                  {schedulePickerOpen && (
                                    <div className="absolute left-0 top-[42px] z-50" onClick={(e) => e.stopPropagation()}>
                                      <CalendarPicker
                                        dateStr={scheduleDate}
                                        hr={scheduleHr}
                                        min={scheduleMin}
                                        onDateChange={setScheduleDate}
                                        onHrChange={setScheduleHr}
                                        onMinChange={setScheduleMin}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={divider} />
          <div className="flex items-center justify-between px-6 py-4 shrink-0">
            <button onClick={handleClose} className={btnOutline}>Cancel</button>
            <button disabled={!file} onClick={() => setStep('confirm')} className={btnPrimary}>
              Upgrade
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Confirm ──────────────────────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" />
        <div className={modalCard}>
          <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className={modalTitle}>Add Local Firmware Upgrade</h2>
              {tenantList.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {pillsToShow.map((t) => (
                    <span key={t} className="inline-flex items-center h-[22px] px-2 text-[11px] font-medium text-[#1a1a1a] bg-[#ececf0] border border-[rgba(0,0,0,0.1)] rounded-full whitespace-nowrap">
                      {t}
                    </span>
                  ))}
                  {!showAllTenants && overflow > 0 && (
                    <button
                      onClick={() => setShowAllTenants(true)}
                      className="inline-flex items-center h-[22px] px-2 text-[11px] font-medium text-[#0066cc] bg-[#eff6ff] border border-[#bfdbfe] rounded-full whitespace-nowrap hover:bg-[#dbeafe] transition-colors"
                    >
                      +{overflow} more
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[13px] font-medium text-[#717182] mt-0.5">{tenant}</p>
              )}
            </div>
            <button onClick={handleClose} className={closeBtn}><X className="w-4 h-4" /></button>
          </div>
          <div className={divider} />

          <div className="px-6 py-8 flex flex-col items-center text-center gap-3">
            {(() => {
              const pad = (n: number) => String(n).padStart(2, '0');
              const timeLabel = `${pad(scheduleHr)}:${pad(scheduleMin)}`;
              const dateObj = new Date(`${scheduleDate}T00:00`);
              const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
              const ampm = scheduleHr < 12 ? 'AM' : 'PM';
              return (
                <>
                  <div className="w-11 h-11 rounded-full bg-[#eff6ff] flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#1a1a1a]">Confirm Firmware Upgrade</p>
                    <p className="text-[13px] text-[#717182] mt-1 max-w-[340px] leading-snug">
                      {deploy === 'later'
                        ? <>Your firmware upgrade is scheduled for <strong className="text-[#1a1a1a]">{formattedDate} at {timeLabel} {ampm}</strong>.</>
                        : deploy === 'tenant-schedule'
                        ? <>Firmware will be installed during each tenant's configured maintenance window.</>
                        : <>Your firmware upgrade will begin immediately on this connector.</>
                      }
                    </p>
                  </div>
                  <div className="w-full bg-[#f8f9fa] border border-[rgba(0,0,0,0.1)] rounded-[12px] px-5 py-3.5 text-left grid grid-cols-2 gap-x-6 gap-y-2.5 mt-1">
                    <div>
                      <FieldLabel>Firmware</FieldLabel>
                      <p className="text-[13px] text-[#1a1a1a]">{firmwareVersion}</p>
                    </div>
                    <div>
                      <FieldLabel>Model</FieldLabel>
                      <p className="text-[13px] text-[#1a1a1a]">{model}</p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          <div className={divider} />
          <div className="flex items-center justify-end gap-2 px-6 py-4 shrink-0">
            <button onClick={() => setStep('idle')} className={btnOutline}>Back</button>
            <button
              onClick={() => (deploy === 'later' || deploy === 'tenant-schedule') ? setStep('scheduled') : startUpload()}
              className={btnPrimary}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Scheduled confirmation ───────────────────────────────────────────────
  if (step === 'scheduled') {
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeLabel = `${pad(scheduleHr)}:${pad(scheduleMin)}`;
    const dateObj = new Date(`${scheduleDate}T00:00`);
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const ampm = scheduleHr < 12 ? 'AM' : 'PM';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
        <div className={modalCard}>
          <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className={modalTitle}>Add Local Firmware Upgrade</h2>
              {tenantList.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {pillsToShow.map((t) => (
                    <span key={t} className="inline-flex items-center h-[22px] px-2 text-[11px] font-medium text-[#1a1a1a] bg-[#ececf0] border border-[rgba(0,0,0,0.1)] rounded-full whitespace-nowrap">
                      {t}
                    </span>
                  ))}
                  {!showAllTenants && overflow > 0 && (
                    <button
                      onClick={() => setShowAllTenants(true)}
                      className="inline-flex items-center h-[22px] px-2 text-[11px] font-medium text-[#0066cc] bg-[#eff6ff] border border-[#bfdbfe] rounded-full whitespace-nowrap hover:bg-[#dbeafe] transition-colors"
                    >
                      +{overflow} more
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[13px] font-medium text-[#717182] mt-0.5">{tenant}</p>
              )}
            </div>
            <button onClick={handleClose} className={closeBtn}><X className="w-4 h-4" /></button>
          </div>
          <div className={divider} />

          <div className="flex flex-col items-center gap-3 px-8 py-8 text-center">
            <div className="w-11 h-11 rounded-full bg-[#f0fdf4] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#16a34a]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#1a1a1a]">Firmware upgrade scheduled</p>
              <p className="text-[13px] text-[#717182] mt-1 max-w-[340px] leading-snug">
                Your firmware upgrade has been scheduled for<br />
                <strong className="text-[#1a1a1a]">{formattedDate} at {timeLabel} {ampm}</strong>.
              </p>
            </div>
            <div className="w-full bg-[#f8f9fa] border border-[rgba(0,0,0,0.1)] rounded-[12px] px-5 py-3.5 text-left grid grid-cols-2 gap-x-6 gap-y-2.5 mt-1">
              <div>
                <FieldLabel>Firmware</FieldLabel>
                <p className="text-[13px] text-[#1a1a1a]">{firmwareVersion}</p>
              </div>
              <div>
                <FieldLabel>Model</FieldLabel>
                <p className="text-[13px] text-[#1a1a1a]">{model}</p>
              </div>
              <div>
                <FieldLabel>Scheduled Date</FieldLabel>
                <p className="text-[13px] text-[#1a1a1a]">{formattedDate}</p>
              </div>
              <div>
                <FieldLabel>Scheduled Time</FieldLabel>
                <p className="text-[13px] text-[#1a1a1a]">{timeLabel} {ampm}</p>
              </div>
            </div>
          </div>

          <div className={divider} />
          <div className="flex items-center justify-end px-6 py-4 shrink-0">
            <button onClick={handleClose} className={btnPrimary}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Uploading ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className={modalCard}>
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className={modalTitle}>Add Local Firmware Upgrade</h2>
            {tenantList.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {pillsToShow.map((t) => (
                  <span key={t} className="inline-flex items-center h-[22px] px-2 text-[11px] font-medium text-[#1a1a1a] bg-[#ececf0] border border-[rgba(0,0,0,0.1)] rounded-full whitespace-nowrap">
                    {t}
                  </span>
                ))}
                {!showAllTenants && overflow > 0 && (
                  <button
                    onClick={() => setShowAllTenants(true)}
                    className="inline-flex items-center h-[22px] px-2 text-[11px] font-medium text-[#0066cc] bg-[#eff6ff] border border-[#bfdbfe] rounded-full whitespace-nowrap hover:bg-[#dbeafe] transition-colors"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[13px] font-medium text-[#717182] mt-0.5">{tenant}</p>
            )}
          </div>
          <button onClick={handleClose} className={closeBtn}><X className="w-4 h-4" /></button>
        </div>
        <div className={divider} />

        <div className="px-6 py-5 flex flex-col gap-5">
          <div>
            <FieldLabel>Upload Firmware File</FieldLabel>
            <div className="flex items-center gap-3 bg-[#f8f9fa] border border-[rgba(0,0,0,0.1)] rounded-[8px] px-3 py-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#717182" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[#1a1a1a] truncate">{file?.name}</p>
                <div className="mt-1.5 h-[3px] rounded-full bg-[#ececf0] overflow-hidden">
                  <div className="h-full rounded-full bg-[#0066cc] transition-all duration-100" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <span className="text-[12px] text-[#717182] shrink-0">Uploading…</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div>
              <FieldLabel>Firmware</FieldLabel>
              <FieldBox>{firmwareVersion}</FieldBox>
            </div>
            <div>
              <FieldLabel>Model</FieldLabel>
              <FieldBox>{model}</FieldBox>
            </div>
          </div>
        </div>

        <div className={divider} />
        <div className="flex items-center justify-end px-6 py-4 shrink-0">
          <button className={btnDisabled}>Uploading…</button>
        </div>
      </div>
    </div>
  );
}

// ── FirmwareSettingsModal ───────────────────────────────────────────────────────
export function FirmwareSettingsModal({ open, onClose, tenants }: { open: boolean; onClose: () => void; tenants?: string[] }) {
  const [showAllTenants, setShowAllTenants] = useState(false);
  const [scheduleDay, setScheduleDay] = useState('Sunday');
  const [startHr, setStartHr] = useState(1);
  const [startMin, setStartMin] = useState(0);
  const [endHr, setEndHr] = useState(2);
  const [endMin, setEndMin] = useState(0);
  const [openPicker, setOpenPicker] = useState<'start' | 'end' | null>(null);

  if (!open) return null;

  const PILL_MAX = 5;
  const tenantList = tenants ?? [];
  const pillsToShow = showAllTenants ? tenantList : tenantList.slice(0, PILL_MAX);
  const overflow = tenantList.length - PILL_MAX;

  const pad = (n: number) => String(n).padStart(2, '0');
  const to12 = (h: number) => { const m = h % 12; return m === 0 ? 12 : m; };
  const ampm = (h: number) => (h < 12 ? 'AM' : 'PM');
  const clockIcon = (
    <svg className="w-3.5 h-3.5 text-[#717182] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal card */}
      <div className="relative z-10 bg-white rounded-[12px] shadow-[0_8px_40px_rgba(0,0,0,0.20)] w-[580px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] font-semibold text-[#1a1a1a] leading-tight">Auto Update Firmware Settings</h2>
            {tenantList.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {pillsToShow.map((t) => (
                  <span key={t} className="inline-flex items-center h-[22px] px-2 text-[11px] font-medium text-[#1a1a1a] bg-[#ececf0] border border-[rgba(0,0,0,0.1)] rounded-full whitespace-nowrap">
                    {t}
                  </span>
                ))}
                {!showAllTenants && overflow > 0 && (
                  <button
                    onClick={() => setShowAllTenants(true)}
                    className="inline-flex items-center h-[22px] px-2 text-[11px] font-medium text-[#0066cc] bg-[#eff6ff] border border-[#bfdbfe] rounded-full whitespace-nowrap hover:bg-[#dbeafe] transition-colors"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[13px] text-[#717182] mt-0.5">Configure automatic update and install preferences for this connector</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#ececf0] text-[#717182] shrink-0 ml-4 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="h-px bg-[rgba(0,0,0,0.1)]" />

          {/* Schedule row */}
          <div>
            <p className="text-[13px] font-semibold text-[#1a1a1a] leading-tight mb-2">Default Firmware Install Hours</p>
            <div className="flex items-center gap-2">
              {/* Day select */}
              <div className="relative">
                <select
                  value={scheduleDay}
                  onChange={(e) => setScheduleDay(e.target.value)}
                  className="h-9 pl-3 pr-8 text-[13px] text-[#1a1a1a] border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white appearance-none cursor-pointer focus:outline-none focus:border-[#0066cc]"
                >
                  {FULL_DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <svg className="w-3.5 h-3.5 text-[#717182] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </div>

              {/* Start time */}
              <div className="relative">
                <button
                  onClick={() => setOpenPicker(openPicker === 'start' ? null : 'start')}
                  className={`h-9 px-3 text-[13px] border rounded-[8px] bg-white flex items-center gap-2 ${openPicker === 'start' ? 'border-[#0066cc]' : 'border-[rgba(0,0,0,0.1)]'}`}
                >
                  <span className="text-[#1a1a1a]">{pad(to12(startHr))}:{pad(startMin)} {ampm(startHr)}</span>
                  {clockIcon}
                </button>
                {openPicker === 'start' && (
                  <div className="absolute left-0 top-[42px] z-50 bg-white border border-[rgba(0,0,0,0.1)] rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-4 w-[200px]">
                    <div className="flex flex-col gap-4">
                      <TimeSlider label="Hr" value={startHr} max={23} onChange={setStartHr} />
                      <TimeSlider label="Min" value={startMin} max={59} onChange={setStartMin} />
                    </div>
                    <div className="absolute left-[18px] -top-[6px] w-3 h-3 bg-white border-l border-t border-[rgba(0,0,0,0.1)] rotate-45" />
                  </div>
                )}
              </div>

              <span className="text-[13px] text-[#717182]">–</span>

              {/* End time */}
              <div className="relative">
                <button
                  onClick={() => setOpenPicker(openPicker === 'end' ? null : 'end')}
                  className={`h-9 px-3 text-[13px] border rounded-[8px] bg-white flex items-center gap-2 ${openPicker === 'end' ? 'border-[#0066cc]' : 'border-[rgba(0,0,0,0.1)]'}`}
                >
                  <span className="text-[#1a1a1a]">{pad(to12(endHr))}:{pad(endMin)} {ampm(endHr)}</span>
                  {clockIcon}
                </button>
                {openPicker === 'end' && (
                  <div className="absolute left-0 top-[42px] z-50 bg-white border border-[rgba(0,0,0,0.1)] rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-4 w-[200px]">
                    <div className="flex flex-col gap-4">
                      <TimeSlider label="Hr" value={endHr} max={23} onChange={setEndHr} />
                      <TimeSlider label="Min" value={endMin} max={59} onChange={setEndMin} />
                    </div>
                    <div className="absolute left-[18px] -top-[6px] w-3 h-3 bg-white border-l border-t border-[rgba(0,0,0,0.1)] rotate-45" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info callout */}
          <div className="flex items-start gap-2.5 bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] px-3 py-2.5">
            <Info className="w-[14px] h-[14px] text-[#0066cc] shrink-0 mt-px" />
            <p className="text-[12px] text-[#1e40af] leading-snug">
              Schedule installation of firmware updates to be done during quieter maintenance windows. Firewalls may go offline during upgrade — firmware upgrade takes around 20 minutes. Schedule during non-business hours to minimize impact.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#e5e7eb] shrink-0">
          <button
            onClick={onClose}
            className="h-[34px] px-5 text-[13px] font-medium text-[#1a1a1a] border border-[#d1d5db] rounded-[8px] hover:bg-[#f8f9fa]"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="h-[34px] px-5 text-[13px] font-medium text-white bg-[#0066cc] rounded-[8px] hover:bg-[#0052a6]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tenant session data ────────────────────────────────────────────────────────

interface TenantSession {
  id: string;
  user: string;
  connector: string;
  connectorId: string;
  app: string;
  duration: string;
  status: 'active' | 'idle' | 'disconnected';
}

const TENANT_SESSIONS: TenantSession[] = [
  { id:'s01', user:'maria@riversidedental.com',   connector:'ZTP Connector',                       connectorId:'ztc-rv-01', app:'Dentrix',        duration:'2h 14m', status:'active' },
  { id:'s02', user:'jessica@riversidedental.com', connector:'ZTP Connector',                       connectorId:'ztc-rv-01', app:'Microsoft 365',  duration:'41m',    status:'active' },
  { id:'s03', user:'mark@riversidedental.com',    connector:'ZTP Connector',                       connectorId:'ztc-rv-01', app:'QuickBooks',      duration:'1h 08m', status:'idle'   },
  { id:'s04', user:'dana@riversidedental.com',    connector:'ZTP Connector',                       connectorId:'ztc-rv-01', app:'Microsoft 365',  duration:'22m',    status:'active' },
  { id:'s05', user:'priya@riversidedental.com',   connector:'ZTP Connector',                       connectorId:'ztc-rv-01', app:'SharePoint',      duration:'55m',    status:'active' },
  { id:'s06', user:'james@riversidedental.com',   connector:'ST - Remote - Employee - Access - 01', connectorId:'ztc-rv-01', app:'RDP',            duration:'3h 02m', status:'active' },
  { id:'s07', user:'lucy@riversidedental.com',    connector:'ST - Remote - Employee - Access - 01', connectorId:'ztc-rv-01', app:'SSH',            duration:'18m',    status:'idle'   },
  { id:'s08', user:'tom@riversidedental.com',     connector:'ST - Remote - Employee - Access - 01', connectorId:'ztc-rv-01', app:'VNC',            duration:'47m',    status:'active' },
  { id:'s09', user:'anna@riversidedental.com',    connector:'ZTP Connector',                       connectorId:'ztc-rv-01', app:'Dentrix',        duration:'1h 31m', status:'active' },
  { id:'s10', user:'chen@riversidedental.com',    connector:'ZTP Connector',                       connectorId:'ztc-rv-01', app:'SAP',            duration:'29m',    status:'idle'   },
  { id:'s11', user:'ben@riversidedental.com',     connector:'ST - Remote - Employee - Access - 01', connectorId:'ztc-rv-01', app:'RDP',            duration:'5m',     status:'disconnected' },
  { id:'s12', user:'sara@riversidedental.com',    connector:'ZTP Connector',                       connectorId:'ztc-rv-01', app:'Microsoft 365',  duration:'2h 05m', status:'active' },
];

const SESSION_STATUS_META: Record<TenantSession['status'], { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  active:       { label: 'Active',       variant: 'success' },
  idle:         { label: 'Idle',         variant: 'warning' },
  disconnected: { label: 'Disconnected', variant: 'neutral' },
};

// ── Connector cards data ───────────────────────────────────────────────────────

const connectors: ConnectorCard[] = [
  {
    type: 'secure-remote-access',
    typeLabel: 'Secure Remote Access',
    name: 'ZTP Connector',
    status: 'online',
    cpu: 31,
    mem: 38,
    privateNetworks: { label: 'Employee Zone', ipRange: '192.10.10.0/16' },
    internalDomains: ['dentrix.local', 'erp.riverside.local'],
  },
  {
    type: 'service-tunnel',
    typeLabel: 'Service Tunnel',
    name: 'ST - Remote - Employee - Access - 01',
    status: 'online',
    cpu: 14,
    mem: 22,
    policyRules: ['Remote Employee Access', 'Remote Employee Access'],
  },
];

function cardBarColor(v: number) {
  if (v >= 90) return 'var(--destructive)';
  if (v >= 75) return 'var(--warning)';
  if (v >= 60) return 'color-mix(in srgb, var(--warning) 55%, #ffffff)';
  return 'var(--success)';
}

function CardUtilBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5" style={{ minWidth: 0 }}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9ca3af] w-6 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)', minWidth: '48px' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: cardBarColor(value) }} />
      </div>
      <span className="text-[10px] tabular-nums text-[#9ca3af] w-7 text-right shrink-0">{value}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: 'online' | 'offline' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-[8px] ${
        status === 'online'
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-gray-100 text-gray-500 border border-gray-200'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'online' ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />
      {status === 'online' ? 'Online' : 'Offline'}
    </span>
  );
}

function OverflowMenu({ onSettings, onUploadFirmware, onSystemLogs }: { onSettings: () => void; onUploadFirmware: () => void; onSystemLogs: () => void; }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="w-[28px] h-[28px] flex items-center justify-center rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white hover:bg-[#ececf0] text-[#717182]"
      >
        <MoreVertical className="w-[14px] h-[14px]" />
      </button>
      {open && (
        <div className="absolute right-0 top-[32px] z-20 min-w-[180px] bg-white border border-[rgba(0,0,0,0.1)] rounded-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] py-1 overflow-hidden">
          <button
            className="w-full px-3 py-2 text-[13px] text-[#1a1a1a] hover:bg-[#f8f9fa] text-left"
            onClick={() => { setOpen(false); onSettings(); }}
          >
            Auto Update Firmware Settings
          </button>
          <button
            className="w-full px-3 py-2 text-[13px] text-[#1a1a1a] hover:bg-[#f8f9fa] text-left"
            onClick={() => { setOpen(false); onUploadFirmware(); }}
          >
            Upload Firmware
          </button>
          <button
            className="w-full px-3 py-2 text-[13px] text-[#1a1a1a] hover:bg-[#f8f9fa] text-left"
            onClick={() => { setOpen(false); onSystemLogs(); }}
          >
            System Logs
          </button>
        </div>
      )}
    </div>
  );
}

function ConnectorCard({ connector }: { connector: ConnectorCard }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toast, setToast] = useState<{ fileName: string } | null>(null);
  const hasSettings = connector.type === 'secure-remote-access';
  const navigate = useNavigate();

  return (
    <>
      {toast && (
        <FirmwareToast
          fileName={toast.fileName}
          firmware="7.3.3-7015"
          model="NSv 270"
          onDismiss={() => setToast(null)}
        />
      )}
      {hasSettings && <FirmwareSettingsModal open={modalOpen} onClose={() => setModalOpen(false)} />}
      {hasSettings && (
        <UploadFirmwareModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onSuccess={(fileName) => setToast({ fileName })}
        />
      )}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">
                {connector.typeLabel}
              </p>
              <p className="text-sm font-semibold text-gray-900 truncate">{connector.name}</p>
            </div>
          </div>
          {/* Resource utilization bars */}
          {connector.type === 'secure-remote-access' && connector.status === 'online' && connector.cpu != null && connector.mem != null && (
            <div className="flex flex-col gap-1 flex-1 mx-3 pt-0.5" style={{ minWidth: '100px', maxWidth: '160px' }}>
              <CardUtilBar label="CPU" value={connector.cpu} />
              <CardUtilBar label="Mem" value={connector.mem} />
            </div>
          )}
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={connector.status} />
            {hasSettings && <OverflowMenu onSettings={() => setModalOpen(true)} onUploadFirmware={() => setUploadOpen(true)} onSystemLogs={() => navigate('/system-logs')} />}
          </div>
        </div>

      <div className="border-t border-gray-100" />

      {/* Private Networks */}
      {connector.privateNetworks && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {/* Row 1 */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Private Networks
            </p>
            <p className="text-sm text-gray-700">{connector.privateNetworks.label}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              IP Range
            </p>
            <p className="text-sm text-gray-700">{connector.privateNetworks.ipRange}</p>
          </div>
          {/* Row 2 */}
          {connector.internalDomains && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Internal Domains
              </p>
              <div className="flex flex-wrap gap-2">
                {connector.internalDomains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center h-[24px] text-[11px] font-semibold text-[#6a7282] bg-[#ececf0] border border-[#e5e7eb] px-[8px] rounded-[8px]"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Firmware Version
            </p>
            <p className="text-sm text-gray-700">ZTOS 1.0.0.123</p>
          </div>
        </div>
      )}

      {/* Policy Rules */}
      {connector.policyRules && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Policy Rules
          </p>
          <div className="space-y-1">
            {connector.policyRules.map((rule, i) => (
              <p key={i} className="text-sm text-gray-700 border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                {rule}
              </p>
            ))}
          </div>
        </div>
      )}
      </div>
    </>
  );
}

export function ConnectorsView() {
  const navigate = useNavigate();
  const [search,    setSearch]    = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy,    setSortBy]    = useState('user');

  const toMin = (d: string) => {
    const h = parseInt(d.match(/(\d+)h/)?.[1] ?? '0');
    const m = parseInt(d.match(/(\d+)m/)?.[1] ?? '0');
    return h * 60 + m;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = TENANT_SESSIONS.filter((s) => {
      if (q && !s.user.toLowerCase().includes(q) && !s.app.toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      return true;
    });
    if (sortBy === 'duration') list = [...list].sort((a, b) => toMin(b.duration) - toMin(a.duration));
    else if (sortBy === 'app')  list = [...list].sort((a, b) => a.app.localeCompare(b.app));
    else list = [...list].sort((a, b) => a.user.localeCompare(b.user));
    return list;
  }, [search, statusFilter, sortBy]);

  return (
    <div className="space-y-8 pb-10">
      {/* Connector cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Connectors and Tunnels</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connectors.map((c) => (
            <ConnectorCard key={c.name} connector={c} />
          ))}
        </div>
      </div>

      {/* Active Sessions table */}
      <div>
        <h2 className="text-sm font-semibold text-[#1a1a1a] mb-3">Active Sessions</h2>
        <TablePanel>
          {/* Toolbar */}
          <div className="flex items-center gap-[10px] px-4 py-3 border-b border-[rgba(0,0,0,0.1)] bg-white flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-[14px] h-[14px] absolute left-[10px] top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
              <input
                type="text"
                placeholder="Search by user or app…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-[34px] pl-[32px] pr-3 w-[220px] text-[13px] text-[#1a1a1a] border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0066cc] placeholder:text-[#9ca3af]"
              />
            </div>

            {/* Divider */}
            <div className="w-px h-[20px] bg-[rgba(0,0,0,0.1)] shrink-0" />

            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-[34px] pl-3 pr-8 text-[13px] text-[#1a1a1a] border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="idle">Idle</option>
                <option value="disconnected">Disconnected</option>
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#717182]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-[34px] pl-3 pr-8 text-[13px] text-[#1a1a1a] border border-[rgba(0,0,0,0.1)] rounded-[8px] bg-white cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
              >
                <option value="user">Sort: User (A→Z)</option>
                <option value="duration">Sort: Duration (longest)</option>
                <option value="app">Sort: Application (A→Z)</option>
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#717182]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>

          {/* Table */}
          <DataTable>
            <THead>
              <tr>
                <TH>Connected User</TH>
                <TH>Application</TH>
                <TH>Session Duration</TH>
              </tr>
            </THead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-[13px] text-[#717182] text-center">
                    No sessions match the current filters.
                  </td>
                </tr>
              ) : filtered.map((s) => {
                const meta = SESSION_STATUS_META[s.status];
                return (
                  <TR
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/all-tenants-system-status/${s.connectorId}`)}
                  >
                    <TD>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarFallback className={`text-[10px] font-semibold text-white ${AVATAR_COLOR}`}>
                            {emailInitials(s.user)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[13px] text-foreground">{s.user}</span>
                      </div>
                    </TD>
                    <TD>{s.app}</TD>
                    <TD className="tabular-nums text-[#717182]">{s.duration}</TD>
                  </TR>
                );
              })}
            </tbody>
          </DataTable>

          <TableFoot>
            <span>
              {filtered.length !== TENANT_SESSIONS.length
                ? `${filtered.length} of ${TENANT_SESSIONS.length} sessions`
                : `${TENANT_SESSIONS.length} sessions`}
            </span>
          </TableFoot>
        </TablePanel>
      </div>
    </div>
  );
}
