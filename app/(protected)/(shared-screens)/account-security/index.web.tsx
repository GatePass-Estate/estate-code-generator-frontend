import { useRouter, useFocusEffect } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Image, Platform, useWindowDimensions } from 'react-native';
import icons from '@/src/constants/icons';
import { useUserStore } from '@/src/lib/stores/userStore';
import { updatepassword } from '@/src/lib/api/user';
import { disableTwoFactor, regenerateRecoveryCodes } from '@/src/lib/api/auth';
import { useTwoFactorStatus } from '@/src/hooks/useTwoFactorStatus';
import { setPendingRecoveryCodes } from '@/src/lib/recoveryCodes';
import Modal from '@/src/components/web/Modal';
import { getWidthBreakpoint } from '@/src/lib/helpers';
import UpdatePassword from '@/src/components/web/UpdatePassword';
import Back from '@/src/components/mobile/Back';
import WebSidebar from '@/src/components/web/WebSidebar';
import { menuRoutes } from '../../user/_layout';

export default function AccountSecurityWeb() {
  const router = useRouter();
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const user_id = useUserStore((state) => state.user_id);
  const { width } = useWindowDimensions();

  const {
    enabled: twoFactorEnabled,
    setEnabled: setTwoFactorEnabled,
    refresh: refreshTwoFactor,
  } = useTwoFactorStatus();
  // One code prompt serves both actions that require a current TOTP code.
  const [codePrompt, setCodePrompt] = useState<'disable' | 'regenerate' | null>(null);
  const [promptCode, setPromptCode] = useState('');
  const [promptBusy, setPromptBusy] = useState(false);
  const [promptError, setPromptError] = useState('');

  const isLargeScreen = width > getWidthBreakpoint();

  const setNewPassword = useCallback(async () => {
    setSavingPassword(true);
    setError('');
    setSuccess('');

    const confirmValue = confirmPasswordRef.current?.value || '';

    if (password.newPassword !== confirmValue) {
      setError('The new password and the confirm password do not match');
      setSavingPassword(false);
      return;
    }

    if (password.newPassword.length < 8 || password.currentPassword.length < 8) {
      setError('The password must be at least 8 characters long');
      setSavingPassword(false);
      return;
    }

    if (password.newPassword === password.currentPassword) {
      setError('The new password cannot be the same as the current password');
      setSavingPassword(false);
      return;
    }

    try {
      await updatepassword({
        user_id,
        current_password: password.currentPassword,
        new_password: password.newPassword,
      });
      setSuccess('Password updated successfully');
      setTimeout(() => setShowUpdatePassword(false), 1500);
    } catch (err: any) {
      const message = err?.message || 'Failed to update password.';
      setError(message);
    } finally {
      setSavingPassword(false);
    }
  }, [password, user_id]);

  const openCodePrompt = useCallback((mode: 'disable' | 'regenerate') => {
    setPromptCode('');
    setPromptError('');
    setCodePrompt(mode);
  }, []);

  const handleToggleTwoFactor = useCallback(() => {
    if (!twoFactorEnabled) {
      router.push('/account-security/two-factor');
      return;
    }
    openCodePrompt('disable');
  }, [twoFactorEnabled, router, openCodePrompt]);

  const submitCodePrompt = useCallback(async () => {
    const code = promptCode.trim();
    if (code.length !== 6) {
      setPromptError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setPromptBusy(true);
    setPromptError('');
    try {
      if (codePrompt === 'disable') {
        await disableTwoFactor(code);
        setTwoFactorEnabled(false);
        setCodePrompt(null);
        return;
      }

      const response = await regenerateRecoveryCodes(code);
      // Handed over in memory so the codes never reach the URL or history.
      setPendingRecoveryCodes(response.recovery_codes ?? []);
      setCodePrompt(null);
      router.push('/account-security/recovery-codes');
    } catch (error: any) {
      setPromptError(error?.message || 'That code was not accepted.');
    } finally {
      setPromptBusy(false);
    }
  }, [promptCode, codePrompt, setTwoFactorEnabled, router]);

  // Re-read the status on focus so returning from setup shows the new state.
  useFocusEffect(
    useCallback(() => {
      refreshTwoFactor();
    }, [refreshTwoFactor])
  );

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Account Security - GatePass';
  }, []);

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      {isLargeScreen && (
        <WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route as any)} />
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
                  setError('');
                  setSuccess('');
                  if (isLargeScreen) {
                    setShowUpdatePassword(true);
                    return;
                  }
                  router.push('/profile/edit/password');
                }}
                className="cursor-pointer flex items-center rounded-lg px-5 bg-[#F7F9F9] h-14 w-full justify-between"
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

            <div className="flex items-center rounded-lg px-5 bg-[#F7F9F9] h-14 w-full justify-between">
              <span className="text-[15px] font-ubuntu-regular text-[#0A1F29]">
                Google Authenticator
              </span>
              <button
                role="switch"
                aria-checked={twoFactorEnabled}
                onClick={handleToggleTwoFactor}
                className={`relative h-6 w-[52px] rounded-full transition ${
                  twoFactorEnabled ? 'bg-primary' : 'bg-grey'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    twoFactorEnabled ? 'left-[28px]' : 'left-0.5'
                  }`}
                />
              </button>
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
          heading={
            codePrompt === 'disable'
              ? 'Turn off two-factor authentication'
              : 'Regenerate recovery codes'
          }
          message={
            codePrompt === 'disable'
              ? 'Enter the current code from your authenticator app to confirm.'
              : 'Enter the current code from your authenticator app. Your previous recovery codes will stop working.'
          }
          cancelText="Cancel"
          actionText={codePrompt === 'disable' ? 'Turn off' : 'Regenerate'}
          runningText="Working…"
          actionRunnig={promptBusy}
          btnDisabled={promptBusy}
          actionBtnClassName="bg-primary hover:bg-[#0d3145]"
          closeModal={() => {
            if (!promptBusy) setCodePrompt(null);
          }}
          action={submitCodePrompt}
        >
          <input
            value={promptCode}
            onChange={(event) =>
              setPromptCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))
            }
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

      {showUpdatePassword && (
        <UpdatePassword
          setShowUpdatePassword={setShowUpdatePassword}
          error={error}
          success={success}
          savingPassword={savingPassword}
          setPassword={setPassword}
          password={password}
          showCurrent={showCurrent}
          showNew={showNew}
          showConfirm={showConfirm}
          confirmPasswordRef={confirmPasswordRef}
          setError={setError}
          setShowCurrent={setShowCurrent}
          setShowNew={setShowNew}
          setShowConfirm={setShowConfirm}
          setNewPassword={setNewPassword}
        />
      )}
    </div>
  );
}
