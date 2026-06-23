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
import { PageHeader } from '../components/PageHeader';

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
      <PageHeader
        title="Zero Trust Dashboard"
        subtitle="Monitor and manage your zero trust security posture"
      />

      <DashboardVariants 
        variant={dashboardVariant} 
        showOnboarding={showOnboardingCards}
        onDismissOnboarding={() => setShowOnboardingCards(false)}
        onAdvancedSettings={() => {}}
      />

      <SessionChart />

      <ActivityTable />

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 m-0 mb-0.5">Download Unified Client</h3>
            <p className="text-xs text-gray-500 m-0">
              Deploy the unified security agent to all enabled tenants to ensure full zero trust compliance.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 text-xs"
          onClick={() => setShowClientDownloadModal(true)}
        >
          View Details
        </Button>
      </div>
    </>
  );
}