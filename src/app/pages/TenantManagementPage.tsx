import { useState } from 'react';
import { Search, Info, ChevronDown, Settings, ArrowUp } from 'lucide-react';
import { Button } from '../components/ui/button';

interface Tenant {
  id: string;
  name: string;
  status: 'Active' | 'Pending Setup';
  licenses: number;
  policies: number | null;
  users: number | null;
  activationDate: string;
  lastActivity: string | null;
}

const MOCK_TENANTS: Tenant[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    status: 'Active',
    licenses: 20,
    policies: 8,
    users: 6,
    activationDate: '14 Oct 2026',
    lastActivity: '2 hrs ago',
  },
  {
    id: '2',
    name: 'Enterprise Solutions',
    status: 'Active',
    licenses: 20,
    policies: 10,
    users: 9,
    activationDate: '19 Sep 2026',
    lastActivity: '5 mins ago',
  },
  {
    id: '3',
    name: 'Cloud Innovations',
    status: 'Pending Setup',
    licenses: 20,
    policies: null,
    users: null,
    activationDate: '27 Oct 2026',
    lastActivity: null,
  },
  {
    id: '4',
    name: 'Global Services LLC',
    status: 'Active',
    licenses: 20,
    policies: null,
    users: null,
    activationDate: '2 Nov 2026',
    lastActivity: null,
  },
];

function StatusBadge({ status }: { status: 'Active' | 'Pending Setup' }) {
  if (status === 'Active') {
    return (
      <div className="inline-flex items-center gap-[4px] bg-[#d1fae5] border border-transparent rounded-[8px] px-[9px] py-[1px] h-[22px]">
        <svg className="w-[12px] h-[12px]" fill="none" viewBox="0 0 12 12">
          <circle cx="6" cy="6" r="5.5" stroke="#10B981" />
          <path d="M4.5 6L5.5 7L7.5 5" stroke="#10B981" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-['Inter',sans-serif] font-medium text-[12px] leading-[16px] text-[#065f46]">
          Active
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-[4px] bg-[#dbeafe] border border-[rgba(0,0,0,0.1)] rounded-[8px] px-[9px] py-[1px] h-[22px]">
      <svg className="w-[12px] h-[12px]" fill="none" viewBox="0 0 12 12">
        <circle cx="6" cy="6" r="5.5" stroke="#1447E6" />
        <path d="M6 3V6L8 7" stroke="#1447E6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-['Inter',sans-serif] font-medium text-[12px] leading-[16px] text-[#1447e6]">
        Pending Setup
      </span>
    </div>
  );
}

export function TenantManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Pending Setup'>('all');

  const filteredTenants = MOCK_TENANTS.filter((tenant) => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-[32px] w-full max-w-[1438px] pb-[40px]">
      {/* Header */}
      <div className="flex flex-col gap-[8px]">
        <h1 className="font-['Inter',sans-serif] font-medium text-[30px] leading-[45px] text-[#101828]">
          Tenant Management
        </h1>
        <p className="font-['Inter',sans-serif] font-normal text-[16px] leading-[24px] tracking-[-0.3125px] text-[#4a5565]">
          Monitor activation status across all your managed tenants
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-[16px]">
        <div className="relative w-[302px]">
          <Search className="absolute left-[12px] top-[10px] w-[16px] h-[16px] text-[#99A1AF]" />
          <input
            type="text"
            placeholder="Search tenants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[36px] bg-[#f3f3f5] border border-[#e5e7eb] rounded-[10px] pl-[36px] pr-[12px] py-[4px] font-['Inter',sans-serif] font-normal text-[14px] tracking-[-0.1504px] text-[#0a0a0a] placeholder:text-[#717182] focus:outline-none focus:border-[#1447E6]"
          />
        </div>

        <div className="relative">
          <button className="flex items-center justify-between gap-[8px] w-[224px] h-[36px] bg-[#f3f3f5] border border-[#e5e7eb] rounded-[10px] px-[13px] py-[1px]">
            <span className="font-['Inter',sans-serif] font-normal text-[14px] leading-[20px] tracking-[-0.1504px] text-[#0a0a0a]">
              All Activation Status
            </span>
            <ChevronDown className="w-[16px] h-[16px] text-[#717182] opacity-50" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
            <tr className="h-[40px]">
              <th className="text-left px-[18px] font-['Inter',sans-serif] font-medium text-[11px] leading-[16px] tracking-[0.5px] uppercase text-[#6a7282]">
                Tenant Name
              </th>
              <th className="text-left px-[8px] font-['Inter',sans-serif] font-medium text-[11px] leading-[16px] tracking-[0.5px] uppercase text-[#6a7282]">
                Activation Status
              </th>
              <th className="text-center px-[8px] font-['Inter',sans-serif] font-medium text-[11px] leading-[16px] tracking-[0.5px] uppercase text-[#6a7282]">
                Licenses
              </th>
              <th className="text-center px-[8px] font-['Inter',sans-serif] font-medium text-[11px] leading-[16px] tracking-[0.5px] uppercase text-[#6a7282]">
                Policies
              </th>
              <th className="text-center px-[8px] font-['Inter',sans-serif] font-medium text-[11px] leading-[16px] tracking-[0.5px] uppercase text-[#6a7282]">
                <div className="flex items-center justify-center gap-[4px]">
                  Users
                  <Info className="w-[14px] h-[14px] text-[#9CA3AF]" />
                </div>
              </th>
              <th className="text-left px-[8px] font-['Inter',sans-serif] font-medium text-[11px] leading-[16px] tracking-[0.5px] uppercase text-[#6a7282]">
                <div className="flex items-center gap-[4px]">
                  Activation Date
                  <ArrowUp className="w-[16px] h-[16px] text-[#68696B]" />
                </div>
              </th>
              <th className="text-left px-[8px] font-['Inter',sans-serif] font-medium text-[11px] leading-[16px] tracking-[0.5px] uppercase text-[#6a7282]">
                Last Activity
              </th>
              <th className="text-right px-[18px] font-['Inter',sans-serif] font-medium text-[11px] leading-[16px] tracking-[0.5px] uppercase text-[#6a7282]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.map((tenant, index) => (
              <tr
                key={tenant.id}
                className={`h-[49px] border-b border-[rgba(0,0,0,0.1)] ${
                  index === filteredTenants.length - 1 ? 'border-b-0' : ''
                }`}
              >
                <td className="px-[18px]">
                  <span className="font-['Inter',sans-serif] font-normal text-[14px] leading-[20px] tracking-[-0.1504px] text-[#0a0a0a]">
                    {tenant.name}
                  </span>
                </td>
                <td className="px-[8px]">
                  <StatusBadge status={tenant.status} />
                </td>
                <td className="px-[8px] text-center">
                  <span className="font-['Inter',sans-serif] font-normal text-[14px] leading-[20px] tracking-[-0.1504px] text-[#0a0a0a]">
                    {tenant.licenses}
                  </span>
                </td>
                <td className="px-[8px] text-center">
                  <span className="font-['Inter',sans-serif] font-normal text-[14px] leading-[20px] tracking-[-0.1504px] text-[#0a0a0a]">
                    {tenant.policies ?? '—'}
                  </span>
                </td>
                <td className="px-[8px] text-center">
                  <span className="font-['Inter',sans-serif] font-normal text-[14px] leading-[20px] tracking-[-0.1504px] text-[#0a0a0a]">
                    {tenant.users ?? '—'}
                  </span>
                </td>
                <td className="px-[8px]">
                  <span className="font-['Inter',sans-serif] font-normal text-[14px] leading-[20px] tracking-[-0.1504px] text-[#4a5565]">
                    {tenant.activationDate}
                  </span>
                </td>
                <td className="px-[8px]">
                  <span className="font-['Inter',sans-serif] font-normal text-[14px] leading-[20px] tracking-[-0.1504px] text-[#4a5565]">
                    {tenant.lastActivity ?? '—'}
                  </span>
                </td>
                <td className="px-[18px]">
                  <div className="flex justify-end">
                    {tenant.status === 'Active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-[32px] rounded-[8px] border-[#e5e7eb] px-[16px]"
                      >
                        <span className="font-['Inter',sans-serif] font-medium text-[14px] leading-[20px] tracking-[-0.1504px] text-[#0a0a0a]">
                          View Details
                        </span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-[32px] rounded-[8px] border-[#e5e7eb] px-[12px] gap-[6px]"
                      >
                        <Settings className="w-[16px] h-[16px]" />
                        <span className="font-['Inter',sans-serif] font-medium text-[14px] leading-[20px] tracking-[-0.1504px] text-[#0a0a0a]">
                          Continue Setup
                        </span>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[8px]">
          <p className="font-['Inter',sans-serif] font-normal text-[13px] leading-[18px] text-[#6a7282]">
            Showing 1-5 of 10 records |
          </p>
          <button className="flex items-center gap-[6px] group">
            <span className="font-['Inter',sans-serif] font-normal text-[13px] leading-[18px] text-[#6a7282] group-hover:text-[#1447E6]">
              10 per page
            </span>
            <ChevronDown className="w-[14px] h-[14px] text-[#6a7282] group-hover:text-[#1447E6]" />
          </button>
        </div>
      </div>
    </div>
  );
}