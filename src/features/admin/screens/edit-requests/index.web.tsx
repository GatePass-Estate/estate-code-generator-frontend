import WebSidebar from '@/src/features/dashboard/components/WebSidebar';
import { Href, router, usePathname } from 'expo-router';
import { Image, Platform, useWindowDimensions } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import WebNavLink from '@/src/shared/components/navigation/WebNavLink';
import { adminRoutes, menuRoutes } from '@/src/features/dashboard/components/menuRoutes';
import { useEffect } from 'react';
import icons from '@/src/shared/constants/icons';
import Modal from '@/src/shared/components/feedback/Modal';
import EditRequestMobile from './index.native';
import { getWidthBreakpoint } from '@/src/shared/utils/helpers';
import { useEditRequestsReview } from '@/src/features/admin/hooks/useEditRequestsList';
import { getFieldLabelFromType } from '@/src/features/admin/utils/editRequests';

function EditRequestsWeb() {
  const pathname = usePathname();
  const {
    editRequests,
    loading,
    selectedRequests,
    allSelected,
    toggleSelection,
    toggleSelectAll,
    selectedRequest,
    setSelectedRequest,
    error,
    setError,
    messageType,
    running,
    processingAction,
    handleApproveSelected,
    handleDeclineSelected,
    handleApproveFromModal,
    handleDeclineFromModal,
  } = useEditRequestsReview();

  function onNavigate(route: Href): void {
    router.push(route);
  }

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Edit Requests - Admin Access - GatePass';
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
              <div className="mt-6">
                <h2 className="text-2xl font-ubuntu-medium text-primary">Edit Request</h2>
                <p className="text-base text-tertiary mt-1">
                  Approve or decline edit request made by residents
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <p className="text-grey">Loading edit requests...</p>
                </div>
              ) : editRequests.length > 0 ? (
                <>
                  <div className="overflow-x-auto mt-10">
                    <table className="w-full">
                      <thead>
                        <tr className="border border-gray-200 rounded-3xl">
                          <th className="text-left py-4 px-4 font-inter-regular text-grey text-sm w-8">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={toggleSelectAll}
                              className="w-5 h-5 cursor-pointer"
                            />
                          </th>
                          <th className="text-left py-4 px-4 font-inter-regular text-grey text-sm">
                            Name
                          </th>
                          <th className="text-left py-4 px-4 font-inter-regular text-grey text-sm">
                            Email Address
                          </th>
                          <th className="text-left py-4 px-4 font-inter-regular text-grey text-sm">
                            Phone Number
                          </th>
                          <th className="text-left py-4 px-4 font-inter-regular text-grey text-sm">
                            Request Type
                          </th>
                          <th className="text-left py-4 px-4 font-inter-regular text-grey text-sm"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {editRequests.map((request, index) => (
                          <tr
                            key={request.id + index}
                            className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-50 transition`}
                          >
                            <td className="py-4 px-4">
                              <input
                                type="checkbox"
                                checked={request.selected}
                                onChange={() => toggleSelection(request.id)}
                                className="w-5 h-5 cursor-pointer"
                              />
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-primary text-sm font-inter-regular">
                                {request.userName}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-primary text-sm font-inter-regular">
                                {request.userEmail}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-primary text-sm font-inter-regular">
                                {request.old_value}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-primary text-sm font-inter-regular capitalize">
                                {getFieldLabelFromType(request.request_type)}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <button
                                onClick={() => setSelectedRequest(request)}
                                className="p-2 hover:bg-gray-200 rounded transition"
                                title="View"
                              >
                                <Image
                                  source={icons.expand}
                                  style={{ width: 20, height: 20 }}
                                  resizeMode="contain"
                                />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {editRequests.length > 0 && (
                      <div className="flex items-center gap-4 mb-4 p-4 bg-white justify-end mt-20">
                        <button
                          onClick={handleDeclineSelected}
                          disabled={running || selectedRequests.length === 0}
                          className={`border rounded-md px-24 py-4 flex items-center justify-center ${(running || selectedRequests.length === 0) && 'cursor-not-allowed opacity-50'} border-accent`}
                        >
                          {processingAction === 'decline-selected' ? (
                            <CircleLoader size={32} />
                          ) : (
                            <p className="text-primary text-sm font-semibold">Decline</p>
                          )}
                        </button>
                        <button
                          onClick={handleApproveSelected}
                          disabled={running || selectedRequests.length === 0}
                          className={`bg-primary rounded-md px-24 py-4 flex items-center justify-center ${(running || selectedRequests.length === 0) && 'cursor-not-allowed opacity-50'}`}
                        >
                          {processingAction === 'approve-selected' ? (
                            <CircleLoader size={22} tone="light" />
                          ) : (
                            <p className="text-white text-sm font-semibold">Approve</p>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex justify-center items-center py-12">
                  <p className="text-grey">No edit requests at the moment</p>
                </div>
              )}

              {selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-8 max-w-2xl w-full overflow-y-auto">
                    <div className="flex justify-end items-center mb-6">
                      <button
                        onClick={() => setSelectedRequest(null)}
                        className="text-grey hover:text-primary text-3xl"
                      >
                        ×
                      </button>
                    </div>

                    <div className="flex flex-col gap-8">
                      <div className="bg-light-grey p-4 rounded-lg border border-grey/50">
                        <div className="space-y-4 text-sm">
                          <div className="flex items-center gap-7">
                            <p className="text-grey font-inter-regular">
                              {getFieldLabelFromType(selectedRequest.request_type)}:
                            </p>
                            <p className="text-grey font-inter-regular">
                              {selectedRequest.old_value || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-light-teal p-4 rounded-lg border border-teal/40">
                        <div className="space-y-4 text-sm">
                          <div className="flex items-center gap-7">
                            <p className="text-grey font-inter-regular">
                              {getFieldLabelFromType(selectedRequest.request_type)}:
                            </p>
                            <p className="text-primary font-inter-regular">
                              {selectedRequest.new_value || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-8 pt-6">
                      <button
                        onClick={handleDeclineFromModal}
                        disabled={running}
                        className={`flex-1 bg-dark-teal rounded-md px-6 py-3 flex items-center justify-center ${running && 'cursor-not-allowed opacity-75'}`}
                      >
                        {processingAction === 'decline-modal' ? (
                          <CircleLoader size={22} tone="light" />
                        ) : (
                          <p className="text-white text-sm font-semibold">Decline</p>
                        )}
                      </button>
                      <button
                        onClick={handleApproveFromModal}
                        disabled={running}
                        className={`flex-1 bg-primary rounded-md px-6 py-3 flex items-center justify-center ${running && 'cursor-not-allowed opacity-75'}`}
                      >
                        {processingAction === 'approve-modal' ? (
                          <CircleLoader size={22} tone="light" />
                        ) : (
                          <p className="text-white text-sm font-semibold">Approve</p>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <Modal
            closeModal={() => setError('')}
            heading={messageType === 'success' ? 'Success' : 'Error'}
            message={error}
            cancelText={'Close'}
          />
        )}
      </div>
    </div>
  );
}

export default function EditRequestsPage() {
  const { width } = useWindowDimensions();

  const isLargeScreen = width > getWidthBreakpoint();
  return isLargeScreen ? <EditRequestsWeb /> : <EditRequestMobile />;
}
