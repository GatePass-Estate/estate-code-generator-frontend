import { useCallback, useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Back from '@/src/components/mobile/Back';
import WebSidebar from '@/src/components/web/WebSidebar';
import { getWidthBreakpoint } from '@/src/lib/helpers';
import { deleteAccount } from '@/src/lib/api/user';
import { useAuth } from '@/src/hooks/useAuthContext';
import { menuRoutes } from '../../user/_layout';

export default function DeleteAccountWeb() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > getWidthBreakpoint();

  const [understood, setUnderstood] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Delete Account - GatePass';
  }, []);

  const handleDelete = useCallback(async () => {
    if (!understood || deleting) return;

    setDeleting(true);
    setErrorMessage('');
    try {
      await deleteAccount();
      // Closing the account invalidates every session, so drop local auth too.
      await signOut();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Could not delete account. Please try again later.');
      setDeleting(false);
    }
  }, [understood, deleting, signOut]);

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      {isLargeScreen && (
        <WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route as any)} />
      )}
      <div className="web-body">
        <div
          className={`flex flex-col min-h-full ${isLargeScreen ? 'mt-20 px-4 w-full' : 'mt-5 md:px-5'}`}
        >
          <Back type="short-arrow" />

          <div className="mt-10 max-w-xl flex-1">
            <h1 className={`${isLargeScreen ? 'text-4xl' : 'text-2xl font-ubuntu-medium'}`}>
              Delete Account
            </h1>
            <p className="text-sm font-inter-light text-[#3E424E] mt-4 leading-5">
              Are you sure you want to delete your account? This action is irreversible.
            </p>

            <label className="flex items-center gap-3 mt-7 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={understood}
                disabled={deleting}
                onChange={(event) => setUnderstood(event.target.checked)}
                className="w-4 h-4 accent-[#E30404]"
              />
              <span className="text-sm font-inter-light text-[#3E424E]">Yes, I understand</span>
            </label>

            {!!errorMessage && (
              <p className="text-danger font-inter-regular text-xs mt-4">{errorMessage}</p>
            )}

            <button
              onClick={handleDelete}
              disabled={!understood || deleting}
              className="w-full bg-[#E30404] rounded-[24px] h-12 mt-10 mb-10 text-white font-ubuntu-semibold text-sm disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
