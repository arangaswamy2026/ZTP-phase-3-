import React from 'react';
import { IDPManagement } from '../components/IDPManagement';
import { PageHeader } from '../components/PageHeader';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../components/ui/dropdown-menu';
import { MoreVertical, Settings, Upload } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function UsersPage() {
  const [isReconfiguring, setIsReconfiguring] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadUserGroups = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast.success(`Uploaded user groups from "${file.name}"`);
    }
    // Reset so selecting the same file again re-triggers onChange.
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="View your configured identity source and user directory"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="User directory actions"
                className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] border border-black/10 bg-transparent text-foreground hover:bg-[var(--color-surface-subtle)] transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setIsReconfiguring(true)} className="gap-2">
                <Settings className="w-4 h-4" />
                Reconfigure IDP
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="w-4 h-4" />
                Upload user groups
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleUploadUserGroups}
      />
      <IDPManagement isReconfiguring={isReconfiguring} onReconfigureClose={() => setIsReconfiguring(false)} />
    </div>
  );
}
