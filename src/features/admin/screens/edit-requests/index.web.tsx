import WebSidebar from '@/src/features/dashboard/components/WebSidebar';
import { Href, router, usePathname } from 'expo-router';
import { Image, Platform, useWindowDimensions } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import WebNavLink from '@/src/shared/components/navigation/WebNavLink';
import { adminRoutes, menuRoutes } from '@/src/features/dashboard/components/menuRoutes';
import { useEffect, useState } from 'react';
import icons from '@/src/shared/constants/icons';
import Modal from '@/src/shared/components/feedback/Modal';
import {
  getRequests,
  approveRequests,
  declineRequests,
} from '@/src/features/admin/services/requests';
import { getUserByIdAdmin } from '@/src/features/users/services/user';
import { RequestItem, RequestType } from '@/src/features/admin/types/requests';
import EditRequestMobile from './index.native';
import { getWidthBreakpoint } from '@/src/shared/utils/helpers';

interface EditRequest extends RequestItem {
  selected: boolean;
  userName: string;
  userEmail: string;
}

const getFieldLabelFromType = (type: RequestType): string => {
  const labels: Record<RequestType, string> = {
    first_name_change: 'First Name',
    last_name_change: 'Last Name',
    email_change: 'Email Address',
    home_address_change: 'Address',
    gender_change: 'Gender',
    vacate_residence: 'Vacate Residence',
    phone_number_change: 'Phone Number',
    id_change: 'ID Card',
  };
  return labels[type] || 'Unknown Field';
};

function EditRequestsWeb() {
  const pathname = usePathname();
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<EditRequest | null>(null);
  const [error, setError] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState<
    'approve-selected' | 'decline-selected' | 'approve-modal' | 'decline-modal' | null
  >(null);

  function onNavigate(route: Href): void {
    router.push(route);
  }

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Edit Requests - Admin Access - GatePass';
  }, []);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        const data = await getRequests({ page: 1, limit: 50, status: 'pending' });
        const requestsWithUsers = await Promise.all(
          data.items.map(async (item) => {
            try {
              const user = await getUserByIdAdmin(item.resident_id);
              return {
                ...item,
                selected: false,
                userName:
                  `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
                userEmail: user.email || 'N/A',
              };
            } catch {
              return {
                ...item,
                selected: false,
                userName: 'Unknown User',
                userEmail: 'N/A',
              };
            }
          })
        );
        setEditRequests(requestsWithUsers);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load edit requests';
        setMessageType('error');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const toggleSelection = (id: string) => {
    setEditRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, selected: !request.selected } : request
      )
    );
  };

  const toggleSelectAll = () => {
    const allSelected = editRequests.every((r) => r.selected);
    setEditRequests((prev) => prev.map((request) => ({ ...request, selected: !allSelected })));
  };

  const selectedRequests = editRequests.filter((r) => r.selected);
  const allSelected = editRequests.length > 0 && editRequests.every((r) => r.selected);

  const handleViewDetails = (request: EditRequest) => {
    setSelectedRequest(request);
  };

  /**
   * Approve/decline every selected request. Each one is settled on its own: the ones the server
   * accepted leave the list even when others fail, and only the failures stay selected for retry.
   */
  const processSelected = async (action: 'approve' | 'decline') => {
    const verb = action === 'approve' ? 'approve' : 'decline';
    const done = action === 'approve' ? 'approved' : 'declined';
    if (selectedRequests.length === 0) {
      setMessageType('error');
      setError(`Please select at least one request to ${verb}`);
      return;
    }

    setRunning(true);
    setProcessingAction(action === 'approve' ? 'approve-selected' : 'decline-selected');
    try {
      const send = action === 'approve' ? approveRequests : declineRequests;
      const results = await Promise.allSettled(selectedRequests.map((r) => send(r.id)));
      const succeeded = new Set(
        selectedRequests.filter((_, i) => results[i].status === 'fulfilled').map((r) => r.id)
      );
      const failed = results.length - succeeded.size;

      setEditRequests((prev) => prev.filter((r) => !succeeded.has(r.id)));
      if (succeeded.size > 0) setSelectedRequest(null);

      if (failed === 0) {
        setMessageType('success');
        setError(`${succeeded.size} request(s) ${done} successfully!`);
        setTimeout(() => {
          setError('');
        }, 2000);
      } else {
        const firstError = results.find((r) => r.status === 'rejected') as
          | PromiseRejectedResult
          | undefined;
        const reason =
          firstError?.reason instanceof Error ? ` ${firstError.reason.message.trim()}` : '';
        setMessageType('error');
        setError(`${succeeded.size} request(s) ${done}, ${failed} could not be ${done}.${reason}`);
      }
    } finally {
      setRunning(false);
      setProcessingAction(null);
    }
  };

  const handleApproveSelected = () => processSelected('approve');
  const handleDeclineSelected = () => processSelected('decline');

  const handleApproveFromModal = async () => {
    if (!selectedRequest) return;
    setRunning(true);
    setProcessingAction('approve-modal');
    try {
      await approveRequests(selectedRequest.id);

      setMessageType('success');
      setError('Edit request approved successfully!');

      // Remove the approved request from the list
      setEditRequests(editRequests.filter((req) => req.id !== selectedRequest.id));
      setSelectedRequest(null);

      setTimeout(() => {
        setError('');
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while approving the request';
      setMessageType('error');
      setError(errorMessage);
    } finally {
      setRunning(false);
      setProcessingAction(null);
    }
  };

  const handleDeclineFromModal = async () => {
    if (!selectedRequest) return;
    setRunning(true);
    setProcessingAction('decline-modal');
    try {
      await declineRequests(selectedRequest.id);

      setMessageType('success');
      setError('Edit request declined successfully!');

      // Remove the declined request from the list
      setEditRequests(editRequests.filter((req) => req.id !== selectedRequest.id));
      setSelectedRequest(null);

      setTimeout(() => {
        setError('');
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred while declining the request';
      setMessageType('error');
      setError(errorMessage);
    } finally {
      setRunning(false);
      setProcessingAction(null);
    }
  };

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
                                onClick={() => handleViewDetails(request)}
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
                        {/* <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-5 h-5 cursor-pointer" />
												<span className="text-sm font-inter-regular text-grey flex-1">
													{allSelected ? 'Deselect All' : 'Select All'} ({selectedRequests.length} selected)
												</span> */}
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
