import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import IncidentReportCategoryScreen from '@/src/components/incident/IncidentReportCategoryScreen';
import { useUserStore } from '@/src/lib/stores/userStore';

export default function IncidentReportCategoryRoute() {
  const router = useRouter();
  const role = useUserStore((state) => state.role);

  useEffect(() => {
    if (role !== 'admin' && role !== 'primary_admin') router.replace('/user/report');
  }, [role, router]);

  return role === 'admin' || role === 'primary_admin' ? <IncidentReportCategoryScreen /> : null;
}
