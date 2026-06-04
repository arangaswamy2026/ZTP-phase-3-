import { useState } from 'react';

const TABS = ['Device', 'Zones/Interfaces', 'Routes', 'NAT', 'WLB'] as const;
type Tab = typeof TABS[number];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors ${
        checked ? 'bg-[#030213]' : 'bg-[#cbced4]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function NetworkPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Device');
  const [ntpEnabled, setNtpEnabled] = useState(false);
  const [dstEnabled, setDstEnabled] = useState(false);
  const [deviceName, setDeviceName] = useState('ZTC');
  const [adminLogin, setAdminLogin] = useState('admin');
  const [timezone, setTimezone] = useState('Pacific Time (US & Canada)');

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#101828] tracking-[0.07px]">Advanced Settings</h1>
        <button className="px-4 py-2 h-9 text-sm font-medium text-[#0a0a0a] bg-white border border-black/10 rounded-lg hover:bg-gray-50 transition-colors">
          Back to Dashboard
        </button>
      </div>

      {/* Main card */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex items-end border-b-2 border-[#e5e7eb] px-4 pt-2.5">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center justify-center h-9 px-2.5 text-sm font-medium shrink-0 transition-colors ${
                activeTab === tab
                  ? 'text-[#ff5d00] border-b-2 border-[#ff5d00] -mb-[2px]'
                  : 'text-[#6a7282] hover:text-[#364153]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6 space-y-0">
          {activeTab === 'Device' && (
            <>
              {/* General */}
              <section className="pb-6">
                <h3 className="text-base font-semibold text-[#101828] mb-4">General</h3>
                <div className="flex items-center gap-4">
                  <label className="w-64 text-right text-sm font-medium text-[#4a5565] shrink-0">
                    Name
                  </label>
                  <input
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="h-9 w-40 px-3 text-sm text-[#0a0a0a] bg-white border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </section>

              <div className="border-t border-[#f3f4f6]" />

              {/* Administrator Name */}
              <section className="py-6">
                <h3 className="text-base font-semibold text-[#101828] mb-4">Administrator Name</h3>
                <div className="flex items-center gap-4">
                  <label className="w-64 text-right text-sm font-medium text-[#4a5565] shrink-0">
                    Administrator Login Name
                  </label>
                  <div className="flex gap-3">
                    <input
                      value={adminLogin}
                      onChange={(e) => setAdminLogin(e.target.value)}
                      className="h-9 w-48 px-3 text-sm text-[#0a0a0a] bg-white border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="h-9 px-3 text-sm font-medium text-[#364153] bg-white border border-[#e5e7eb] rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                      Change Password
                    </button>
                  </div>
                </div>
              </section>

              <div className="border-t border-[#f3f4f6]" />

              {/* Time Settings */}
              <section className="py-6">
                <h3 className="text-base font-semibold text-[#101828] mb-4">Time Settings</h3>
                <div className="space-y-5">
                  {/* NTP toggle */}
                  <div className="flex items-center gap-4">
                    <span className="w-64 text-right text-sm font-medium text-[#4a5565]">
                      Set time automatically using NTP
                    </span>
                    <Toggle checked={ntpEnabled} onChange={setNtpEnabled} />
                  </div>

                  {/* Date / Time */}
                  <div className="flex items-center gap-4">
                    <label className="w-64 text-right text-sm font-medium text-[#4a5565]">
                      Date / Time
                    </label>
                    <div className="relative">
                      <input
                        defaultValue="22/05/2018 12:30:00"
                        className="h-9 w-48 px-3 pr-9 text-sm text-[#0a0a0a] border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <svg className="absolute right-2.5 top-2.5 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                  </div>

                  {/* Time Zone */}
                  <div className="flex items-center gap-4">
                    <label className="w-64 text-right text-sm font-medium text-[#4a5565]">
                      Time Zone
                    </label>
                    <div className="relative">
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="h-9 w-64 pl-3 pr-8 text-sm text-[#0a0a0a] bg-white border border-[#e5e7eb] rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option>Pacific Time (US &amp; Canada)</option>
                        <option>Mountain Time (US &amp; Canada)</option>
                        <option>Central Time (US &amp; Canada)</option>
                        <option>Eastern Time (US &amp; Canada)</option>
                        <option>UTC</option>
                        <option>London (GMT)</option>
                      </select>
                      <svg className="pointer-events-none absolute right-2.5 top-2.5 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  {/* DST toggle */}
                  <div className="flex items-center gap-4">
                    <span className="w-64 text-right text-sm font-medium text-[#4a5565]">
                      Automatically adjust clock for daylight saving time
                    </span>
                    <Toggle checked={dstEnabled} onChange={setDstEnabled} />
                  </div>
                </div>
              </section>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#f3f4f6]">
                <button className="h-9 px-5 text-sm font-medium text-[#0a0a0a] bg-white border border-black/10 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button className="h-9 px-5 text-sm font-medium text-white bg-[#006cc0] rounded-lg hover:bg-[#0058a3] transition-colors">
                  Accept
                </button>
              </div>
            </>
          )}

          {activeTab === 'Zones/Interfaces' && (
            <div className="py-16 text-center text-sm text-[#6a7282]">
              Zones / Interfaces configuration
            </div>
          )}

          {activeTab === 'Routes' && (
            <div className="py-16 text-center text-sm text-[#6a7282]">
              Routes configuration
            </div>
          )}

          {activeTab === 'NAT' && (
            <div className="py-16 text-center text-sm text-[#6a7282]">
              NAT configuration
            </div>
          )}

          {activeTab === 'WLB' && (
            <div className="py-16 text-center text-sm text-[#6a7282]">
              WLB configuration
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
