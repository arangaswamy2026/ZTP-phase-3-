import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import {
  Plus,
  Minus,
  ChevronDown,
  X,
  Search,
  Trash2,
  FileSpreadsheet,
  CheckCircle,
  CloudUpload,
  Shield,
  Info,
} from 'lucide-react';
import { SaasApp, SaasAppPicker, AppDetailModal } from '../components/SaasAppPicker';
import { PageHeader } from '../components/PageHeader';
import { toast } from 'sonner@2.0.3';

const USERS_LIST = ['Alice', 'John', 'Sarah', 'Michael', 'Emily', 'David'];

type SourceRow = {
  id: string;
  type: 'Users' | 'Groups';
  selectedItems: string[];
  addedGroups?: string[];
};

type DestinationRow = {
  id: string;
  type: 'FQDN' | 'IP Ranges' | 'Applications';
  fqdn?: string;
  ipRange?: string;
  protocols: string;
  ports: string;
  anyProtocol: boolean;
  anyPort: boolean;
  anyIP: boolean;
  selectedItems?: string[];
};

export function CreatePrivateAccessPolicyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // General Info
  const [policyName, setPolicyName] = useState('');
  const [description, setDescription] = useState('');

  // Action - toggle between Allow/Block
  const [action, setAction] = useState<'ALLOW' | 'BLOCK'>('ALLOW');

  // Source & Destination
  const [sourceRows, setSourceRows] = useState<SourceRow[]>([
    { id: '1', type: 'Groups', selectedItems: [], addedGroups: [] },
  ]);
  const [destinationRows, setDestinationRows] = useState<DestinationRow[]>([
    { id: '1', type: 'IP Ranges', fqdn: '', ipRange: '', protocols: 'Protocols', ports: '', anyProtocol: false, anyPort: false, anyIP: false },
  ]);

  // Dropdowns state
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  // Applications detail modal
  const [detailApp, setDetailApp] = useState<SaasApp | null>(null);

  // Group search state (per source row, Users only)
  const [groupSearch, setGroupSearch] = useState<Record<string, string>>({});

  // Manual group name input (per source row, Groups type)
  const [groupInput, setGroupInput] = useState<Record<string, string>>({});

  // CSV upload state
  const [csvModalRowId, setCsvModalRowId] = useState<string | null>(null);
  const [csvModalStage, setCsvModalStage] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [csvModalFileName, setCsvModalFileName] = useState<string>('');
  const [csvModalRowCount, setCsvModalRowCount] = useState<number>(0);

  // Device Trust
  const [deviceTrust, setDeviceTrust] = useState<'high' | 'medium' | 'low' | 'ignore'>('ignore');

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown-trigger]') && !target.closest('[data-dropdown-menu]')) {
        setOpenDropdowns({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isFormValid = policyName.trim();

  const handleSave = () => {
    toast.success(isEdit ? 'Policy updated successfully' : 'Policy created successfully');
    navigate('/access-policies');
  };

  const handleCancel = () => {
    navigate('/access-policies');
  };

  // Source row functions
  const addSourceRow = (type: 'Users' | 'Groups') => {
    const newRow: SourceRow = {
      id: Date.now().toString(),
      type,
      selectedItems: [],
      addedGroups: type === 'Groups' ? [] : undefined,
    };
    setSourceRows([...sourceRows, newRow]);
  };

  const removeSourceRow = (rowId: string) => {
    if (sourceRows.length > 1) {
      setSourceRows(sourceRows.filter((row) => row.id !== rowId));
    }
  };

  const toggleSourceItem = (rowId: string, item: string) => {
    setSourceRows(
      sourceRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              selectedItems: row.selectedItems.includes(item)
                ? row.selectedItems.filter((i) => i !== item)
                : [...row.selectedItems, item],
            }
          : row
      )
    );
  };

  const removeSourceItem = (rowId: string, item: string) => {
    setSourceRows(
      sourceRows.map((row) =>
        row.id === rowId
          ? { ...row, selectedItems: row.selectedItems.filter((i) => i !== item) }
          : row
      )
    );
  };

  // Destination row functions
  const addDestinationRow = (type: 'FQDN' | 'IP Ranges' | 'Applications') => {
    const newRow: DestinationRow = {
      id: Date.now().toString(),
      type,
      fqdn: '',
      ipRange: '',
      protocols: 'Protocols',
      ports: '',
      anyProtocol: false,
      anyPort: false,
      anyIP: false,
      selectedItems: type === 'Applications' ? [] : undefined,
    };
    setDestinationRows([...destinationRows, newRow]);
  };

  const toggleDestinationApp = (rowId: string, app: string) => {
    setDestinationRows(destinationRows.map(row =>
      row.id === rowId
        ? {
            ...row,
            selectedItems: (row.selectedItems || []).includes(app)
              ? (row.selectedItems || []).filter(i => i !== app)
              : [...(row.selectedItems || []), app],
          }
        : row
    ));
  };

  const removeDestinationApp = (rowId: string, app: string) => {
    setDestinationRows(destinationRows.map(row =>
      row.id === rowId
        ? { ...row, selectedItems: (row.selectedItems || []).filter(i => i !== app) }
        : row
    ));
  };

  const removeDestinationRow = (rowId: string) => {
    if (destinationRows.length > 1) {
      setDestinationRows(destinationRows.filter((row) => row.id !== rowId));
    }
  };

  const updateDestinationRow = (rowId: string, updates: Partial<DestinationRow>) => {
    setDestinationRows(
      destinationRows.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    );
  };

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };


  return (
    <>
    {detailApp && <AppDetailModal app={detailApp} onClose={() => setDetailApp(null)} />}
    <div className="flex flex-col gap-[24px] w-full max-w-[900px]">
      <PageHeader
        title="Create Private Access Policy"
        back={{ label: 'Back to Access Policies', onClick: () => navigate('/access-policies') }}
      />

      {/* General Information */}
      <div className="bg-white rounded-[12px] border border-[#e5e7eb] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
        <div className="px-[28px] py-[20px] flex flex-col gap-[16px]">
          <h3 className="font-['Inter',sans-serif] font-bold text-[16px] leading-[24px] text-[#101828]">
            General Information
          </h3>

          <div className="flex flex-col gap-[6px]">
            <Label className="font-['Inter',sans-serif] font-medium text-[13px] text-[#364153]">
              Policy Name <span className="text-[#fb2c36]">*</span>
            </Label>
            <Input
              placeholder="Enter Policy Name"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              className="bg-white border-[#e5e7eb] rounded-[8px] h-[40px] font-['Inter',sans-serif] text-[14px]"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <Label className="font-['Inter',sans-serif] font-medium text-[13px] text-[#364153]">
              Description
            </Label>
            <Textarea
              placeholder="Describe what this policy does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white border-[#e5e7eb] rounded-[8px] min-h-[80px] font-['Inter',sans-serif] text-[14px]"
            />
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="bg-white rounded-[12px] border border-[#e5e7eb] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
        <div className="px-[28px] py-[20px] flex flex-col gap-[16px]">
          <h3 className="font-['Inter',sans-serif] font-bold text-[16px] leading-[24px] text-[#101828]">
            Action
          </h3>

          <div className="flex w-full border border-[#e5e7eb] rounded-[8px] overflow-hidden">
            <button
              onClick={() => setAction('ALLOW')}
              className={`flex-1 h-[40px] font-['Inter',sans-serif] font-medium text-[14px] transition-colors ${
                action === 'ALLOW'
                  ? 'bg-[#f9fafb] text-[#16a34a]'
                  : 'bg-white text-[#6a7282] hover:bg-[#f9fafb]'
              }`}
            >
              ALLOW
            </button>
            <button
              onClick={() => setAction('BLOCK')}
              className={`flex-1 h-[40px] font-['Inter',sans-serif] font-medium text-[14px] transition-colors border-l border-[#e5e7eb] ${
                action === 'BLOCK'
                  ? 'bg-[#f9fafb] text-[#dc2626]'
                  : 'bg-white text-[#6a7282] hover:bg-[#f9fafb]'
              }`}
            >
              BLOCK
            </button>
          </div>
        </div>
      </div>

      {/* Source */}
      <div className="bg-white rounded-[12px] border border-[#e5e7eb] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
        <div className="px-[28px] py-[20px] flex flex-col gap-[16px]">
          <div className="flex items-center justify-between">
            <h3 className="font-['Inter',sans-serif] font-bold text-[16px] leading-[24px] text-[#101828]">
              Source
            </h3>
            <button
              onClick={() => addSourceRow(sourceRows.some((r) => r.type === 'Groups') ? 'Users' : 'Groups')}
              className="w-[24px] h-[24px] border border-[#0b8aeb] rounded-[3px] flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
            >
              <Plus className="w-[12px] h-[12px] text-[#0b8aeb]" />
            </button>
          </div>

          {sourceRows.map((row) => (
            <div key={row.id} className="flex gap-[6px] items-start">
              {/* Type Dropdown */}
              <div className="relative">
                <button
                  data-dropdown-trigger
                  onClick={() => toggleDropdown(`source-type-${row.id}`)}
                  className="bg-white border border-[#e5e7eb] rounded-[8px] h-[43px] px-[13px] flex items-center justify-between w-[148px]"
                >
                  <span className="text-[14px] text-[#0a0a0a]">{row.type}</span>
                  <ChevronDown className="w-[16px] h-[16px] text-[#717182] opacity-50" />
                </button>
                {openDropdowns[`source-type-${row.id}`] && (
                  <div
                    data-dropdown-menu
                    className="absolute top-full mt-1 left-0 w-full bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg z-50"
                  >
                    <div
                      onClick={() => {
                        setSourceRows(sourceRows.map((r) => r.id === row.id ? { ...r, type: 'Users', selectedItems: [], addedGroups: undefined } : r));
                        toggleDropdown(`source-type-${row.id}`);
                      }}
                      className="px-[13px] py-[8px] hover:bg-[#f9fafb] cursor-pointer text-[14px] text-[#364153]"
                    >
                      Users
                    </div>
                    <div
                      onClick={() => {
                        setSourceRows(sourceRows.map((r) => r.id === row.id ? { ...r, type: 'Groups', selectedItems: [], addedGroups: [] } : r));
                        toggleDropdown(`source-type-${row.id}`);
                      }}
                      className="px-[13px] py-[8px] hover:bg-[#f9fafb] cursor-pointer text-[14px] text-[#364153]"
                    >
                      Groups
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Items + Upload */}
              <div className="flex-1 flex flex-col gap-[6px]">
                <div className="relative">

                  {row.type === 'Users' ? (
                    /* ── Users: existing search dropdown ── */
                    <>
                      <div className="bg-white border border-[#e5e7eb] rounded-[8px] min-h-[43px] px-[13px] py-[8px] flex items-center justify-between">
                        <div className="flex flex-wrap gap-[5px]">
                          {row.selectedItems.map((item) => (
                            <div
                              key={item}
                              className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[6px] px-[8px] py-[4px] flex items-center gap-2 h-[26px]"
                            >
                              <span className="text-[12px] text-[#364153]">{item}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeSourceItem(row.id, item); }}
                                className="text-[#9ca3af] hover:text-[#6a7282]"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {row.selectedItems.length === 0 && (
                            <span className="text-[13px] text-[#9ca3af]">Search or select users…</span>
                          )}
                        </div>
                        <button
                          data-dropdown-trigger
                          onClick={() => toggleDropdown(`source-items-${row.id}`)}
                          className="text-[#717182] opacity-50 shrink-0"
                        >
                          <ChevronDown className="w-[16px] h-[16px]" />
                        </button>
                      </div>
                      {openDropdowns[`source-items-${row.id}`] && (
                        <div
                          data-dropdown-menu
                          className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg z-50"
                        >
                          <div className="px-[10px] pt-[10px] pb-[6px] border-b border-[#f3f4f6]">
                            <div className="relative">
                              <Search className="absolute left-[10px] top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-[#9ca3af]" />
                              <input
                                autoFocus
                                type="text"
                                placeholder="Search users…"
                                value={groupSearch[row.id] ?? ''}
                                onChange={(e) => setGroupSearch((prev) => ({ ...prev, [row.id]: e.target.value }))}
                                className="w-full h-[32px] pl-[30px] pr-[8px] border border-[#e5e7eb] rounded-[6px] text-[13px] text-[#364153] placeholder:text-[#9ca3af] outline-none focus:border-[#0b8aeb]"
                              />
                            </div>
                          </div>
                          <div className="max-h-[160px] overflow-y-auto">
                            {USERS_LIST
                              .filter((item) => item.toLowerCase().includes((groupSearch[row.id] ?? '').toLowerCase()))
                              .map((item) => (
                                <div
                                  key={item}
                                  onClick={() => toggleSourceItem(row.id, item)}
                                  className="px-[13px] py-[8px] hover:bg-[#f9fafb] cursor-pointer flex items-center gap-2"
                                >
                                  <Checkbox checked={row.selectedItems.includes(item)} />
                                  <span className="text-[14px] text-[#364153]">{item}</span>
                                </div>
                              ))}
                            {USERS_LIST.filter((item) =>
                              item.toLowerCase().includes((groupSearch[row.id] ?? '').toLowerCase())
                            ).length === 0 && (
                              <div className="px-[13px] py-[10px] text-[13px] text-[#9ca3af]">No results found</div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* ── Groups: add-manually + upload CSV interaction ── */
                    <>
                      <button
                        data-dropdown-trigger
                        onClick={() => toggleDropdown(`source-items-${row.id}`)}
                        className="w-full bg-white border border-[#e5e7eb] rounded-[8px] min-h-[40px] px-[13px] py-[6px] flex items-center justify-between gap-[8px]"
                      >
                        <div className="flex flex-wrap gap-[5px] flex-1 min-w-0">
                          {row.selectedItems.length > 0 ? (
                            row.selectedItems.map((item) => (
                              <div key={item} className="bg-[#f0f7ff] border border-[#bfdbfe] rounded-[6px] px-[8px] py-[3px] flex items-center gap-[5px]">
                                <span className="text-[12px] text-[#1d4ed8] font-medium">{item}</span>
                                <span
                                  onClick={(e) => { e.stopPropagation(); toggleSourceItem(row.id, item); }}
                                  className="text-[#93c5fd] hover:text-[#0b8aeb] cursor-pointer"
                                >
                                  <X className="w-[10px] h-[10px]" />
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-[13px] text-[#9ca3af]">Select groups…</span>
                          )}
                        </div>
                        <ChevronDown className={`w-[16px] h-[16px] text-[#717182] opacity-50 shrink-0 transition-transform ${openDropdowns[`source-items-${row.id}`] ? 'rotate-180' : ''}`} />
                      </button>

                      {openDropdowns[`source-items-${row.id}`] && (
                        <div
                          data-dropdown-menu
                          className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg z-50 overflow-hidden"
                        >
                          {/* Empty state */}
                          {(row.addedGroups ?? []).length === 0 ? (
                            <div className="flex flex-col items-center gap-[10px] pt-[28px] pb-[20px] px-[20px] text-center">
                              <div className="w-[40px] h-[40px] rounded-full bg-[#eff6ff] flex items-center justify-center">
                                <Shield className="w-[20px] h-[20px] text-[#3b82f6]" />
                              </div>
                              <div>
                                <p className="text-[13px] font-bold text-[#101828]">No Groups Added Yet.</p>
                                <p className="text-[12px] text-[#6a7282] mt-[4px] leading-[18px]">
                                  Add group names manually or upload a CSV / Excel<br />file to import your groups.
                                </p>
                                <p className="text-[11px] text-[#9ca3af] mt-[8px] leading-[16px] flex items-start gap-[5px] justify-center">
                                  <Info className="w-[11px] h-[11px] shrink-0 mt-[2px] text-[#9ca3af]" />
                                  Group names must match the group names configured in your Identity Provider (IDP).
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="max-h-[180px] overflow-y-auto">
                              {(row.addedGroups ?? []).map((item) => {
                                const isSelected = row.selectedItems.includes(item);
                                return (
                                  <div
                                    key={item}
                                    onClick={() => toggleSourceItem(row.id, item)}
                                    className="group flex items-center justify-between px-[14px] py-[8px] hover:bg-[#f9fafb] border-b border-[#f3f4f6] last:border-0 cursor-pointer"
                                  >
                                    <div className="flex items-center gap-[8px] flex-1 min-w-0">
                                      <Checkbox
                                        checked={isSelected}
                                        className="data-[state=checked]:bg-[#0066cc] data-[state=checked]:border-[#0066cc] shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                        onCheckedChange={() => toggleSourceItem(row.id, item)}
                                      />
                                      <span className="text-[13px] text-[#364153] truncate">{item}</span>
                                    </div>
                                    <div className="flex items-center gap-[6px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newName = prompt('Edit group name:', item);
                                          if (newName && newName.trim() && newName.trim() !== item) {
                                            setSourceRows((prev) => prev.map((r) =>
                                              r.id === row.id ? {
                                                ...r,
                                                addedGroups: (r.addedGroups ?? []).map((g) => g === item ? newName.trim() : g),
                                                selectedItems: r.selectedItems.map((s) => s === item ? newName.trim() : s),
                                              } : r
                                            ));
                                          }
                                        }}
                                        className="text-[#9ca3af] hover:text-[#0b8aeb] transition-colors"
                                        title="Edit"
                                      >
                                        <svg className="w-[13px] h-[13px]" fill="none" viewBox="0 0 16 16">
                                          <path d="M11.333 2a1.886 1.886 0 0 1 2.667 2.667L5.333 13.333 2 14l.667-3.333L11.333 2Z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSourceRows((prev) => prev.map((r) =>
                                            r.id === row.id ? {
                                              ...r,
                                              addedGroups: (r.addedGroups ?? []).filter((g) => g !== item),
                                              selectedItems: r.selectedItems.filter((s) => s !== item),
                                            } : r
                                          ));
                                        }}
                                        className="text-[#9ca3af] hover:text-[#d4183d] transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-[13px] h-[13px]" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Add group name input */}
                          <div className="px-[14px] pt-[10px] pb-[4px] border-t border-[#f3f4f6]">
                            <div className="flex gap-[8px]">
                              <input
                                type="text"
                                placeholder="Enter group name…"
                                value={groupInput[row.id] ?? ''}
                                onChange={(e) => setGroupInput((prev) => ({ ...prev, [row.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = (groupInput[row.id] ?? '').trim();
                                    if (val && !(row.addedGroups ?? []).includes(val)) {
                                      setSourceRows((prev) => prev.map((r) =>
                                        r.id === row.id ? { ...r, addedGroups: [...(r.addedGroups ?? []), val] } : r
                                      ));
                                    }
                                    setGroupInput((prev) => ({ ...prev, [row.id]: '' }));
                                  }
                                }}
                                className="flex-1 h-[34px] px-[10px] border border-[#e5e7eb] rounded-[7px] text-[13px] text-[#364153] placeholder:text-[#9ca3af] outline-none focus:border-[#0b8aeb] bg-white"
                              />
                              <button
                                onClick={() => {
                                  const val = (groupInput[row.id] ?? '').trim();
                                  if (val && !(row.addedGroups ?? []).includes(val)) {
                                    setSourceRows((prev) => prev.map((r) =>
                                      r.id === row.id ? { ...r, addedGroups: [...(r.addedGroups ?? []), val] } : r
                                    ));
                                  }
                                  setGroupInput((prev) => ({ ...prev, [row.id]: '' }));
                                }}
                                className="h-[34px] px-[12px] rounded-[7px] bg-[#0b8aeb] hover:bg-[#0070cc] text-white text-[13px] font-medium transition-colors whitespace-nowrap"
                              >
                                Add
                              </button>
                            </div>
                          </div>

                          {/* Upload CSV */}
                          <div className="px-[14px] pt-[8px] pb-[12px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdowns({});
                                setCsvModalRowId(row.id);
                                setCsvModalStage('idle');
                                setCsvModalFileName('');
                              }}
                              className="flex items-center justify-center gap-[8px] w-full h-[34px] border border-dashed border-[#0b8aeb] rounded-[7px] text-[#0b8aeb] text-[13px] font-medium hover:bg-[#f0f7ff] transition-colors"
                            >
                              <FileSpreadsheet className="w-[13px] h-[13px] shrink-0" />
                              Upload CSV / Excel to import groups
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeSourceRow(row.id)}
                className="w-[24px] h-[24px] border border-[#0b8aeb] rounded-[3px] flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity shrink-0"
              >
                <Minus className="w-[12px] h-[12px] text-[#0b8aeb]" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Destination */}
      <div className="bg-white rounded-[12px] border border-[#e5e7eb] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
        <div className="px-[28px] py-[20px] flex flex-col gap-[16px]">
          <div className="flex items-center justify-between">
            <h3 className="font-['Inter',sans-serif] font-bold text-[16px] leading-[24px] text-[#101828]">
              Destination
            </h3>
            <button
              onClick={() => addDestinationRow('IP Ranges')}
              className="w-[24px] h-[24px] border border-[#0b8aeb] rounded-[3px] flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
            >
              <Plus className="w-[12px] h-[12px] text-[#0b8aeb]" />
            </button>
          </div>

          {destinationRows.map((row) => (
            <div key={row.id} className="flex flex-col gap-[8px]">
              <div className="flex gap-[6px] items-center">
                {/* Type Dropdown */}
                <div className="relative">
                  <button
                    data-dropdown-trigger
                    onClick={() => toggleDropdown(`destination-type-${row.id}`)}
                    className="bg-white border border-[#e5e7eb] rounded-[8px] h-[43px] px-[13px] flex items-center justify-between w-[148px]"
                  >
                    <span className="text-[14px] text-[#0a0a0a]">{row.type}</span>
                    <ChevronDown className="w-[16px] h-[16px] text-[#717182] opacity-50" />
                  </button>
                  {openDropdowns[`destination-type-${row.id}`] && (
                    <div
                      data-dropdown-menu
                      className="absolute top-full mt-1 left-0 w-full bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg z-50"
                    >
                      <div
                        onClick={() => {
                          updateDestinationRow(row.id, { type: 'FQDN', fqdn: '', ipRange: '', selectedItems: undefined });
                          toggleDropdown(`destination-type-${row.id}`);
                        }}
                        className="px-[13px] py-[8px] hover:bg-[#f9fafb] cursor-pointer text-[14px] text-[#364153]"
                      >
                        FQDN
                      </div>
                      <div
                        onClick={() => {
                          updateDestinationRow(row.id, { type: 'IP Ranges', fqdn: '', ipRange: '', selectedItems: undefined });
                          toggleDropdown(`destination-type-${row.id}`);
                        }}
                        className="px-[13px] py-[8px] hover:bg-[#f9fafb] cursor-pointer text-[14px] text-[#364153]"
                      >
                        IP Ranges
                      </div>
                      <div
                        onClick={() => {
                          updateDestinationRow(row.id, { type: 'Applications', fqdn: undefined, ipRange: undefined, selectedItems: [] });
                          toggleDropdown(`destination-type-${row.id}`);
                        }}
                        className="px-[13px] py-[8px] hover:bg-[#f9fafb] cursor-pointer text-[14px] text-[#364153]"
                      >
                        Applications
                      </div>
                    </div>
                  )}
                </div>

                {/* Applications picker */}
                {row.type === 'Applications' ? (
                  <SaasAppPicker
                    selectedItems={row.selectedItems || []}
                    onToggle={(app) => toggleDestinationApp(row.id, app)}
                    onRemove={(app) => removeDestinationApp(row.id, app)}
                    onViewDetails={(app) => setDetailApp(app)}
                  />
                ) : (
                  <>
                    {/* FQDN/IP Input */}
                    <Input
                      placeholder={row.type === 'FQDN' ? 'internal.myapp.com' : '192.168.1.0/24'}
                      value={row.type === 'FQDN' ? row.fqdn : row.ipRange}
                      onChange={(e) =>
                        updateDestinationRow(row.id, {
                          [row.type === 'FQDN' ? 'fqdn' : 'ipRange']: e.target.value,
                        })
                      }
                      disabled={row.type === 'IP Ranges' && row.anyIP}
                      className="flex-1 bg-white border-[#e5e7eb] rounded-[8px] h-[43px] font-['Inter',sans-serif] text-[14px] disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
                    />

                    {/* Protocols Dropdown */}
                    <div className="relative w-[148px]">
                      <button
                        data-dropdown-trigger
                        onClick={() => toggleDropdown(`destination-protocol-${row.id}`)}
                        className="w-full bg-white border border-[#e5e7eb] rounded-[8px] h-[43px] px-[13px] flex items-center justify-between"
                      >
                        <span className="text-[14px] text-[#9ca3af]">{row.protocols}</span>
                        <ChevronDown className="w-[16px] h-[16px] text-[#717182] opacity-50" />
                      </button>
                      {openDropdowns[`destination-protocol-${row.id}`] && (
                        <div
                          data-dropdown-menu
                          className="absolute top-full mt-1 left-0 w-full bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg z-50"
                        >
                          {['TCP', 'UDP', 'All Protocols'].map((p) => (
                            <div
                              key={p}
                              onClick={() => {
                                updateDestinationRow(row.id, { protocols: p });
                                toggleDropdown(`destination-protocol-${row.id}`);
                              }}
                              className="px-[13px] py-[8px] hover:bg-[#f9fafb] cursor-pointer text-[14px] text-[#364153]"
                            >
                              {p}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Ports Input */}
                    <Input
                      placeholder="Ports: ex 22, 50-250"
                      value={row.ports}
                      onChange={(e) => updateDestinationRow(row.id, { ports: e.target.value })}
                      disabled={row.anyPort}
                      className="w-[200px] bg-white border-[#e5e7eb] rounded-[8px] h-[43px] font-['Inter',sans-serif] text-[14px] disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
                    />
                  </>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => removeDestinationRow(row.id)}
                  className="w-[24px] h-[24px] border border-[#0b8aeb] rounded-[3px] flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity shrink-0"
                >
                  <Minus className="w-[12px] h-[12px] text-[#0b8aeb]" />
                </button>
              </div>

              {/* Checkboxes Row — only for FQDN / IP Ranges */}
              {row.type === 'FQDN' && (
                <div className="flex items-center gap-[24px] ml-[154px]">
                  <div style={{ width: 'calc(100% - 148px - 200px - 48px)' }} />
                  <div style={{ width: '148px' }} />
                  <div className="flex items-center gap-[8px]" style={{ width: '200px' }}>
                    <Checkbox
                      checked={row.anyPort}
                      onCheckedChange={(checked) => updateDestinationRow(row.id, { anyPort: checked as boolean })}
                    />
                    <Label className="font-['Inter',sans-serif] font-medium text-[13px] text-[#364153] cursor-pointer">
                      Any
                    </Label>
                  </div>
                </div>
              )}
              {row.type === 'IP Ranges' && (
                <div className="flex items-center gap-[6px] ml-[154px]">
                  <div className="flex items-center gap-[8px]" style={{ width: 'calc(100% - 148px - 200px - 48px)' }}>
                    <Checkbox
                      checked={row.anyIP}
                      onCheckedChange={(checked) => updateDestinationRow(row.id, { anyIP: checked as boolean })}
                    />
                    <Label className="font-['Inter',sans-serif] font-medium text-[13px] text-[#364153] cursor-pointer">
                      Any
                    </Label>
                  </div>
                  <div style={{ width: '148px' }} />
                  <div className="flex items-center gap-[8px]" style={{ width: '200px' }}>
                    <Checkbox
                      checked={row.anyPort}
                      onCheckedChange={(checked) => updateDestinationRow(row.id, { anyPort: checked as boolean })}
                    />
                    <Label className="font-['Inter',sans-serif] font-medium text-[13px] text-[#364153] cursor-pointer">
                      Any
                    </Label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Device Trust */}
      <div className="bg-white rounded-[12px] border border-[#e5e7eb] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
        <div className="px-[28px] py-[20px] flex flex-col gap-[16px]">
          <h3 className="font-['Inter',sans-serif] font-bold text-[16px] leading-[24px] text-[#101828]">
            Device Trust
          </h3>
          <p className="font-['Inter',sans-serif] font-normal text-[13px] leading-[18px] text-[#6a7282]">
            Select the minimum trust level required. If a device's trust factors are not satisfied, consequences shown on each card applies.
          </p>

          <div className="grid grid-cols-2 gap-[16px]">
            {/* High Trust Level */}
            <button
              onClick={() => setDeviceTrust('high')}
              className={`relative flex flex-col gap-[12px] pl-[18px] pr-[2px] py-[18px] rounded-[8px] border-2 transition-all text-left ${
                deviceTrust === 'high'
                  ? 'border-[#1447E6] bg-[#f0f7ff]'
                  : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db]'
              }`}
            >
              <h4 className="font-['Inter',sans-serif] font-bold text-[15px] leading-[20px] text-[#101828]">
                High Trust Level
              </h4>
              <p className="font-['Inter',sans-serif] font-normal text-[13px] leading-[18px] text-[#6a7282]">
                Only devices with a high trust score are allowed.
              </p>
            </button>

            {/* Medium Trust Level */}
            <button
              onClick={() => setDeviceTrust('medium')}
              className={`relative flex flex-col gap-[12px] pl-[18px] pr-[2px] py-[18px] rounded-[8px] border-2 transition-all text-left ${
                deviceTrust === 'medium'
                  ? 'border-[#1447E6] bg-[#f0f7ff]'
                  : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db]'
              }`}
            >
              <h4 className="font-['Inter',sans-serif] font-bold text-[15px] leading-[20px] text-[#101828]">
                Medium Trust Level
              </h4>
              <p className="font-['Inter',sans-serif] font-normal text-[13px] leading-[18px] text-[#6a7282]">
                Devices with medium trust scores are allowed.
              </p>
            </button>

            {/* Low Trust Level */}
            <button
              onClick={() => setDeviceTrust('low')}
              className={`relative flex flex-col gap-[12px] pl-[18px] pr-[2px] py-[18px] rounded-[8px] border-2 transition-all text-left ${
                deviceTrust === 'low'
                  ? 'border-[#1447E6] bg-[#f0f7ff]'
                  : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db]'
              }`}
            >
              <h4 className="font-['Inter',sans-serif] font-bold text-[15px] leading-[20px] text-[#101828]">
                Low Trust Level
              </h4>
              <p className="font-['Inter',sans-serif] font-normal text-[13px] leading-[18px] text-[#6a7282]">
                Devices with low trust scores are allowed.
              </p>
            </button>

            {/* Ignore Trust Level */}
            <button
              onClick={() => setDeviceTrust('ignore')}
              className={`relative flex flex-col gap-[12px] pl-[18px] pr-[2px] py-[18px] rounded-[8px] border-2 transition-all text-left ${
                deviceTrust === 'ignore'
                  ? 'border-[#1447E6] bg-[#f0f7ff]'
                  : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db]'
              }`}
            >
              <h4 className="font-['Inter',sans-serif] font-bold text-[15px] leading-[20px] text-[#101828]">
                Ignore Trust Level
              </h4>
              <p className="font-['Inter',sans-serif] font-normal text-[13px] leading-[18px] text-[#6a7282]">
                All trust levels allowed.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Default Trust Profile */}
      <div className="bg-white rounded-[12px] border border-[#e5e7eb] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
        <div className="px-[28px] py-[20px]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-[4px]">
              <div className="flex items-center gap-[8px]">
                <h3 className="font-['Inter',sans-serif] font-bold text-[16px] leading-[24px] text-[#101828]">
                  Default Trust Profile
                </h3>
                <span className="inline-flex items-center rounded-[6px] bg-[#dcfce7] px-[8px] py-[2px] font-['Inter',sans-serif] font-medium text-[11px] text-[#16a34a]">
                  Active
                </span>
              </div>
              <p className="font-['Inter',sans-serif] font-normal text-[13px] leading-[18px] text-[#6a7282]">
                Enforces 10 trust factors including disk encryption, antivirus, firewall, OS version, and more.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-[8px] border-[#d1d5db] px-[16px]"
              onClick={() => navigate('/profiles/default-trust-profile')}
            >
              <span className="font-['Inter',sans-serif] font-medium text-[14px] leading-[20px] text-[#364153]">
                View
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-[10px] pb-[8px]">
        <Button
          variant="outline"
          className="rounded-[8px] border-[#d1d5db] px-[20px]"
          onClick={handleCancel}
        >
          <span className="font-['Inter',sans-serif] font-medium text-[14px] leading-[20px] text-[#364153]">
            Cancel
          </span>
        </Button>
        <Button
          className="rounded-[8px] bg-[#0066cc] hover:bg-[#0052a6] text-white px-[20px]"
          onClick={handleSave}
        >
          <span className="font-['Inter',sans-serif] font-medium text-[14px] leading-[20px] text-white">
            Create Policy
          </span>
        </Button>
      </div>
    </div>

    {/* CSV Upload Modal */}
    {csvModalRowId !== null && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => { if (csvModalStage !== 'uploading') setCsvModalRowId(null); }}
        />
        <div className="relative bg-white rounded-[12px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] w-[480px] max-w-[calc(100vw-32px)] overflow-hidden">

          {/* IDLE */}
          {csvModalStage === 'idle' && (
            <>
              <div className="flex items-center justify-between px-[24px] pt-[20px] pb-[16px] border-b border-[#e5e7eb]">
                <h2 className="text-[15px] font-bold text-[#101828]">Upload Group Data</h2>
                <button
                  onClick={() => setCsvModalRowId(null)}
                  className="w-[28px] h-[28px] flex items-center justify-center rounded-[6px] hover:bg-[#f3f4f6] text-[#6a7282]"
                >
                  <X className="w-[16px] h-[16px]" />
                </button>
              </div>
              <div className="px-[24px] py-[20px] flex flex-col gap-[16px]">
                <p className="text-[13px] text-[#6a7282] leading-[20px]">
                  Upload a CSV or XLS file containing group names. Users and groups will be manually provisioned. Uploading a new file will override any previously imported data.
                </p>
                <label className="flex flex-col items-center justify-center gap-[10px] border-2 border-dashed border-[#d1d5db] rounded-[10px] py-[32px] px-[20px] cursor-pointer hover:border-[#0b8aeb] hover:bg-[#f0f7ff] transition-colors group">
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setCsvModalFileName(file.name);
                      e.target.value = '';
                    }}
                  />
                  <div className="w-[44px] h-[44px] rounded-[10px] bg-[#eff6ff] flex items-center justify-center group-hover:bg-[#dbeafe] transition-colors">
                    <CloudUpload className="w-[22px] h-[22px] text-[#0b8aeb]" />
                  </div>
                  {csvModalFileName ? (
                    <div className="flex items-center gap-[8px]">
                      <FileSpreadsheet className="w-[16px] h-[16px] text-[#0b8aeb]" />
                      <span className="text-[13px] font-medium text-[#101828]">{csvModalFileName}</span>
                      <button
                        onClick={(e) => { e.preventDefault(); setCsvModalFileName(''); }}
                        className="text-[#9ca3af] hover:text-[#6a7282]"
                      >
                        <X className="w-[13px] h-[13px]" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[13px] font-medium text-[#101828]">
                        Drop file here or <span className="text-[#0b8aeb]">browse</span>
                      </span>
                      <span className="text-[11px] text-[#9ca3af]">Supports .csv, .xls, .xlsx</span>
                    </>
                  )}
                </label>
              </div>
              <div className="flex items-center justify-end gap-[10px] px-[24px] pb-[20px]">
                <button
                  onClick={() => setCsvModalRowId(null)}
                  className="h-[36px] px-[16px] rounded-[8px] border border-[#d1d5db] text-[13px] font-medium text-[#364153] hover:bg-[#f9fafb] transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!csvModalFileName}
                  onClick={() => {
                    setCsvModalStage('uploading');
                    setCsvModalRowCount(Math.floor(Math.random() * 40) + 5);
                    setTimeout(() => setCsvModalStage('done'), 1800);
                  }}
                  className="h-[36px] px-[16px] rounded-[8px] bg-[#0b8aeb] text-white text-[13px] font-medium hover:bg-[#0070cc] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Upload
                </button>
              </div>
            </>
          )}

          {/* UPLOADING */}
          {csvModalStage === 'uploading' && (
            <div className="flex flex-col items-center justify-center gap-[16px] py-[48px] px-[32px]">
              <div className="w-[48px] h-[48px] rounded-full border-[3px] border-[#e5e7eb] border-t-[#0b8aeb] animate-spin" />
              <div className="text-center">
                <p className="text-[14px] font-semibold text-[#101828]">Uploading…</p>
                <p className="text-[12px] text-[#9ca3af] mt-[4px]">{csvModalFileName}</p>
              </div>
            </div>
          )}

          {/* DONE */}
          {csvModalStage === 'done' && (
            <>
              <div className="flex flex-col items-center gap-[12px] pt-[36px] pb-[24px] px-[32px]">
                <div className="w-[52px] h-[52px] rounded-full bg-[#dcfce7] flex items-center justify-center">
                  <CheckCircle className="w-[26px] h-[26px] text-[#16a34a]" />
                </div>
                <div className="text-center">
                  <p className="text-[15px] font-bold text-[#101828]">Upload successful</p>
                  <p className="text-[13px] text-[#6a7282] mt-[4px] leading-[20px]">
                    <span className="font-medium text-[#101828]">{csvModalFileName}</span> has been imported.
                    Group data is now provisioned for this source row.
                  </p>
                </div>
              </div>
              <div className="border-t border-[#e5e7eb] mx-[24px]" />
              <div className="px-[24px] py-[14px]">
                <div className="flex items-center justify-between bg-[#f9fafb] rounded-[8px] px-[14px] py-[10px]">
                  <div className="flex items-start gap-[10px] min-w-0">
                    <FileSpreadsheet className="w-[16px] h-[16px] text-[#0b8aeb] mt-[1px] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[#101828] truncate">{csvModalFileName}</p>
                      <p className="text-[12px] text-[#6a7282] mt-[1px]">{csvModalRowCount} entries · Group data provisioned</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCsvModalRowId(null)}
                    className="flex items-center gap-[5px] text-[#d4183d] text-[12px] font-medium hover:underline shrink-0 ml-[16px]"
                  >
                    <Trash2 className="w-[12px] h-[12px]" />
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex justify-end px-[24px] pb-[20px]">
                <button
                  onClick={() => {
                    const groupName = csvModalFileName.replace(/\.(csv|xls|xlsx)$/i, '');
                    setSourceRows((prev) => prev.map((r) =>
                      r.id === csvModalRowId ? {
                        ...r,
                        addedGroups: (r.addedGroups ?? []).includes(groupName)
                          ? r.addedGroups ?? []
                          : [...(r.addedGroups ?? []), groupName],
                      } : r
                    ));
                    setCsvModalRowId(null);
                  }}
                  className="h-[36px] px-[20px] rounded-[8px] bg-[#0b8aeb] text-white text-[13px] font-medium hover:bg-[#0070cc] transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
}