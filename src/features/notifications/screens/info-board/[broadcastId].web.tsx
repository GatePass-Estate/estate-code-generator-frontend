import { useEffect } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Back from '@/src/shared/components/navigation/Back';
import WebSidebar from '@/src/features/dashboard/components/WebSidebar';
import { getWidthBreakpoint } from '@/src/shared/utils/helpers';
import { useBroadcastDetail } from '@/src/features/notifications/hooks/useBroadcastDetail';
import { formatSentDate } from '@/src/features/notifications/utils/broadcastStyle';
import { menuRoutes } from '@/src/features/dashboard/components/menuRoutes';

export default function BroadcastDetailWeb() {
  const router = useRouter();
  const { broadcastId } = useLocalSearchParams<{ broadcastId?: string }>();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > getWidthBreakpoint();
  const { broadcast, loading, errorMessage, reload } = useBroadcastDetail(broadcastId);

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Message - GatePass';
  }, []);

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      {isLargeScreen && (
        <WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route)} />
      )}
      <div className="web-body">
        <div className={`flex flex-col ${isLargeScreen ? 'mt-20 px-4 w-full' : 'mt-5 md:px-5'}`}>
          <Back type="short-arrow" showText={false} showBorder />

          {loading ? (
            <p className="text-sm font-inter-regular text-[#878686] mt-10">Loading…</p>
          ) : errorMessage ? (
            <div className="flex flex-col items-start gap-3 mt-10">
              <p className="text-sm font-inter-regular text-danger">{errorMessage}</p>
              <button
                onClick={reload}
                className="px-5 py-2 rounded-lg bg-primary text-white font-ubuntu-semibold text-sm"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="mt-10 max-w-2xl mb-10">
              <h1 className={`${isLargeScreen ? 'text-4xl' : 'text-2xl font-ubuntu-medium'}`}>
                {broadcast?.title}
              </h1>
              <p className="text-sm font-inter-light text-primary mt-1">
                Sent: {formatSentDate(broadcast?.created_at)}
              </p>

              <div className="bg-white rounded-lg px-5 py-7 mt-5">
                <p className="text-sm font-inter-light text-[#0A1F29] leading-6 whitespace-pre-wrap">
                  {broadcast?.message}
                </p>
              </div>

              {!!broadcast?.sender_name && (
                <p className="text-[11px] font-inter-regular text-[#878686] mt-4">
                  From {broadcast.sender_name}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
