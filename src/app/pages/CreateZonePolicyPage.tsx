import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { SaasApp, SaasAppPicker, AppDetailModal } from '../components/SaasAppPicker';
import { PageHeader } from '../components/PageHeader';
import { MOCK_POLICIES } from '../components/policies/PolicyData';
import { toast } from 'sonner@2.0.3';
import { SecurityControlCard, CATEGORY_LIST, GEO_LIST } from '../components/SecurityControlCard';

const THREAT_CATEGORIES = [
  { name: 'Bots / Cryptomining', desc: 'Blocks bot networks and cryptocurrency mining scripts' },
  { name: 'Dangerous Configuration / History', desc: 'Blocks sites with known dangerous configurations' },
  { name: 'Dangerous 3rd Party Infrastructure', desc: 'Blocks domains hosted on compromised infrastructure' },
  { name: 'Dangerous Nameserver', desc: 'Blocks domains using malicious nameservers' },
  { name: 'Malicious SSL Cert', desc: 'Blocks sites using SSL certificates tied to threats' },
  { name: 'Malware & Ransomware', desc: 'Blocks malware or ransomware distribution' },
  { name: 'Malware C2', desc: 'Blocks command-and-control servers' },
  { name: 'Phishing', desc: 'Blocks phishing sites' },
  { name: 'Risky DNS Transactions', desc: 'Blocks DNS tunneling and suspicious DNS activity' },
  { name: 'Spam / VoIP fraud / Spyware', desc: 'Blocks spam, VoIP fraud, and spyware' },
  { name: 'Other Known Bad (Community Intelligence)', desc: 'Blocks community-sourced threats' },
  { name: 'New Domains', desc: 'Blocks recently registered domains' },
];
const ZONES = ['Employee', 'Guest', 'IOT', 'Internet'];


export function CreateZonePolicyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [policyName, setPolicyName] = useState('');
  const [description, setDescription] = useState('');
  const [action, setAction] = useState<'Allow' | 'Deny'>('Allow');
  
  // Source fields
  const [sourceZone, setSourceZone] = useState('Any');
  const [sourceIpRange, setSourceIpRange] = useState('');
  const [sourceAnyIp, setSourceAnyIp] = useState(true);

  // Destination fields
  const [destZone, setDestZone] = useState('Any');
  const [destIpRange, setDestIpRange] = useState('');
  const [destAnyIp, setDestAnyIp] = useState(true);
  const [destService, setDestService] = useState('Any');
  const [destPort, setDestPort] = useState('');

  // App blocking detail modal state
  const [detailApp, setDetailApp] = useState<SaasApp | null>(null);

  // Security Controls state
  const [categoryBlockingEnabled, setCategoryBlockingEnabled] = useState(true);
  const [appBlockingEnabled, setAppBlockingEnabled] = useState(true);
  const [appBypassEnabled, setAppBypassEnabled] = useState(false);
  const [domainBlockingEnabled, setDomainBlockingEnabled] = useState(true);
  const [domainBypassEnabled, setDomainBypassEnabled] = useState(false);
  const [geoBlockingEnabled, setGeoBlockingEnabled] = useState(true);
  const [riskBlockingEnabled, setRiskBlockingEnabled] = useState(true);
  const [urlAllowlistEnabled, setUrlAllowlistEnabled] = useState(false);
  const [floodProtectionEnabled, setFloodProtectionEnabled] = useState(false);
  const [ipsEnabled, setIpsEnabled] = useState(false);

  // Security Controls data
  const [blockedCategories, setBlockedCategories] = useState<string[]>([
    'Adult Issues',
    'Gambling',
    'Malicious Sites & Phishing',
  ]);
  const [blockedApps, setBlockedApps] = useState<string[]>([]);
  const [bypassApps, setBypassApps] = useState<string[]>([]);
  const [blockedDomains, setBlockedDomains] = useState<string[]>([]);
  const [bypassDomains, setBypassDomains] = useState<string[]>([]);
  const [blockedRegions, setBlockedRegions] = useState<string[]>([
    'Russia',
    'China',
    'Iran',
    'North Korea',
  ]);
  const [allowlistDomains, setAllowlistDomains] = useState<string[]>([]);

  // Pre-populate for edit mode
  useEffect(() => {
    if (isEdit && id) {
      const existing = MOCK_POLICIES.find((p) => p.id === id && p.type === 'Zone');
      if (existing) {
        setPolicyName(existing.name);
        setDescription(existing.description);
        setAction(existing.action);
      }
    }
  }, [isEdit, id]);

  const isFormValid = policyName.trim();

  const actionColor = action === 'Allow' ? '#16a34a' : '#dc2626';

  const handleSave = () => {
    toast.success(isEdit ? 'Policy updated successfully' : 'Policy created successfully');
    navigate('/access-policies');
  };

  const handleCancel = () => {
    if (isEdit && id) {
      navigate(`/zone-policy/${id}`);
    } else {
      navigate('/access-policies');
    }
  };


  return (
    <>
    {detailApp && <AppDetailModal app={detailApp} onClose={() => setDetailApp(null)} />}
    <div className="flex flex-col gap-[24px] w-full max-w-[900px]">
      <PageHeader
        title={isEdit ? 'Edit Zone Policy' : 'Create Zone Policy'}
        back={{ label: 'Back to Access Policies', onClick: () => navigate('/access-policies') }}
      />

      {/* Policy Name & Description */}
      <div className="bg-white rounded-[12px] border border-[#e5e7eb] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="px-[28px] py-[20px] flex flex-col gap-[16px]">
          <h3 className="font-['Inter',sans-serif] font-bold text-[15px] leading-[20px] text-[#101828]">
            General Information
          </h3>
          <div className="flex flex-col gap-[16px]">
            <div className="flex flex-col gap-[6px]">
              <Label htmlFor="policy-name" className="font-['Inter',sans-serif] font-medium text-[13px] text-[#364153]">
                Policy Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="policy-name"
                placeholder="e.g. Allow Employee Zone to Internet"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                className="bg-white border-[#e5e7eb] rounded-[8px] h-[40px] font-['Inter',sans-serif] text-[14px]"
              />
            </div>
            <div className="flex flex-col gap-[6px]">
              <Label htmlFor="description" className="font-['Inter',sans-serif] font-medium text-[13px] text-[#364153]">
                Description
              </Label>
              <Input
                id="description"
                placeholder="Describe what this policy does..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white border-[#e5e7eb] rounded-[8px] h-[40px] font-['Inter',sans-serif] text-[14px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action - Toggle Buttons */}
      <div className="bg-white rounded-[12px] border border-[#e5e7eb] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="px-[28px] py-[20px] flex flex-col gap-[16px]">
          <h3 className="font-['Inter',sans-serif] font-bold text-[15px] leading-[20px] text-[#101828]">
            Action
          </h3>
          <div className="bg-[#f3f4f6] rounded-[8px] border border-[#d1d5db] p-[5px] flex gap-[4px]">
            <button
              onClick={() => setAction('Allow')}
              className={`flex-1 py-[10px] px-[20px] rounded-[6px] font-['Inter',sans-serif] font-medium text-[14px] transition-all ${
                action === 'Allow'
                  ? 'bg-white text-[#008236] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]'
                  : 'bg-transparent text-[#6a7282]'
              }`}
            >
              ALLOW
            </button>
            <button
              onClick={() => setAction('Deny')}
              className={`flex-1 py-[10px] px-[20px] rounded-[6px] font-['Inter',sans-serif] font-medium text-[14px] transition-all ${
                action === 'Deny'
                  ? 'bg-white text-[#c10007] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]'
                  : 'bg-transparent text-[#6a7282]'
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
          <h3 className="font-['Inter',sans-serif] font-bold text-[16px] leading-[24px] text-[#101828]">
            Source
          </h3>

          {/* Zone row */}
          <div className="flex items-center gap-[16px]">
            <Label className="w-[120px] shrink-0 font-['Inter',sans-serif] font-medium text-[13px] text-[#364153]">Zone</Label>
            <div className="flex-1">
              <Select value={sourceZone} onValueChange={setSourceZone}>
                <SelectTrigger className="bg-white border-[#e5e7eb] rounded-[8px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any">Any</SelectItem>
                  {ZONES.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* IP Range row */}
          <div className="flex items-start gap-[16px]">
            <Label className="w-[120px] shrink-0 font-['Inter',sans-serif] font-medium text-[13px] text-[#364153] pt-[10px]">IP Range</Label>
            <div className="flex flex-col gap-[6px] flex-1">
              <Input
                placeholder="192.168.1.0/24"
                value={sourceIpRange}
                onChange={(e) => setSourceIpRange(e.target.value)}
                disabled={sourceAnyIp}
                className="bg-white border-[#e5e7eb] rounded-[8px] h-[40px] font-['Inter',sans-serif] text-[14px]"
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="source-any-ip"
                  checked={sourceAnyIp}
                  onCheckedChange={(checked) => setSourceAnyIp(checked as boolean)}
                  className="data-[state=checked]:bg-[#0066cc] data-[state=checked]:border-[#0066cc]"
                />
                <Label htmlFor="source-any-ip" className="text-[13px] font-normal text-[#191c25] cursor-pointer">
                  Any
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Destination */}
      <div className="bg-white rounded-[12px] border border-[#e5e7eb] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
        <div className="px-[28px] py-[20px] flex flex-col gap-[16px]">
          <h3 className="font-['Inter',sans-serif] font-bold text-[16px] leading-[24px] text-[#101828]">
            Destination
          </h3>

          {/* Zone row */}
          <div className="flex items-center gap-[16px]">
            <Label className="w-[120px] shrink-0 font-['Inter',sans-serif] font-medium text-[13px] text-[#364153]">Zone</Label>
            <div className="flex-1">
              <Select value={destZone} onValueChange={setDestZone}>
                <SelectTrigger className="bg-white border-[#e5e7eb] rounded-[8px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any">Any</SelectItem>
                  {ZONES.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* IP Range row */}
          <div className="flex items-start gap-[16px]">
            <Label className="w-[120px] shrink-0 font-['Inter',sans-serif] font-medium text-[13px] text-[#364153] pt-[10px]">IP Range</Label>
            <div className="flex flex-col gap-[6px] flex-1">
              <div className="flex gap-[8px]">
                <Input
                  placeholder="192.168.1.0/24"
                  value={destIpRange}
                  onChange={(e) => setDestIpRange(e.target.value)}
                  disabled={destAnyIp}
                  className="bg-white border-[#e5e7eb] rounded-[8px] h-[40px] font-['Inter',sans-serif] text-[14px] flex-1"
                />
                <Select
                  value={destService}
                  onValueChange={(v) => {
                    setDestService(v);
                    if (v !== 'Any') setDestAnyIp(false);
                    else setDestPort('');
                  }}
                >
                  <SelectTrigger className="bg-white border-[#e5e7eb] rounded-[8px] w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any">Any Service</SelectItem>
                    <SelectItem value="UDP">UDP</SelectItem>
                    <SelectItem value="TCP">TCP</SelectItem>
                    <SelectItem value="ICMP">ICMP</SelectItem>
                  </SelectContent>
                </Select>
                {['UDP', 'TCP'].includes(destService) && (
                  <Input
                    placeholder="e.g. 443"
                    value={destPort}
                    onChange={(e) => setDestPort(e.target.value)}
                    className="bg-white border-[#e5e7eb] rounded-[8px] h-[40px] font-['Inter',sans-serif] text-[14px] w-[100px]"
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="dest-any-ip"
                  checked={destAnyIp}
                  onCheckedChange={(checked) => {
                    setDestAnyIp(checked as boolean);
                    if (checked) setDestService('Any');
                  }}
                  className="data-[state=checked]:bg-[#0066cc] data-[state=checked]:border-[#0066cc]"
                />
                <Label htmlFor="dest-any-ip" className="text-[13px] font-normal text-[#191c25] cursor-pointer">
                  Any
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Controls */}
      <div className="bg-white rounded-[12px] border border-[#e5e7eb] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="px-[28px] py-[20px] flex flex-col gap-[20px]">
          <div className="flex items-center gap-[8px]">
            <div className="bg-[#dbeafe] text-white w-[24px] h-[24px] rounded-full flex items-center justify-center font-['Inter',sans-serif] font-bold text-[12px] text-[#1447E6]">
              4
            </div>
            <h3 className="font-['Inter',sans-serif] font-bold text-[15px] leading-[20px] text-[#101828]">
              Security Controls
            </h3>
          </div>

          {/* Category Blocking */}
          <SecurityControlCard
            title="Category Blocking"
            enabled={categoryBlockingEnabled}
            onToggle={setCategoryBlockingEnabled}
            helperText="Select categories for blocking"
            selectConfig={{
              buttonLabel: 'Select categories to Block',
              options: CATEGORY_LIST,
              selected: blockedCategories,
              onSelect: (item) => setBlockedCategories((prev) => [...prev, item]),
              onRemove: (item) => setBlockedCategories((prev) => prev.filter((c) => c !== item)),
            }}
          />

          {/* Application Blocking */}
          <SecurityControlCard
            title="Application Blocking"
            enabled={appBlockingEnabled}
            onToggle={setAppBlockingEnabled}
            helperText="Which applications would you like to block access to?"
          >
            <SaasAppPicker
              selectedItems={blockedApps}
              onToggle={(app) => setBlockedApps((prev) =>
                prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app]
              )}
              onRemove={(app) => setBlockedApps((prev) => prev.filter((a) => a !== app))}
              onViewDetails={(app) => setDetailApp(app)}
            />
          </SecurityControlCard>

          {/* Application Bypass */}
          <SecurityControlCard
            title="Application Bypass"
            enabled={appBypassEnabled}
            onToggle={setAppBypassEnabled}
            helperText="Which applications should bypass this policy?"
          >
            <SaasAppPicker
              selectedItems={bypassApps}
              onToggle={(app) => setBypassApps((prev) =>
                prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app]
              )}
              onRemove={(app) => setBypassApps((prev) => prev.filter((a) => a !== app))}
              onViewDetails={(app) => setDetailApp(app)}
            />
          </SecurityControlCard>

          {/* Domain Blocking */}
          <SecurityControlCard
            title="Domain Blocking"
            enabled={domainBlockingEnabled}
            onToggle={setDomainBlockingEnabled}
            helperText="Which domains would you like to block access to?"
            subText="Includes subdomains (e.g gambling.com would include bets.gambling.com)"
            domainConfig={{
              domains: blockedDomains,
              onAdd: (d) => setBlockedDomains((prev) => [...prev, d]),
              onRemove: (d) => setBlockedDomains((prev) => prev.filter((x) => x !== d)),
            }}
          />

          {/* Domain Bypass */}
          <SecurityControlCard
            title="Domain Bypass"
            enabled={domainBypassEnabled}
            onToggle={setDomainBypassEnabled}
            helperText="Which domains should bypass this policy?"
            subText="Includes subdomains (e.g salesforce.com would include login.salesforce.com)"
            domainConfig={{
              domains: bypassDomains,
              onAdd: (d) => setBypassDomains((prev) => [...prev, d]),
              onRemove: (d) => setBypassDomains((prev) => prev.filter((x) => x !== d)),
            }}
          />

          {/* Geo-Blocking */}
          <SecurityControlCard
            title="Geo-Blocking"
            enabled={geoBlockingEnabled}
            onToggle={setGeoBlockingEnabled}
            helperText="Block traffic to high-risk regions"
            selectConfig={{
              buttonLabel: 'Select Regions',
              options: GEO_LIST,
              selected: blockedRegions,
              onSelect: (item) => setBlockedRegions((prev) => [...prev, item]),
              onRemove: (item) => setBlockedRegions((prev) => prev.filter((r) => r !== item)),
            }}
          />

          {/* URL Blocking */}
          <div className="flex flex-col gap-[8px] pt-[8px]">
            <h4 className="font-['Inter',sans-serif] font-bold text-[14px] leading-[20px] text-[#101828]">
              URL Blocking
            </h4>
            <p className="font-['Inter',sans-serif] font-normal text-[12px] leading-[16px] text-[#9ca3af]">
              Risk Based URL Blocking is not supported on Linux and Chromebooks. Linux based devices and Chromebooks will not be affected if this feature is enabled.
            </p>
          </div>

          {/* Risk-Based URL Blocking */}
          <SecurityControlCard
            title="Risk-Based URL Blocking (AI/NLP)"
            enabled={riskBlockingEnabled}
            onToggle={setRiskBlockingEnabled}
            helperText="AI-based classification to prevent phishing and typo-squatting"
          >
            <div className="flex gap-[10px]">
              <div className="flex items-center gap-[6px] px-[10px] py-[5px] border border-red-200 bg-red-50 rounded-[8px]">
                <X className="w-[14px] h-[14px] text-red-600" />
                <span className="font-['Inter',sans-serif] font-medium text-[13px] text-[#101828]">Block</span>
                <span className="text-[11px] text-[#6a7282] border-l border-[#e5e7eb] pl-[6px] ml-[2px]">High-Risk</span>
              </div>
              <div className="flex items-center gap-[6px] px-[10px] py-[5px] border border-amber-200 bg-amber-50 rounded-[8px]">
                <AlertTriangle className="w-[14px] h-[14px] text-amber-500" />
                <span className="font-['Inter',sans-serif] font-medium text-[13px] text-[#101828]">Warn</span>
                <span className="text-[11px] text-[#6a7282] border-l border-[#e5e7eb] pl-[6px] ml-[2px]">Medium-Risk</span>
              </div>
              <div className="flex items-center gap-[6px] px-[10px] py-[5px] border border-green-200 bg-green-50 rounded-[8px]">
                <CheckCircle2 className="w-[14px] h-[14px] text-green-600" />
                <span className="font-['Inter',sans-serif] font-medium text-[13px] text-[#101828]">Allow</span>
                <span className="text-[11px] text-[#6a7282] border-l border-[#e5e7eb] pl-[6px] ml-[2px]">Low-Risk</span>
              </div>
            </div>
          </SecurityControlCard>

          {/* URL Allowlist */}
          <SecurityControlCard
            title="URL Allowlist"
            enabled={urlAllowlistEnabled}
            onToggle={setUrlAllowlistEnabled}
            helperText="Add only business-critical domains to ensure inspection never interferes with operations"
            domainConfig={{
              domains: allowlistDomains,
              onAdd: (d) => setAllowlistDomains((prev) => [...prev, d]),
              onRemove: (d) => setAllowlistDomains((prev) => prev.filter((x) => x !== d)),
            }}
          />

          {/* Flood Protection */}
          <SecurityControlCard
            title="Flood Protection"
            enabled={floodProtectionEnabled}
            onToggle={setFloodProtectionEnabled}
            helperText=""
          />

          {/* IPS */}
          <SecurityControlCard
            title="IPS"
            enabled={ipsEnabled}
            onToggle={setIpsEnabled}
            helperText=""
          />
        </div>
      </div>

      {/* Preview */}
      {isFormValid && (
        <div className="bg-white rounded-[12px] border border-[#e5e7eb] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] overflow-hidden">
          <div className="px-[28px] py-[20px] flex flex-col gap-[8px]">
            <h3 className="font-['Inter',sans-serif] font-bold text-[15px] leading-[20px] text-[#101828]">
              Policy Summary
            </h3>
            <p className="font-['Inter',sans-serif] font-normal text-[14px] leading-[20px] text-[#364153]">
              This policy will{' '}
              <span className="font-bold" style={{ color: actionColor }}>
                {action.toUpperCase()}
              </span>{' '}
              traffic from{' '}
              <span className="font-semibold text-[#101828]">{sourceZone !== 'Any' ? sourceZone : (sourceAnyIp ? 'Any' : sourceIpRange || 'Any')}</span> to{' '}
              <span className="font-semibold text-[#101828]">{destZone !== 'Any' ? destZone : (destAnyIp ? 'Any' : destIpRange || 'Any')}</span>
              .
            </p>
          </div>
        </div>
      )}

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
            {isEdit ? 'Save Changes' : 'Create Policy'}
          </span>
        </Button>
      </div>
    </div>
    </>
  );
}