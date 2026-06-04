import { useNavigate } from 'react-router';
import { DeviceTrustProfile } from '../components/DeviceTrustProfile';

export function DefaultTrustProfilePage() {
  const navigate = useNavigate();

  return (
    <DeviceTrustProfile
      onBack={() => navigate('/profiles')}
      onSave={() => navigate('/profiles')}
      onCancel={() => navigate('/profiles')}
    />
  );
}