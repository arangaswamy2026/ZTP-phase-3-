import { ActivityTable } from '../components/ActivityTable';
import { PageHeader } from '../components/PageHeader';

export function ActivityPage() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader title="Activity" />
      <ActivityTable />
    </div>
  );
}
