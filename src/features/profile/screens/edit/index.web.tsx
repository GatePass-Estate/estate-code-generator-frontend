import { menuRoutes } from '@/src/features/dashboard/components/menuRoutes';
import WebSidebar from '@/src/features/dashboard/components/WebSidebar';
import { useUserStore } from '@/src/store/userStore';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { getWidthBreakpoint } from '@/src/shared/utils/helpers';
import { submitProfileEdits } from '@/src/features/profile/utils/submitProfileEdits';

export const EditProfileForm = ({ centralize = false }: { centralize?: boolean }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    phoneNumber: '',
  });

  const user = useUserStore.getState();
  const { width } = useWindowDimensions();

  const isLargeScreen = width > getWidthBreakpoint();
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    []
  );

  useEffect(() => {
    const current = useUserStore.getState();
    setFormData({
      firstName: current.first_name || '',
      lastName: current.last_name || '',
      email: current.email || '',
      address: current.home_address || '',
      phoneNumber: current.phone_number || '',
    });
  }, []);

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccess('');
    setLoading(true);

    try {
      const result = await submitProfileEdits(user, formData);
      if (result.status === 'unchanged') {
        setErrors(['No changes detected']);
        return;
      }
      if (result.status !== 'saved') {
        setErrors(result.errors);
        return;
      }

      setSuccess(result.message);
      leaveTimer.current = setTimeout(() => router.back(), 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col ${isLargeScreen ? 'mt-20 px-4 w-full' : 'mt-5 px-5'}`}>
      <div className={`${!isLargeScreen && 'mt-5'}`}>
        <h1
          className={`${isLargeScreen ? 'text-4xl' : 'text-2xl font-ubuntu-medium'} ${centralize && 'text-center'}`}
        >
          Edit Profile
        </h1>
        <p className={`text-base text-tertiary mt-1 ${centralize && 'text-center'}`}>
          Send a request to edit your personal details
        </p>
      </div>
      <form
        className="py-7 flex flex-col gap-6 min-w-[400px]  md:min-w-[500px] lg:min-w-[600px]"
        onSubmit={handleSubmission}
      >
        {errors.length > 0 && (
          <div className="space-y-2">
            {errors.map((error, idx) => (
              <div
                key={idx}
                className="text-danger font-medium p-3 bg-danger/20 rounded flex justify-between items-center"
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setErrors(errors.filter((_, i) => i !== idx))}
                  className="text-danger hover:opacity-70 font-bold text-lg"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {success && (
          <div className="text-green-500 font-medium p-3 bg-green-500/20 rounded flex justify-between items-center">
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess('')}
              className="text-green-500 hover:opacity-70 font-bold text-lg"
            >
              ×
            </button>
          </div>
        )}

        <div
          className=" bg-body border-micro
							 border-primary rounded-lg p-8 flex flex-col gap-6 "
        >
          <div className="flex flex-col gap-2">
            <label className="input-label-web">Name</label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input-style-web flex-1"
                required
                disabled={loading}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input-style-web flex-1"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="input-label-web">Email Address</label>
            <input
              type="email"
              placeholder={`${useUserStore.getState().email}`}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-style-web"
              required
              disabled={loading}
            />
          </div>

          {!centralize && (
            <div className="flex flex-col gap-2">
              <label className="input-label-web">Address</label>
              <input
                type="text"
                placeholder={`${useUserStore.getState().home_address}`}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-style-web"
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="input-label-web">Phone Number</label>
            <input
              type="text"
              placeholder={`${useUserStore.getState().phone_number}`}
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="input-style-web"
              disabled={loading}
            />
          </div>
        </div>

        <div className=" flex gap-4 pr-2 pl-14">
          <button
            onClick={() => router.back()}
            type="button"
            className={`text-primary font-medium py-3 px-14 flex-1 cursor-pointer ${centralize && 'border border-accent px-20 rounded-lg'}`}
            disabled={loading}
          >
            {centralize ? 'Back' : 'Cancel Request'}
          </button>

          <button
            type="submit"
            className={`self-end bg-primary text-white font-medium text-sm rounded-lg py-3 px-14 flex-1 cursor-pointer ${loading && 'opacity-65'}`}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default function EditProfile() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Edit Profile - GatePass';
  }, []);

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      <WebSidebar
        routes={menuRoutes.filter((el) => el.for == 'web' || el.for == 'both').map((data) => data)}
        onNavigate={(route) => router.push(route)}
      />

      <div className="web-body">
        <EditProfileForm />
      </div>
    </div>
  );
}
