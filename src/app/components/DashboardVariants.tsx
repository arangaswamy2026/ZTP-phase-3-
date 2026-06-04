import React, { useState } from 'react';
import { Card } from './ui/card';
import { 
  CheckCircle2, 
  X, 
  Shield, 
  Users, 
  Globe, 
  ArrowRight, 
  Layout, 
  Activity,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ConfigurationExplanation } from './ConfigurationExplanation';
import { DefaultConfigurationModal } from './DefaultConfigurationModal';

interface DashboardVariantsProps {
  variant: 'standard' | 'sidebar';
  onDismissOnboarding?: () => void;
  showOnboarding?: boolean;
  onAdvancedSettings?: () => void;
}

export function DashboardVariants({ variant, onDismissOnboarding, showOnboarding = true, onAdvancedSettings }: DashboardVariantsProps) {
  if (variant === 'sidebar') {
    return <SidebarVariant showOnboarding={showOnboarding} onDismiss={onDismissOnboarding} onAdvancedSettings={onAdvancedSettings} />;
  }
  return <StandardVariant showOnboarding={showOnboarding} onDismiss={onDismissOnboarding} onAdvancedSettings={onAdvancedSettings} />;
}

// ----------------------------------------------------------------------
// Variant 1: Standard Dashboard (Stacked Cards)
// ----------------------------------------------------------------------
function StandardVariant({ showOnboarding, onDismiss, onAdvancedSettings }: { showOnboarding: boolean, onDismiss?: () => void, onAdvancedSettings?: () => void }) {
  return (
    <div className="space-y-6">
      {/* Onboarding Section - Dismissible */}
      {showOnboarding && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col">
            <div className="flex justify-end pb-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onDismiss} 
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-white/50"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </div>
            <ConfigurationExplanation variant="split" onAdvancedSettings={onAdvancedSettings} />
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <SummaryCards />
    </div>
  );
}

// ----------------------------------------------------------------------
// Variant 2: Sidebar Dashboard (Split View)
// ----------------------------------------------------------------------
function SidebarVariant({ showOnboarding, onDismiss, onAdvancedSettings }: { showOnboarding: boolean, onDismiss?: () => void, onAdvancedSettings?: () => void }) {
  const [showConfigModal, setShowConfigModal] = useState(false);

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Main Dashboard Area */}
      <div className="flex-1 space-y-6">
         <SummaryCards />
      </div>

      {/* Right Sidebar - Onboarding Context */}
      {showOnboarding && (
        <div className="xl:w-[400px] shrink-0 animate-in fade-in slide-in-from-right-4 duration-500">
          <Card className="bg-white border-blue-100 overflow-hidden h-full">
            <div className="p-4 border-b border-blue-100 bg-blue-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0066CC]" />
                <h3 className="font-bold text-gray-900">Security Status</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onDismiss} 
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-5 space-y-6">
              {/* Enabled Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Enabled by Default</span>
                  </div>
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-[10px] text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => setShowConfigModal(true)}
                  >
                    View Config
                  </Button>
                </div>
                <div className="space-y-3 pl-1">
                   <div className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Threat Protection</p>
                        <p className="text-xs text-gray-500">IPS & Anti-Virus blocking threats</p>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Secure Internet</p>
                        <p className="text-xs text-gray-500">Safe browsing on X0/X1</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Next Steps Section */}
              <div>
                 <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Required
                  </Badge>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Next Steps</span>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex gap-3 mb-3">
                    <Users className="w-5 h-5 text-[#0066CC]" />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Connect Identity</h4>
                      <p className="text-xs text-gray-600 mt-0.5">Setup SSO for user-based access</p>
                    </div>
                  </div>
                  <Button size="sm" className="w-full bg-[#0066CC] hover:bg-[#0052A3] h-8 text-xs">
                    Configure Identity
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      <DefaultConfigurationModal 
        isOpen={showConfigModal} 
        onClose={() => setShowConfigModal(false)} 
        onAdvancedSettings={onAdvancedSettings}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// Shared Summary Cards (Refactored for "Service Health")
// ----------------------------------------------------------------------
const summaryData = [
  {
    title: 'ZTC Health',
    value: 'Healthy',
    subtitle: 'All systems operational',
    positive: true,
    icon: Activity,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    type: 'health'
  },
  {
    title: 'Web Activity',
    icon: Globe,
    color: 'text-[#0066CC]',
    bgColor: 'bg-blue-50',
    type: 'activity',
    stats: [
      { label: 'Allowed', value: '3,084,358', change: '+32%' },
      { label: 'Non-Compliance Blocks', value: '82,487', change: '+18,690%' }
    ]
  },
  {
    title: 'Policy Coverage',
    value: '3',
    subtitle: 'Policies enforced',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    type: 'stat'
  },
  {
    title: 'User Sessions',
    value: '7',
    subtitle: '5 Active now',
    change: '+5%',
    positive: true,
    icon: Users,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    type: 'stat'
  },
];

function SummaryCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Service Health */}
      <Card className="p-6 rounded-lg shadow-sm border-gray-200 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-green-50">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Service Health</h3>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">ZT Connector</span>
              <span className="text-sm text-green-600 font-medium">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Cloud connectivity</span>
              <span className="text-sm text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Global edge network</span>
              <span className="text-sm text-green-600 font-medium">Online</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Web Traffic */}
      <Card className="p-6 rounded-lg shadow-sm border-gray-200 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-blue-50">
            <Globe className="w-5 h-5 text-[#0066CC]" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            Web traffic <span className="text-gray-400 font-normal text-sm ml-2">Last 30 days</span>
          </h3>
        </div>
        <div className="space-y-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">Allowed</div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900 tracking-tight">3,084,358</span>
              <div className="flex items-center text-xs font-medium bg-gray-50 px-1.5 py-0.5 rounded text-gray-900">
                <TrendingUp className="w-3 h-3 mr-1" />
                +32%
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Non-Compliance Blocks</div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900 tracking-tight">82,487</span>
              <div className="flex items-center text-xs font-medium bg-gray-50 px-1.5 py-0.5 rounded text-gray-900">
                <TrendingUp className="w-3 h-3 mr-1" />
                +18,690%
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Policies */}
      <Card className="p-6 rounded-lg shadow-sm border-gray-200 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-purple-50">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Policies</h3>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">Coverage</div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">3</span>
        </div>
      </Card>

      {/* Clients */}
      <Card className="p-6 rounded-lg shadow-sm border-gray-200 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-orange-50">
            <Users className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Endpoints</h3>
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-1">Online / Total</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900 tracking-tight">7</span>
              <span className="text-lg text-gray-400 font-medium">/ 12</span>
            </div>
          </div>

        </div>
      </Card>
    </div>
  );
}