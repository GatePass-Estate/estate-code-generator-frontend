import { useCallback, useEffect } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Back from '@/src/components/mobile/Back';
import WebSidebar from '@/src/components/web/WebSidebar';
import { getWidthBreakpoint } from '@/src/lib/helpers';
import { ActivityAlertIcon, PriorityAlarmIcon } from '@/src/assets/svgs';
import { useInfoBoard, type InfoBoardTab } from '@/src/hooks/useInfoBoard';
import { useNotificationStore } from '@/src/lib/stores/notificationStore';
import { isAlertNotification, priorityStyle, relativeTime } from '@/src/lib/broadcastStyle';
import { menuRoutes } from '../../user/_layout';

export default function InfoBoardWeb() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > getWidthBreakpoint();

  const {
    tab,
    setTab,
    broadcasts,
    activities,
    loading,
    errorMessage,
    busy,
    readBroadcast,
    removeBroadcast,
    readActivity,
    removeActivity,
    clearCurrentTab,
    hasItems,
  } = useInfoBoard();

  const broadcastUnread = useNotificationStore((state) => state.broadcastUnread);
  const activityUnread = useNotificationStore((state) => state.activityUnread);

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Info Board - GatePass';
  }, []);

  const openBroadcast = useCallback(
    (id: string) => {
      void readBroadcast(id);
      router.push(`/info-board/${id}`);
    },
    [readBroadcast, router]
  );

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      {isLargeScreen && (
        <WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route as any)} />
      )}
      <div className="web-body">
        <div className={`flex flex-col ${isLargeScreen ? 'mt-20 px-4 w-full' : 'mt-5 md:px-5'}`}>
          <Back type="short-arrow" />

          <div className="mt-10 max-w-2xl">
            <h1 className={`${isLargeScreen ? 'text-4xl' : 'text-2xl font-ubuntu-medium'}`}>
              {tab === 'message' ? 'Info Board' : 'Recent Activity'}
            </h1>

            <div className="inline-flex rounded-[24px] bg-[#EFF1F1] mt-5">
              {(['message', 'activities'] as InfoBoardTab[]).map((value) => {
                const active = tab === value;
                const unread = value === 'message' ? broadcastUnread : activityUnread;
                return (
                  <button
                    key={value}
                    onClick={() => setTab(value)}
                    className={`relative h-10 w-[119px] rounded-[24px] font-inter-regular text-[11px] transition ${
                      active ? 'bg-accent text-primary' : 'text-[#878686]'
                    }`}
                  >
                    {value === 'message' ? 'Message' : 'Activities'}
                    {!active && unread > 0 && (
                      <span className="absolute right-3 top-2 h-[9px] w-[9px] rounded-full bg-[#E30404]" />
                    )}
                  </button>
                );
              })}
            </div>

            {!!errorMessage && (
              <p className="text-danger font-inter-regular text-xs mt-4">{errorMessage}</p>
            )}

            {loading ? (
              <p className="text-sm font-inter-regular text-[#878686] mt-8">Loading…</p>
            ) : (
              <div className="flex flex-col gap-3 mt-6">
                {tab === 'message' ? (
                  broadcasts.length === 0 ? (
                    <p className="text-sm font-inter-regular text-[#878686] py-8">
                      No messages from your estate yet.
                    </p>
                  ) : (
                    broadcasts.map((item) => {
                      const style = priorityStyle(item.priority);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center rounded-lg border px-4 py-3"
                          style={{ backgroundColor: style.background, borderColor: style.border }}
                        >
                          <PriorityAlarmIcon color={style.icon} circleColor={style.circle} />

                          <button
                            onClick={() => openBroadcast(item.id)}
                            className="flex-1 min-w-0 px-3 text-left"
                          >
                            <p
                              className={`text-sm text-[#0A1F29] truncate ${
                                item.is_read ? 'font-inter-light' : 'font-inter-semibold'
                              }`}
                            >
                              {item.title}
                            </p>
                            <p className="text-[11px] font-inter-regular text-[#878686] truncate mt-0.5">
                              {item.message}
                            </p>
                          </button>

                          <span className="text-[11px] font-inter-regular text-[#878686] mr-3">
                            {relativeTime(item.created_at)}
                          </span>
                          <button
                            onClick={() => void removeBroadcast(item.id)}
                            className="text-[11px] font-ubuntu-regular text-[#E30404] hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      );
                    })
                  )
                ) : activities.length === 0 ? (
                  <p className="text-sm font-inter-regular text-[#878686] py-8">
                    Nothing has happened on your account yet.
                  </p>
                ) : (
                  activities.map((item) => {
                    const alert = isAlertNotification(item.type);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center rounded-lg px-4 py-4"
                        style={{
                          backgroundColor: alert ? '#FFF8F5' : '#FFFFFF',
                          border: alert ? '1px solid #E30404' : '1px solid transparent',
                        }}
                      >
                        <ActivityAlertIcon
                          color={alert ? '#E30404' : '#113E55'}
                          circleColor={alert ? '#FFF0EC' : '#CEE5ED'}
                        />

                        <button
                          onClick={() => void readActivity(item.id)}
                          className="flex-1 min-w-0 px-3 text-left"
                        >
                          <p
                            className={`text-sm text-[#0A1F29] truncate ${
                              item.is_read ? 'font-inter-light' : 'font-inter-semibold'
                            }`}
                          >
                            {item.title}
                          </p>
                        </button>

                        <span className="text-[11px] font-inter-regular text-[#878686] mr-3">
                          {relativeTime(item.created_at)}
                        </span>
                        <button
                          onClick={() => void removeActivity(item.id)}
                          className="text-[11px] font-ubuntu-regular text-[#E30404] hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {hasItems && (
              <button
                onClick={() => void clearCurrentTab()}
                disabled={busy}
                className="w-full bg-primary rounded-[24px] h-11 mt-8 mb-10 text-[#F6F7F7] font-ubuntu-semibold text-sm disabled:opacity-70"
              >
                {busy ? 'Clearing…' : 'Clear All'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
