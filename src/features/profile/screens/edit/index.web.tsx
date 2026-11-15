import { menuRoutes } from '@/src/features/dashboard/components/menuRoutes';
import WebSidebar from '@/src/features/dashboard/components/WebSidebar';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import EditProfileForm from '@/src/features/profile/components/EditProfileForm.web';

export default function EditProfile() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Edit Profile - GatePass';
  }, []);

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      <WebSidebar
        routes={menuRoutes
          .filter((el) => el.for === 'web' || el.for === 'both')
          .map((data) => data)}
        onNavigate={(route) => router.push(route)}
      />

      <div className="web-body">
        <EditProfileForm />
      </div>
    </div>
  );
}
