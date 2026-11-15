import AccessCodeCard from '@/src/features/access-codes/components/AccessCodeCard';
import WebSidebar from '@/src/features/dashboard/components/WebSidebar';
import icons from '@/src/shared/constants/icons';
import { useRouter } from 'expo-router';
import { Image, Platform, useWindowDimensions } from 'react-native';
import { menuRoutes } from '@/src/features/dashboard/components/menuRoutes';
import { useEffect } from 'react';
import Modal from '@/src/shared/components/feedback/Modal';
import { useUserStore } from '@/src/store/userStore';
import { Pagination } from '@/src/shared/components/Pagination';
import images from '@/src/shared/constants/images';
import { getWidthBreakpoint } from '@/src/shared/utils/helpers';
import UserIcon from '@/src/shared/components/UserIcon';
import CodeItem from '@/src/features/access-codes/components/CodeItem';
import { useHomeWeb } from '@/src/features/dashboard/hooks/useHomeWeb';
import { cardGender, webCodeWindow } from '@/src/features/dashboard/utils/homeCodes';

export default function HomeWeb() {
  const router = useRouter();
  const {
    loading,
    codes,
    codesPaginated,
    codesPage,
    setCodesPage,
    codesTotalPages,
    removeCode,
    performRemoveCode,
    searchQuery,
    setSearchQuery,
    filteredGuests,
    guestsPage,
    guestsTotalPages,
    changeGuestsPage,
    requestDeleteGuest,
    confirmModalVisible,
    pendingType,
    closeConfirm,
    confirmDeleteGuest,
    deleting,
    running,
    generatingGuestId,
    handleGenerateCode,
    error,
    clearError,
  } = useHomeWeb();
  const { width } = useWindowDimensions();

  const isLargeScreen = width > getWidthBreakpoint();

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Home - GatePass';
  }, []);

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      <WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route)} />

      <div className="web-body">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-base text-tertiary">Loading...</p>
          </div>
        ) : (
          <>
            <div
              className={`flex flex-col justify-center gap-7 ${isLargeScreen ? 'mt-20' : 'mt-5'}`}
            >
              <div className="flex justify-between">
                <h1 className={`${isLargeScreen ? 'text-4xl' : 'text-2xl font-ubuntu-medium'}`}>
                  Active Codes
                </h1>

                {!isLargeScreen && <UserIcon />}
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                {codesPaginated.map((code, i) => {
                  const gender = cardGender(code.gender);
                  const { parsed, formattedDate, timeframe } = webCodeWindow(code.valid_until);

                  return isLargeScreen ? (
                    <AccessCodeCard
                      key={code.hashed_code + i}
                      code={code.hashed_code}
                      estate_id={code.estate_id}
                      details={{
                        name: code.visitor_fullname || 'Guest',
                        address: `${useUserStore.getState().home_address}, ${useUserStore.getState().estate_name}.`,
                        date: formattedDate,
                        timeframe,
                      }}
                      variant={gender}
                      timeLeftMinutes={parsed.getTime()}
                      removeCode={performRemoveCode}
                      onExpire={() => {
                        removeCode(code.hashed_code);
                      }}
                    />
                  ) : (
                    <CodeItem
                      key={code.hashed_code + i}
                      item={code}
                      timeframe={timeframe}
                      formattedDate={formattedDate}
                      parsed={parsed}
                    />
                  );
                })}
              </div>

              {codes.length === 0 ? (
                <div className="mb-28 flex flex-col justify-center items-center gap-2">
                  <Image source={images.ghostImg} style={{ width: 100, height: 100 }} />
                  <p className="text-lg text-center text-gray-400">No active codes found.</p>
                </div>
              ) : (
                <div className="flex justify-end mb-6">
                  <Pagination
                    currentPage={codesPage}
                    totalPages={codesTotalPages}
                    onPageChange={setCodesPage}
                    condition={running}
                  />
                </div>
              )}
            </div>

            {isLargeScreen && (
              <div className="flex flex-col justify-center gap-4 mt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-blackq">My Guest List</h2>

                  <input
                    type="text"
                    placeholder="Search guests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                  {filteredGuests.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 items-center p-3 bg-light-grey w-full rounded-lg"
                    >
                      <Image
                        source={
                          item.gender === 'male'
                            ? icons.maleIcon
                            : item.gender === 'prefer_not_to_say'
                              ? icons.notSayingGender
                              : icons.femaleIcon
                        }
                        style={{
                          width: 25,
                          height: item.gender === 'female' ? 37 : 25,
                        }}
                      />

                      <div className="flex flex-col">
                        <p className="text-xl capitalize font-UbuntuSans">{item.guest_name}</p>
                        <span className="text-xs capitalize font-Inter text-primary">
                          {item.relationship}
                        </span>
                      </div>

                      <div className="flex gap-3 ml-auto">
                        <button
                          type="button"
                          className={`capitalize px-6 py-2 bg-teal font-semibold rounded-lg text-white text-base ${!!generatingGuestId && 'opacity-65'}`}
                          onClick={() => requestDeleteGuest(item.id)}
                          disabled={running}
                        >
                          delete
                        </button>
                        <button
                          type="button"
                          className={`capitalize px-8 py-3 bg-primary font-semibold rounded-lg text-white text-base ${!!generatingGuestId && 'opacity-65'}`}
                          onClick={() =>
                            handleGenerateCode({
                              name: item.guest_name,
                              relationship_with_resident: item.relationship,
                              gender: item.gender,
                              guestId: item.id,
                            })
                          }
                          disabled={!!generatingGuestId}
                        >
                          {generatingGuestId === item.id ? 'Generating code...' : 'generate code'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredGuests.length === 0 ? (
                  <div className="mb-28 flex flex-col justify-center items-center gap-2">
                    <Image source={images.ghostImg} style={{ width: 100, height: 100 }} />
                    <p className="text-lg text-center text-gray-400">
                      {searchQuery ? 'No guests match your search.' : 'No guests were found'}
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-end mt-4">
                    <Pagination
                      currentPage={guestsPage}
                      totalPages={guestsTotalPages}
                      onPageChange={changeGuestsPage}
                      condition={running}
                    />
                    <br />
                    <br />
                    <br />
                  </div>
                )}
              </div>
            )}

            {confirmModalVisible && pendingType === 'guest' && (
              <Modal
                closeModal={closeConfirm}
                heading={'Confirm delete'}
                message={`Are you sure you want to delete this guest? This action cannot be undone.`}
                btnDisabled={deleting}
                actionRunnig={deleting}
                cancelText={'Cancel'}
                action={confirmDeleteGuest}
                runningText={'Deleting...'}
                actionText={'Delete'}
              />
            )}

            {error && (
              <Modal
                closeModal={clearError}
                heading={'Sorry, an error occurred'}
                message={error}
                cancelText={'Cancel'}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
