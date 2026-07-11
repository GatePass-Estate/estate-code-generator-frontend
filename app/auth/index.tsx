import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { getPostAuthRedirectRoute, getSelectedInstitution } from '@/src/lib/helpers';

export default function AuthIndex() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const redirect = async () => {
      const institution = await getSelectedInstitution();
      router.replace(getPostAuthRedirectRoute(institution));
      setIsReady(true);
    };

    redirect();
  }, [router]);

  if (!isReady) {
    return null;
  }

  return null;
}
