import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import { useCallback, useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Back from '@/src/shared/components/navigation/Back';
import WebSidebar from '@/src/features/dashboard/components/WebSidebar';
import Modal from '@/src/shared/components/feedback/Modal';
import { getWidthBreakpoint } from '@/src/shared/utils/helpers';
import { useLinkedDevices } from '@/src/features/auth/hooks/useLinkedDevices';
import { formatLastActive, friendlyDeviceName } from '@/src/shared/services/storage/deviceName';
import type { SessionResponse } from '@/src/features/auth/types/auth';
import { menuRoutes } from '@/src/features/dashboard/components/menuRoutes';

export default function LinkedDevicesWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > getWidthBreakpoint();

  const {
    sessions,
    loading,
    loadError,
    retry,
    isCurrent: isCurrentDevice,
    revokeDevice,
    revoking,
  } = useLinkedDevices();
  const [pending, setPending] = useState<SessionResponse | null>(null);
  // A failed log-out replaces the list with the error and "Try again", as a failed load does.
  const [revokeError, setRevokeError] = useState('');
  const errorMessage = loadError || revokeError;

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Linked Devices - GatePass';
  }, []);

  const confirmRevoke = useCallback(async () => {
    if (!pending) return;
    try {
      // Logging out this device also signs out locally (see useLinkedDevices).
      const signedOut = await revokeDevice(pending);
      if (!signedOut) setPending(null);
    } catch (error: unknown) {
      setRevokeError(thrownMessage(error) || 'Could not log that device out.');
      setPending(null);
    }
  }, [pending, revokeDevice]);

  const pendingIsCurrent = !!pending && isCurrentDevice(pending);

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      {isLargeScreen && (
        <WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route)} />
      )}
      <div className="web-body">
        <div className={`flex flex-col ${isLargeScreen ? 'mt-20 px-4 w-full' : 'mt-5 md:px-5'}`}>
          <Back type="short-arrow" />

          <div className="mt-10">
            <h1 className={`${isLargeScreen ? 'text-4xl' : 'text-2xl font-ubuntu-medium'}`}>
              Linked Devices
            </h1>
            <p className="text-sm font-inter-light text-[#0A1F29] mt-4">Tap a device to log out</p>
          </div>

          <div className="py-7 w-full mt-5 max-w-2xl">
            {loading ? (
              <p className="text-sm font-inter-regular text-[#878686]">Loading your devices…</p>
            ) : errorMessage ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm font-inter-regular text-danger">{errorMessage}</p>
                <button
                  onClick={() => {
                    setRevokeError('');
                    void retry();
                  }}
                  className="px-5 py-2 rounded-lg bg-primary text-white font-ubuntu-semibold text-sm"
                >
                  Try again
                </button>
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm font-inter-regular text-[#878686]">
                No other devices are signed in.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {sessions.map((session) => {
                  const isCurrent = isCurrentDevice(session);
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-lg border border-accent px-4 py-3"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-inter-light text-[#0A1F29] truncate">
                          {friendlyDeviceName(session.device_name)}
                          {isCurrent ? ' (This device)' : ''}
                        </p>
                        <p className="text-xs font-inter-regular text-[#878686] mt-1">
                          Last Active : {formatLastActive(session.last_active_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => setPending(session)}
                        className="px-3 py-2 rounded-lg text-primary font-ubuntu-regular text-xs hover:bg-[#EFF1F1] transition"
                      >
                        Log Out
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {pending && (
        <Modal
          heading={pendingIsCurrent ? 'Log out of this device?' : 'Log out of this device?'}
          message={
            pendingIsCurrent
              ? 'This is the device you are using now. You will be signed out.'
              : `${friendlyDeviceName(pending.device_name)} will need to sign in again to use GatePass.`
          }
          cancelText="Cancel"
          actionText="Log Out"
          runningText="Logging out…"
          actionRunnig={revoking}
          btnDisabled={revoking}
          closeModal={() => {
            if (!revoking) setPending(null);
          }}
          action={confirmRevoke}
        />
      )}
    </div>
  );
}
