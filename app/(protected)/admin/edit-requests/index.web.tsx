import WebSidebar from '@/src/components/web/WebSidebar';
import { router, usePathname } from 'expo-router';
import { Image, Platform, ActivityIndicator, useWindowDimensions } from 'react-native';
import WebNavLink from '@/src/components/web/WebNavLink';
import { menuRoutes } from '@/app/(protected)/user/_layout';
import { adminRoutes } from '../_layout';
import { useEffect, useState } from 'react';
import icons from '@/src/constants/icons';
import Modal from '@/src/components/web/Modal';
import { getRequests, approveRequests, declineRequests } from '@/src/lib/api/requests';
import { getUserById } from '@/src/lib/api/user';
import { RequestItem, RequestType } from '@/src/types/requests';
import EditRequestMobile from './index.native';
import { getWidthBreakpoint } from '@/src/lib/helpers';

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
	const [processingAction, setProcessingAction] = useState<'approve-selected' | 'decline-selected' | 'approve-modal' | 'decline-modal' | null>(null);

	function onNavigate(route: string): void {
		router.push(route as any);
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
							const user = await getUserById(item.resident_id);
							return {
								...item,
								selected: false,
								userName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
								userEmail: user.email || 'N/A',
							};
						} catch (err) {
							return {
								...item,
								selected: false,
								userName: 'Unknown User',
								userEmail: 'N/A',
							};
						}
					}),
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
		setEditRequests((prev) => prev.map((request) => (request.id === id ? { ...request, selected: !request.selected } : request)));
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

	const handleApproveSelected = async () => {
		if (selectedRequests.length === 0) {
			setMessageType('error');
			setError('Please select at least one request to approve');
			return;
		}

		setRunning(true);
		setProcessingAction('approve-selected');
		try {
			await Promise.all(selectedRequests.map((r) => approveRequests(r.id)));

			setMessageType('success');
			setError(`${selectedRequests.length} request(s) approved successfully!`);

			// Remove approved requests from list
			setEditRequests((prev) => prev.filter((r) => !r.selected));
			setSelectedRequest(null);

			setTimeout(() => {
				setError('');
			}, 2000);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'An error occurred while approving requests';
			setMessageType('error');
			setError(errorMessage);
		} finally {
			setRunning(false);
			setProcessingAction(null);
		}
	};

	const handleDeclineSelected = async () => {
		if (selectedRequests.length === 0) {
			setMessageType('error');
			setError('Please select at least one request to decline');
			return;
		}

		setRunning(true);
		setProcessingAction('decline-selected');
		try {
			await Promise.all(selectedRequests.map((r) => declineRequests(r.id)));

			setMessageType('success');
			setError(`${selectedRequests.length} request(s) declined successfully!`);

			// Remove declined requests from list
			setEditRequests((prev) => prev.filter((r) => !r.selected));
			setSelectedRequest(null);

			setTimeout(() => {
				setError('');
			}, 2000);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'An error occurred while declining requests';
			setMessageType('error');
			setError(errorMessage);
		} finally {
			setRunning(false);
			setProcessingAction(null);
		}
	};

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
			const errorMessage = err instanceof Error ? err.message : 'An error occurred while approving the request';
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
			const errorMessage = err instanceof Error ? err.message : 'An error occurred while declining the request';
			setMessageType('error');
			setError(errorMessage);
		} finally {
			setRunning(false);
			setProcessingAction(null);
		}
	};

	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body">
			<WebSidebar routes={menuRoutes.filter((el) => el.for === 'web' || el.for === 'both').map((data) => data)} onNavigate={onNavigate} />

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
									<div key={name + index} onClick={() => onNavigate(link)} className={`flex gap-3 items-center cursor-pointer p-3 rounded-lg transition-all ${isActive ? 'bg-accent text-primary font-medium' : 'hover:bg-accent hover:text-primary hover:font-medium'}`}>
										<Image source={icon} style={{ width: 24, height: 24 }} resizeMode="contain" />
										<WebNavLink color="primary">{title}</WebNavLink>
									</div>
								);
							})}
						</div>

						<div className="col-span-10">
							<div className="mt-6">
								<h2 className="text-2xl font-ubuntu-medium text-primary">Edit Request</h2>
								<p className="text-base text-tertiary mt-1">Approve or decline edit request made by residents</p>
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
														<input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-5 h-5 cursor-pointer" />
													</th>
													<th className="text-left py-4 px-4 font-inter-regular text-grey text-sm">Name</th>
													<th className="text-left py-4 px-4 font-inter-regular text-grey text-sm">Email Address</th>
													<th className="text-left py-4 px-4 font-inter-regular text-grey text-sm">Phone Number</th>
													<th className="text-left py-4 px-4 font-inter-regular text-grey text-sm">Request Type</th>
													<th className="text-left py-4 px-4 font-inter-regular text-grey text-sm"></th>
												</tr>
											</thead>
											<tbody>
												{editRequests.map((request, index) => (
													<tr key={request.id + index} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-50 transition`}>
														<td className="py-4 px-4">
															<input type="checkbox" checked={request.selected} onChange={() => toggleSelection(request.id)} className="w-5 h-5 cursor-pointer" />
														</td>
														<td className="py-4 px-4">
															<p className="text-primary text-sm font-inter-regular">{request.userName}</p>
														</td>
														<td className="py-4 px-4">
															<p className="text-primary text-sm font-inter-regular">{request.userEmail}</p>
														</td>
														<td className="py-4 px-4">
															<p className="text-primary text-sm font-inter-regular">{request.old_value}</p>
														</td>
														<td className="py-4 px-4">
															<p className="text-primary text-sm font-inter-regular capitalize">{getFieldLabelFromType(request.request_type)}</p>
														</td>
														<td className="py-4 px-4">
															<button onClick={() => handleViewDetails(request)} className="p-2 hover:bg-gray-200 rounded transition" title="View">
																<Image source={icons.expand} style={{ width: 20, height: 20 }} resizeMode="contain" />
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
													{processingAction === 'decline-selected' ? <ActivityIndicator color="#1B998B" size="small" /> : <p className="text-primary text-sm font-semibold">Decline</p>}
												</button>
												<button
													onClick={handleApproveSelected}
													disabled={running || selectedRequests.length === 0}
													className={`bg-primary rounded-md px-24 py-4 flex items-center justify-center ${(running || selectedRequests.length === 0) && 'cursor-not-allowed opacity-50'}`}
												>
													{processingAction === 'approve-selected' ? <ActivityIndicator color="#fff" size="small" /> : <p className="text-white text-sm font-semibold">Approve</p>}
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
											<button onClick={() => setSelectedRequest(null)} className="text-grey hover:text-primary text-3xl">
												×
											</button>
										</div>

										<div className="flex flex-col gap-8">
											<div className="bg-light-grey p-4 rounded-lg border border-grey/50">
												<div className="space-y-4 text-sm">
													<div className="flex items-center gap-7">
														<p className="text-grey font-inter-regular">{getFieldLabelFromType(selectedRequest.request_type)}:</p>
														<p className="text-grey font-inter-regular">{selectedRequest.old_value || 'N/A'}</p>
													</div>
												</div>
											</div>

											<div className="bg-light-teal p-4 rounded-lg border border-teal/40">
												<div className="space-y-4 text-sm">
													<div className="flex items-center gap-7">
														<p className="text-grey font-inter-regular">{getFieldLabelFromType(selectedRequest.request_type)}:</p>
														<p className="text-primary font-inter-regular">{selectedRequest.new_value || 'N/A'}</p>
													</div>
												</div>
											</div>
										</div>

										<div className="flex gap-3 mt-8 pt-6">
											<button onClick={handleDeclineFromModal} disabled={running} className={`flex-1 bg-dark-teal rounded-md px-6 py-3 flex items-center justify-center ${running && 'cursor-not-allowed opacity-75'}`}>
												{processingAction === 'decline-modal' ? <ActivityIndicator color="#fff" size="small" /> : <p className="text-white text-sm font-semibold">Decline</p>}
											</button>
											<button onClick={handleApproveFromModal} disabled={running} className={`flex-1 bg-primary rounded-md px-6 py-3 flex items-center justify-center ${running && 'cursor-not-allowed opacity-75'}`}>
												{processingAction === 'approve-modal' ? <ActivityIndicator color="#fff" size="small" /> : <p className="text-white text-sm font-semibold">Approve</p>}
											</button>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{error && <Modal closeModal={() => setError('')} heading={messageType === 'success' ? 'Success' : 'Error'} message={error} cancelText={'Close'} />}
			</div>
		</div>
	);
}

export default function EditRequestsPage() {
	const { width } = useWindowDimensions();

	const isLargeScreen = width > getWidthBreakpoint();
	return isLargeScreen ? <EditRequestsWeb /> : <EditRequestMobile />;
}
