import { useNavigate } from 'react-router';
import { AdvancedSettings } from '../components/AdvancedSettings';

export function AdvancedSettingsPage() {
  const navigate = useNavigate();

  return (
    <AdvancedSettings 
      onBackToDashboard={() => navigate('/dashboard')} 
    />
  );
}
