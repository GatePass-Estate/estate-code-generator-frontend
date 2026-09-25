import { useCallback, useEffect } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import Back from '@/src/components/mobile/Back';
import WebSidebar from '@/src/components/web/WebSidebar';
import { getWidthBreakpoint } from '@/src/lib/helpers';
import { useTwoFactorSetup } from '@/src/hooks/useTwoFactorSetup';
import { setPendingRecoveryCodes } from '@/src/lib/recoveryCodes';
import { menuRoutes } from '../../../user/_layout';

export default function TwoFactorSetupWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > getWidthBreakpoint();

  const {
    provisioningUri,
    secret,
    code,
    setCode,
    loading,
    activating,
    errorMessage,
    activate,
    retry,
  } = useTwoFactorSetup();

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Two-Factor Authentication - GatePass';
  }, []);

  const handleActivate = useCallback(async () => {
    const recoveryCodes = await activate();
    if (!recoveryCodes) return;

    // Handed over in memory so the codes never reach the URL or history.
    setPendingRecoveryCodes(recoveryCodes);
    router.replace('/account-security/recovery-codes');
  }, [activate, router]);

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      {isLargeScreen && (
        <WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route as any)} />
      )}
      <div className="web-body">
        <div className={`flex flex-col ${isLargeScreen ? 'mt-20 px-4 w-full' : 'mt-5 md:px-5'}`}>
          <Back type="short-arrow" />

          <div className="mt-10 max-w-xl">
            <h1 className={`${isLargeScreen ? 'text-4xl' : 'text-2xl font-ubuntu-medium'}`}>
              Set Up Two Factor Authentication
            </h1>
            <p className="text-xs font-ubuntu-regular text-[#0A1F29] mt-4 leading-[18px]">
              Download Google Authenticator app on your google playstore or IOS Apps store. Scan or
              input the code below to activate.
            </p>

            {loading ? (
              <p className="text-sm font-inter-regular text-[#878686] mt-10">
                Preparing your setup code…
              </p>
            ) : !provisioningUri ? (
              <div className="flex flex-col items-start gap-3 mt-10">
                <p className="text-sm font-inter-regular text-danger">
                  {errorMessage || 'Could not start two-factor setup.'}
                </p>
                <button
                  onClick={retry}
                  className="px-5 py-2 rounded-lg bg-primary text-white font-ubuntu-semibold text-sm"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center mt-10">
                  <div className="bg-white p-3 rounded-lg">
                    <QRCode
                      value={provisioningUri}
                      size={155}
                      backgroundColor="white"
                      color="#113E55"
                    />
                  </div>

                  <button
                    onClick={() => Clipboard.setStringAsync(secret)}
                    className="flex items-center gap-2 mt-5 hover:opacity-70 transition"
                  >
                    <span className="text-sm font-roboto-regular text-[#3E424E] tracking-[1px]">
                      {secret}
                    </span>
                    <span className="text-[#323232] text-xs">Copy</span>
                  </button>
                </div>

                <input
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleActivate();
                  }}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter Code in your Authenticator App"
                  className="w-full bg-[#EFF1F1] rounded-2xl h-12 px-5 mt-8 text-sm font-inter-light text-[#0A1F29] outline-none"
                />

                {!!errorMessage && (
                  <p className="text-danger font-inter-regular text-xs mt-3">{errorMessage}</p>
                )}

                <button
                  onClick={handleActivate}
                  disabled={activating}
                  className="w-full bg-primary rounded-[24px] h-11 mt-10 mb-10 text-[#F6F7F7] font-ubuntu-semibold text-sm disabled:opacity-70"
                >
                  {activating ? 'Activating…' : 'Activate'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
