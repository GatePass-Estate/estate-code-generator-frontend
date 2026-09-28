import { useCallback, useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Back from '@/src/components/mobile/Back';
import WebSidebar from '@/src/components/web/WebSidebar';
import Modal from '@/src/components/web/Modal';
import { getWidthBreakpoint } from '@/src/lib/helpers';
import { listSessions, revokeSession } from '@/src/lib/api/auth';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { useAuth } from '@/src/hooks/useAuthContext';
import { formatLastActive, friendlyDeviceName } from '@/src/lib/deviceName';
import type { SessionResponse } from '@/src/types/auth';
import { menuRoutes } from '../../user/_layout';

export default function LinkedDevicesWeb() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > getWidthBreakpoint();

  const currentSessionId = useAuthStore((state) => state.session_id);

  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [pending, setPending] = useState<SessionResponse | null>(null);
  const [revoking, setRevoking] = useState(false);

  const loadSessions = useCallback(async () => {
    setErrorMessage('');
    try {
      const response = await listSessions();
      setSessions(response?.items ?? []);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Could not load your devices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Linked Devices - GatePass';
  }, []);

  const confirmRevoke = useCallback(async () => {
    if (!pending) return;
    const isCurrent = !!currentSessionId && pending.id === currentSessionId;

    setRevoking(true);
    try {
      await revokeSession(pending.id);
      // Revoking our own session kills this token, so sign out locally rather
      // than continue with a dead credential.
      if (isCurrent) {
        await signOut();
        return;
      }
      setSessions((current) => current.filter((item) => item.id !== pending.id));
      setPending(null);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Could not log that device out.');
      setPending(null);
    } finally {
      setRevoking(false);
    }
  }, [pending, currentSessionId, signOut]);

  const pendingIsCurrent = !!pending && !!currentSessionId && pending.id === currentSessionId;

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      {isLargeScreen && (
        <WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route as any)} />
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
                    setLoading(true);
                    loadSessions();
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
                  const isCurrent = !!currentSessionId && session.id === currentSessionId;
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
