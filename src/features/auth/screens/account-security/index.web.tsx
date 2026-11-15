import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, Platform, useWindowDimensions } from 'react-native';
import icons from '@/src/shared/constants/icons';
import { useAccountSecurity } from '@/src/features/auth/hooks/useAccountSecurity';
import { useWebPasswordChange } from '@/src/features/auth/hooks/useWebPasswordChange';
import Modal from '@/src/shared/components/feedback/Modal';
import { getWidthBreakpoint } from '@/src/shared/utils/helpers';
import UpdatePassword from '@/src/features/auth/components/UpdatePassword';
import ToggleSwitch from '@/src/features/access-codes/components/ToggleSwitch';
import Back from '@/src/shared/components/navigation/Back';
import WebSidebar from '@/src/features/dashboard/components/WebSidebar';
import { menuRoutes } from '@/src/features/dashboard/components/menuRoutes';

export default function AccountSecurityWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > getWidthBreakpoint();

  const {
    twoFactorEnabled,
    handleToggleTwoFactor,
    codePrompt,
    codePromptCopy,
    openCodePrompt,
    closeCodePrompt,
    promptCode,
    setPromptCode,
    promptBusy,
    promptError,
    submitCodePrompt,
  } = useAccountSecurity();
  const { showUpdatePassword, setShowUpdatePassword, resetMessages, modalProps } =
    useWebPasswordChange();

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Account Security - GatePass';
  }, []);

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      {isLargeScreen && (
        <WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route)} />
      )}
      <div className="web-body">
        <div className={`flex flex-col ${isLargeScreen ? 'mt-20 px-4 w-full' : 'mt-5 md:px-5'}`}>
          <Back type="short-arrow" />

          <div className="mt-10">
            <div className="flex justify-between">
              <h1 className={`${isLargeScreen ? 'text-4xl' : 'text-2xl font-ubuntu-medium'}`}>
                Account Security
              </h1>
            </div>
            <p className="text-xs font-inter-medium text-[#172024] mt-4 leading-[14px]">
              Manage your security settings and update your password for quick secure access.
            </p>
          </div>

          <div className="py-7 w-full mt-5">
            <div className="flex flex-col gap-4 mb-1">
              <div
                onClick={() => {
                  resetMessages();
                  if (isLargeScreen) {
                    setShowUpdatePassword(true);
                    return;
                  }
                  router.push('/profile/edit/password');
                }}
                className="cursor-pointer flex items-center rounded-lg px-5 bg-light-grey h-14 w-full justify-between"
              >
                <span className="text-[15px] font-inter-medium text-[#172024]">
                  Change Password
                </span>
                <div className="">
                  <Image
                    source={icons.rightIcon}
                    style={{ width: 14, height: 14 }}
                    resizeMode="contain"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] font-inter-regular text-[#3E424E] mt-8 mb-3">
              Require an extra security when logging in.
            </p>

            <div className="flex items-center rounded-lg px-5 bg-light-grey h-14 w-full justify-between">
              <span className="text-[15px] font-ubuntu-regular text-[#0A1F29]">
                Google Authenticator
              </span>
              <ToggleSwitch
                value={twoFactorEnabled}
                onValueChange={() => handleToggleTwoFactor(!twoFactorEnabled)}
              />
            </div>

            {twoFactorEnabled && (
              <button
                onClick={() => openCodePrompt('regenerate')}
                className="mt-4 self-start text-xs font-ubuntu-regular text-primary underline"
              >
                Regenerate recovery codes
              </button>
            )}
          </div>
        </div>
      </div>

      {codePrompt && (
        <Modal
          heading={codePromptCopy.title}
          message={codePromptCopy.message}
          cancelText="Cancel"
          actionText={codePromptCopy.confirmLabel}
          runningText="Working…"
          actionRunnig={promptBusy}
          btnDisabled={promptBusy}
          actionBtnClassName="bg-primary hover:bg-[#0d3145]"
          closeModal={closeCodePrompt}
          action={submitCodePrompt}
        >
          <input
            value={promptCode}
            onChange={(event) => setPromptCode(event.target.value)}
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            className="w-full bg-[#EFF1F1] rounded-2xl h-12 px-5 text-sm font-inter-light text-[#0A1F29] outline-none"
          />
          {!!promptError && (
            <p className="text-danger font-inter-regular text-xs mt-3">{promptError}</p>
          )}
        </Modal>
      )}

      {showUpdatePassword && <UpdatePassword {...modalProps} />}
    </div>
  );
}
