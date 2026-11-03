import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { useVerifyEmailActivationToken } from '@/src/lib/api/auth';
import LoadingTransition from '@/src/components/common/LoadingTransition';
import { grantActivationStatusAccess } from '@/src/lib/helpers';

function firstParam(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function tokenFromUrl(): string {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('token') ?? '';
}

export default function ActivateScreen() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = firstParam(params.token) || tokenFromUrl();
  const router = useRouter();
  const hasRedirected = useRef(false);

  const {
    data: verifyData,
    isLoading: isVerifying,
    isError: isVerifyError,
    error: verifyError,
  } = useVerifyEmailActivationToken(token);

  useEffect(() => {
    if (hasRedirected.current) return;

    if (isVerifyError) {
      hasRedirected.current = true;
      grantActivationStatusAccess();
      router.replace('/auth/email-activation-status?status=error');
      return;
    }

    if (verifyData?.user_id && token) {
      hasRedirected.current = true;
      router.replace({
        pathname: '/auth/set-password',
        params: {
          token,
          email: verifyData.email,
        },
      });
    }
  }, [verifyData, isVerifyError, router, token]);

  if (!token) {
    grantActivationStatusAccess();
    return <Redirect href="/auth/email-activation-status?status=error" />;
  }

  return <LoadingTransition />;
}
