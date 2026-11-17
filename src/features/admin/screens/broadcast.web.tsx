import WebSidebar from '@/src/features/dashboard/components/WebSidebar';
import { Href, router, usePathname } from 'expo-router';
import { Image, Platform, useWindowDimensions } from 'react-native';
import WebNavLink from '@/src/shared/components/navigation/WebNavLink';
import { adminRoutes, menuRoutes } from '@/src/features/dashboard/components/menuRoutes';
import { useEffect } from 'react';
import icons from '@/src/shared/constants/icons';
import Modal from '@/src/shared/components/feedback/Modal';
import BroadcastMobile from './broadcast.native';
import { getWidthBreakpoint } from '@/src/shared/utils/helpers';
import { useBroadcastWebForm } from '@/src/features/admin/hooks/useBroadcastForm';
import type {
  WebBroadcastDuration as DurationType,
  WebBroadcastPriority as PriorityType,
  WebBroadcastRecipient as RecipientType,
} from '@/src/features/admin/utils/broadcastForm';

const RECIPIENT_TYPES = [
  {
    name: 'Residents',
    value: 'resident',
    description: 'Send a broadcast to all residents at Something Estate',
  },
  {
    name: 'Security',
    value: 'security',
    description: 'Send a broadcast to security personnels receive at Something Estate',
  },
  { name: 'Admins', value: 'admin', description: 'Send a broadcast to admins at Something Estate' },
  {
    name: 'All Users',
    value: 'all',
    description: 'Send a broadcast to all users at Something Estate',
  },
];

const PRIORITY_LEVELS = [
  { name: 'Low', value: 'low' },
  { name: 'Medium', value: 'medium' },
  { name: 'High', value: 'high' },
];

const DURATIONS = [
  { name: '24 hours', value: '24_hours' },
  { name: '3 days', value: '3_days' },
  { name: '7 days', value: '7_days' },
  { name: '14 days', value: '14_days' },
  { name: '30days', value: '30_days' },
];

function BroadcastWeb() {
  const pathname = usePathname();
  const {
    step,
    form: { recipientType, subjectLine, message, priority, duration },
    setField,
    error,
    setError,
    messageType,
    running,
    handleNextStep,
    handlePreviousStep,
    handleSendBroadcast,
  } = useBroadcastWebForm({ onExit: () => router.push('/admin') });

  function onNavigate(route: Href): void {
    router.push(route);
  }

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Send Broadcast - Admin Access - GatePass';
  }, []);

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      <WebSidebar
        routes={menuRoutes
          .filter((el) => el.for === 'web' || el.for === 'both')
          .map((data) => data)}
        onNavigate={onNavigate}
      />

      <div className="web-body pb-20">
        <div className="mt-20 mb-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-5xl font-ubuntu-regular text-grey">Admin Access</h1>
          </div>

          <div className="grid grid-cols-4 gap-9 md:grid-cols-12 mb-10">
            <div className="flex flex-col gap-5 w-full col-span-2">
              {adminRoutes.map(({ name, title, link, icon }, index) => {
                const isActive = pathname === link;

                return (
                  <div
                    key={name + index}
                    onClick={() => onNavigate(link)}
                    className={`flex gap-3 items-center cursor-pointer p-3 rounded-lg transition-all ${isActive ? 'bg-accent text-primary font-medium' : 'hover:bg-accent hover:text-primary hover:font-medium'}`}
                  >
                    <Image source={icon} style={{ width: 24, height: 24 }} resizeMode="contain" />
                    <WebNavLink color="primary">{title}</WebNavLink>
                  </div>
                );
              })}
            </div>

            <div className="col-span-10">
              {step === 1 && (
                <div className="mb-8 mt-6">
                  <h2 className="text-2xl font-ubuntu-medium text-primary text-center">
                    Send a broadcast
                  </h2>
                  <p className="text-base text-tertiary mt-1 text-center">
                    Select the type of user the message is for
                  </p>
                </div>
              )}

              {step === 1 && (
                <>
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    {RECIPIENT_TYPES.map((type, index) => {
                      const isActive = recipientType === type.value;
                      return (
                        <div
                          key={type.value + index}
                          onClick={() => setField('recipientType', type.value as RecipientType)}
                          className={`border rounded-xl p-6 cursor-pointer transition-all ${isActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary'}`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <p className="text-primary font-semibold capitalize">{type.name}</p>
                            {isActive && (
                              <Image
                                source={icons.checkIcon}
                                style={{ width: 20, height: 20 }}
                                resizeMode="contain"
                              />
                            )}
                          </div>
                          <p className="text-sm text-grey text-center">{type.description}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-center">
                    <button
                      className={`bg-primary rounded-md px-24 py-3 ${running && 'cursor-not-allowed opacity-75'}`}
                      disabled={running}
                      onClick={handleNextStep}
                    >
                      <p className="text-white text-sm font-semibold">Get Started</p>
                    </button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="mb-2 mt-6">
                    <h2 className="text-2xl font-ubuntu-medium text-primary">Enter Message</h2>
                  </div>
                  <div className="rounded-lg py-5 bg-white flex flex-col gap-6">
                    <div className="input-group-web">
                      <label htmlFor="subjectLine" className="input-label-web">
                        Subject Line
                      </label>
                      <input
                        name="subjectLine"
                        placeholder="Enter Subject line"
                        value={subjectLine}
                        onChange={(e) => setField('subjectLine', e.target.value)}
                        className="input-style-web"
                      />
                    </div>

                    <div className="input-group-web">
                      <label htmlFor="message" className="input-label-web">
                        Enter Message
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setField('message', e.target.value)}
                        rows={6}
                        className="input-style-web resize-none"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-row gap-4 justify-end">
                    <button
                      className={`bg-dark-teal rounded-md px-24 py-3 ${running && 'cursor-not-allowed opacity-75'}`}
                      disabled={running}
                      onClick={handlePreviousStep}
                    >
                      <p className="text-white text-sm font-semibold">Previous</p>
                    </button>

                    <button
                      className={`bg-primary rounded-md px-24 py-3 ${running && 'cursor-not-allowed opacity-75'}`}
                      disabled={running}
                      onClick={handleNextStep}
                    >
                      <p className="text-white text-sm font-semibold">Next</p>
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="rounded-lg py-8 bg-white flex flex-col gap-8">
                    <div className="input-group-web">
                      <label
                        htmlFor="priority"
                        className="input-label-web !text-2xl !font-ubuntu-medium !text-primary"
                      >
                        Set Priority Level:
                      </label>
                      <div className="flex flex-row flex-wrap gap-2 text-sm mt-1">
                        {PRIORITY_LEVELS.map((p, index) => {
                          const active = priority === p.value;
                          return (
                            <div
                              key={p.value + index}
                              className={`flex flex-row items-center px-4 py-2 rounded-md bg-light-grey ${active && 'bg-[#e6f4ef] border border-[#cfe7db]'} gap-3 cursor-pointer`}
                              onClick={() => setField('priority', p.value as PriorityType)}
                            >
                              <p className="text-primary capitalize">{p.name}</p>
                              {active && (
                                <Image
                                  source={icons.checkIcon}
                                  style={{ width: 20, height: 20 }}
                                  resizeMode="contain"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="input-group-web">
                      <label
                        htmlFor="duration"
                        className="input-label-web !text-2xl !font-ubuntu-medium !text-primary"
                      >
                        Set Duration of Broadcast:
                      </label>
                      <div className="flex flex-row flex-wrap gap-2 text-sm mt-1">
                        {DURATIONS.map((d, index) => {
                          const active = duration === d.value;
                          return (
                            <div
                              key={d.value + index}
                              className={`flex flex-row items-center px-4 py-2 rounded-md bg-light-grey ${active && 'bg-[#e6f4ef] border border-[#cfe7db]'} gap-3 cursor-pointer`}
                              onClick={() => setField('duration', d.value as DurationType)}
                            >
                              <p className="text-primary capitalize">{d.name}</p>
                              {active && (
                                <Image
                                  source={icons.checkIcon}
                                  style={{ width: 20, height: 20 }}
                                  resizeMode="contain"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-row gap-4 justify-end">
                    <button
                      className={`bg-dark-teal rounded-md px-24 py-3 ${running && 'cursor-not-allowed opacity-75'}`}
                      disabled={running}
                      onClick={handlePreviousStep}
                    >
                      <p className="text-white text-sm font-semibold">Previous</p>
                    </button>

                    <button
                      className={`bg-primary rounded-md px-24 py-3 ${running && 'cursor-not-allowed opacity-75'}`}
                      disabled={running}
                      onClick={handleSendBroadcast}
                    >
                      <p className="text-white text-sm font-semibold">Send Broadcast</p>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <Modal
            closeModal={() => setError('')}
            heading={messageType === 'success' ? 'Success' : 'Validation Error'}
            message={error}
            cancelText={'Close'}
          />
        )}
      </div>
    </div>
  );
}

export default function BroadcastPage() {
  const { width } = useWindowDimensions();

  const isLargeScreen = width > getWidthBreakpoint();
  return isLargeScreen ? <BroadcastWeb /> : <BroadcastMobile />;
}
