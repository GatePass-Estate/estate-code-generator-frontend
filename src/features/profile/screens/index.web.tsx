import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Image, Platform, useWindowDimensions } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import icons from '@/src/shared/constants/icons';
import { useUserStore } from '@/src/store/userStore';
import { useGenerateCode, useMyResidentCode } from '@/src/features/access-codes/hooks/codes';
import { formatDateWithOrdinal, getWidthBreakpoint } from '@/src/shared/utils/helpers';
import { logger } from '@/src/shared/utils/logger';
import Back from '@/src/shared/components/navigation/Back';
import WebSidebar from '@/src/features/dashboard/components/WebSidebar';
import { menuRoutes } from '@/src/features/dashboard/components/menuRoutes';

export default function MyProfile() {
  const router = useRouter();
  const user_id = useUserStore((s) => s.user_id);
  const estate_id = useUserStore((s) => s.estate_id);
  const first_name = useUserStore((s) => s.first_name);
  const last_name = useUserStore((s) => s.last_name);
  const home_address = useUserStore((s) => s.home_address);
  const email = useUserStore((s) => s.email);
  const phone_number = useUserStore((s) => s.phone_number);
  const codeQuery = useMyResidentCode(user_id);
  const generateResidentCode = useGenerateCode();
  const { refetch: refetchResidentCode } = codeQuery;
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  const isLargeScreen = width > getWidthBreakpoint();

  const fetchMyCode = useCallback(async () => {
    setLoading(true);
    const result = await refetchResidentCode();
    if (result.data) {
      setCode(result.data.hashed_code);
      setExpiry(result.data.valid_until);
    } else {
      logger.error('Could not load resident code', result.error);
    }
    setLoading(false);
  }, [refetchResidentCode]);

  const handleGenerateCode = useCallback(async () => {
    setLoading(true);
    try {
      const result = await generateResidentCode.mutateAsync({
        user_id,
        estate_id: estate_id ?? '',
        receiver: 'resident',
      });
      setCode(result.hashed_code);
      setExpiry(result.valid_until);
    } catch (error) {
      logger.error('Could not generate resident code', error);
    } finally {
      setLoading(false);
    }
  }, [estate_id, generateResidentCode, user_id]);

  useEffect(() => {
    fetchMyCode();
    if (Platform.OS === 'web') document.title = 'My Profile - GatePass';
  }, [fetchMyCode]);

  const { expiring, formattedDate } = useMemo(() => {
    if (!expiry) return { expiring: false, formattedDate: null };
    const expDate = new Date(expiry);
    const now = new Date();
    const daysLeft = (expDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return {
      expiring: daysLeft <= 30,
      formattedDate: formatDateWithOrdinal(expDate),
    };
  }, [expiry]);

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      {isLargeScreen && (
        <WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route)} />
      )}
      <div className="web-body">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-base text-tertiary">Loading...</p>
          </div>
        ) : (
          <>
            <div
              className={`flex flex-col ${isLargeScreen ? 'mt-20 px-4 w-full' : 'mt-5 md:px-5'}`}
            >
              <Back type="short-arrow" />

              <div className="mt-10">
                <div className="flex justify-between">
                  <h1 className={`${isLargeScreen ? 'text-4xl' : 'text-2xl font-ubuntu-medium'}`}>
                    My Profile
                  </h1>
                </div>
                <p className="text-base text-tertiary mt-1">My personal details</p>
              </div>

              {/* Code & Password Row */}
              <div className="py-7 w-full mt-5">
                <div className={`flex gap-4 mb-1 ${isLargeScreen ? 'flex-row' : 'flex-col'}`}>
                  {/* Access Code */}
                  <div className="flex capitalize items-center border rounded-lg px-5 bg-white text-base text-primary p-4 w-full justify-between border-grey">
                    <div className="flex gap-10">
                      <span>My access code:</span>
                      <span className="tracking-[2px] uppercase">
                        {code ? `${code.slice(0, 3)} ${code.slice(3)}` : '-------------'}
                      </span>
                    </div>
                    <div onClick={handleGenerateCode}>
                      {loading ? (
                        <CircleLoader size={36} />
                      ) : (
                        <Image
                          source={icons.refresh}
                          style={{ width: 20, height: 20 }}
                          resizeMode="contain"
                          className="cursor-pointer"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expiry Warning */}
                {formattedDate && (
                  <div className="flex items-center gap-2 mt-2">
                    <Image
                      source={expiring ? icons.warning : icons.warningInfo}
                      style={{ width: 20, height: 20 }}
                      resizeMode="contain"
                    />
                    <p
                      className={`italic text-sm font-medium ${expiring ? 'text-tertiary' : 'text-primary'}`}
                    >
                      Code expires on {formattedDate}
                      {expiring && ': Regenerate Code now'}
                    </p>
                  </div>
                )}
              </div>

              {/* Personal Details */}
              <div className="mb-8 p-8 rounded-lg border border-accent bg-[#f3fcfa] flex flex-col gap-4">
                {[
                  {
                    label: 'Name',
                    value: `${first_name} ${last_name}`,
                  },
                  {
                    label: 'Address',
                    value: home_address,
                  },
                  {
                    label: 'Email Address',
                    value: email,
                  },
                  {
                    label: 'Phone Number',
                    value: phone_number,
                  },
                ].map((item, index) => (
                  <div key={item.label + index} className="flex gap-3 items-center">
                    <span className="input-label-web w-36">{item.label} :</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => router.push('/profile/edit')} className="self-end full-btn">
                Edit Request
              </button>
            </div>

            {!isLargeScreen && (
              <div className=" absolute bottom-0 right-0 left-0 flex justify-center items-center">
                <p className="text-tertiary font-bold text-[16px] p-5 font-UbuntuSans">Log Out</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
