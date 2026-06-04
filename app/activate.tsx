import { useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter, Redirect } from "expo-router";
import { useVerifyEmailActivationToken } from "@/src/lib/api/auth";
import LoadingTransition from "@/src/components/common/LoadingTransition";
import { grantActivationStatusAccess } from "@/src/lib/helpers";

export default function ActivateScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const hasRedirected = useRef(false);

  const {
    data: verifyData,
    isLoading: isVerifying,
    isError: isVerifyError,
    error: verifyError,
  } = useVerifyEmailActivationToken(token || "");

  useEffect(() => {
    if (hasRedirected.current) return;

    if (isVerifyError) {
      hasRedirected.current = true;
      grantActivationStatusAccess();
      router.replace("/auth/email-activation-status?status=error");
      return;
    }

    if (verifyData?.user_id) {
      hasRedirected.current = true;
      router.replace({
        pathname: "/auth/set-password",
        params: {
          user_id: verifyData.user_id,
          email: verifyData.email,
        },
      });
    }
  }, [verifyData, isVerifyError, router]);

  if (!token) {
    grantActivationStatusAccess();
    return <Redirect href="/auth/email-activation-status?status=error" />;
  }

  return <LoadingTransition />;
}
