import { useCallback, useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Back from '@/src/components/mobile/Back';
import WebSidebar from '@/src/components/web/WebSidebar';
import { getWidthBreakpoint } from '@/src/lib/helpers';
import { consumePendingRecoveryCodes } from '@/src/lib/recoveryCodes';
import { menuRoutes } from '../../../user/_layout';

export default function RecoveryCodesWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > getWidthBreakpoint();

  const [codes, setCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  // Consuming on mount clears the codes, so a refresh or back-navigation
  // cannot show them a second time.
  useEffect(() => {
    setCodes(consumePendingRecoveryCodes() ?? []);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Recovery Codes - GatePass';
  }, []);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(codes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [codes]);

  const handleDone = useCallback(() => {
    router.replace('/account-security');
  }, [router]);

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      {isLargeScreen && (
        <WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route as any)} />
      )}
      <div className="web-body">
        <div className={`flex flex-col ${isLargeScreen ? 'mt-20 px-4 w-full' : 'mt-5 md:px-5'}`}>
          <Back type="short-arrow" onPress={handleDone} />

          <div className="mt-10 max-w-xl">
            <h1 className={`${isLargeScreen ? 'text-4xl' : 'text-2xl font-ubuntu-medium'}`}>
              Save Your Recovery Codes
            </h1>
            <p className="text-sm font-inter-light text-[#0A1F29] mt-4 leading-5">
              Each code can be used once to sign in if you lose your authenticator app. Store them
              somewhere safe — this is the only time they are shown.
            </p>

            {codes.length === 0 ? (
              <p className="text-sm font-inter-regular text-[#878686] mt-10">
                These codes have already been shown. You can generate a new set from Account
                Security.
              </p>
            ) : (
              <>
                <div className="bg-light-teal rounded-lg px-5 py-4 mt-6">
                  {codes.map((code) => (
                    <p
                      key={code}
                      className="text-primary font-roboto-regular text-base tracking-[2px] py-1.5"
                    >
                      {code}
                    </p>
                  ))}
                </div>

                <button
                  onClick={handleCopy}
                  className="mt-5 px-5 h-11 border border-accent rounded-lg text-primary font-ubuntu-regular text-xs hover:bg-[#EFF1F1] transition"
                >
                  {copied ? 'Copied' : 'Copy all codes'}
                </button>

                <label className="flex items-center gap-3 mt-8 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(event) => setAcknowledged(event.target.checked)}
                    className="w-4 h-4 accent-[#113E55]"
                  />
                  <span className="text-sm font-inter-light text-[#3E424E]">
                    I have saved these codes
                  </span>
                </label>

                <button
                  onClick={handleDone}
                  disabled={!acknowledged}
                  className="w-full bg-primary rounded-[24px] h-11 mt-8 mb-10 text-[#F6F7F7] font-ubuntu-semibold text-sm disabled:opacity-50"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
