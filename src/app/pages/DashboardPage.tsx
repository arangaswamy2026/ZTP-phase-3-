import { useOutletContext } from 'react-router';
import { useState } from 'react';
import { SummaryCards } from '../components/SummaryCards';
import { SessionChart } from '../components/SessionChart';
import { ActivityTable } from '../components/ActivityTable';
import { DashboardVariants } from '../components/DashboardVariants';
import { Button } from '../components/ui/button';
import { Download } from 'lucide-react';
import type { LifecycleStage } from '../components/TopBar';
import { useTenant } from '../contexts/TenantContext';
import { ActivationFlow } from '../components/activation/ActivationFlow';

interface OutletContext {
  lifecycleStage: LifecycleStage;
  showClientDownloadModal: boolean;
  setShowClientDownloadModal: (show: boolean) => void;
}

export function DashboardPage() {
  const { lifecycleStage, showClientDownloadModal, setShowClientDownloadModal } = useOutletContext<OutletContext>();
  const { currentTenant, getTenantData } = useTenant();
  const [dashboardVariant, setDashboardVariant] = useState<'standard' | 'sidebar'>('standard');
  const [showOnboardingCards, setShowOnboardingCards] = useState(true);

  const tenantData = getTenantData();
  
  // Always show dashboard for all tenants, including Riverside in provisioning state

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-gray-900 text-[24px] font-bold">Zero Trust Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Monitor and manage your zero trust security posture
          </p>
        </div>
      </div>

      <DashboardVariants 
        variant={dashboardVariant} 
        showOnboarding={showOnboardingCards}
        onDismissOnboarding={() => setShowOnboardingCards(false)}
        onAdvancedSettings={() => {}}
      />

      <SessionChart />

      <ActivityTable />

      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Download Unified Client</h4>
            <p className="text-xs text-gray-500 max-w-sm">
              Deploy the unified security agent to all trusted endpoints to ensure full zero-trust compliance.
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full md:w-auto text-xs gap-2" 
          onClick={() => setShowClientDownloadModal(true)}
        >
          View details
        </Button>
      </div>
    </>
  );
}