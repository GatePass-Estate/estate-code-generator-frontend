import WebSidebar from '@/src/components/web/WebSidebar';
import { router, usePathname } from 'expo-router';
import { menuRoutes } from '../user/_layout';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Feather } from '@expo/vector-icons';
import { getAllEstateUsers, promoteToAdmin, demoteToResident, resendEmailVerification, deleteUser } from '@/src/lib/api/user';
import { AllUsers } from '@/src/types/user';
import { UserRolesType } from '@/src/types/general';
import icons from '@/src/constants/icons';
import { Pagination } from '@/src/components/web/Pagination';
import { Image, Platform, useWindowDimensions } from 'react-native';
import { getRoleIcon, getRoleIconHeight, getRoleIconWidth, getWidthBreakpoint, isDataEqual } from '@/src/lib/helpers';
import { adminRoutes } from './_layout';
import WebNavLink from '@/src/components/web/WebNavLink';
import { useUserStore } from '@/src/lib/stores/userStore';
import Modal from '@/src/components/web/Modal';
import AdminUsersMobilePage from './index.native';

const USERS_PAGE_SIZE = 20;

function AdminUsersPageWeb() {
	const [users, setUsers] = useState<AllUsers>({ total: 0, page: 1, limit: USERS_PAGE_SIZE, items: [] });
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedRole, setSelectedRole] = useState<UserRolesType | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [modalState, setModalState] = useState<{
		isOpen: boolean;
		message: string;
		heading: string;
		actionType: 'promote' | 'demote' | 'deactivate' | 'reactivate' | 'resendVerification' | 'deleteUser' | null;
		userId: string | null;
		userName: string;
		isError: boolean;
	}>({
		isOpen: false,
		message: '',
		heading: '',
		actionType: null,
		userId: null,
		userName: '',
		isError: false,
	});
	const [processing, setProcessing] = useState(false);
	const myId = useUserStore.getState().user_id;
	const usersRef = useRef<AllUsers>(users);

	// Keep ref in sync with state
	useEffect(() => {
		usersRef.current = users;
	}, [users]);

	useEffect(() => {
		if (Platform.OS === 'web') document.title = 'Admin Access - GatePass';
	}, []);

	const fetchUsers = async (page: number = 1, showLoading = true) => {
		if (showLoading) setLoading(true);
		try {
			const data = await getAllEstateUsers(page, USERS_PAGE_SIZE);
			if (!isDataEqual(data, usersRef.current)) {
				setUsers(data);
				setCurrentPage(page);
			}
		} catch (error) {
			console.error('Error fetching users:', error);
		} finally {
			if (showLoading) setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	useEffect(() => {
		const intervalId = setInterval(() => {
			fetchUsers(currentPage, false);
		}, 30000);

		return () => clearInterval(intervalId);
	}, [currentPage]);

	const filteredUsers = useMemo(() => {
		return users.items.filter((user) => {
			const matchesSearch =
				`${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.phone_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.home_address?.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesRole = !selectedRole || user.role === selectedRole;

			return matchesSearch && matchesRole;
		});
	}, [users.items, searchQuery, selectedRole]);

	const totalPages = users.total > 0 ? Math.ceil(users.total / USERS_PAGE_SIZE) : 1;

	const residentsCount = users?.role_summary?.resident || users.items.filter((user) => user.role === 'resident').length;
	const securityCount = users?.role_summary?.security || users.items.filter((user) => user.role === 'security').length;

	useEffect(() => {
		if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages));
	}, [totalPages, currentPage]);

	const pathname = usePathname();

	function onNavigate(route: string): void {
		router.push(route as any);
	}

	const closeModal = () => {
		setModalState({
			isOpen: false,
			message: '',
			heading: '',
			actionType: null,
			userId: null,
			userName: '',
			isError: false,
		});
	};

	const showModal = (message: string, actionType: 'promote' | 'demote' | 'deactivate' | 'reactivate' | 'resendVerification' | 'deleteUser' | null = null, userId: string | null = null, userName: string = '', isError: boolean = false) => {
		let heading = 'Confirmation';
		if (isError) {
			heading = 'Error';
		} else if (actionType === 'promote') {
			heading = 'Promote User';
		} else if (actionType === 'demote') {
			heading = 'Demote Admin';
		} else if (actionType === 'deactivate') {
			heading = 'Deactivate User';
		} else if (actionType === 'reactivate') {
			heading = 'Reactivate User';
		} else if (actionType === 'resendVerification') {
			heading = 'Resend Verification Email';
		} else if (actionType === 'deleteUser') {
			heading = 'Delete User';
		}

		setModalState({
			isOpen: true,
			message,
			heading,
			actionType: isError ? null : actionType,
			userId: isError ? null : userId,
			userName: isError ? '' : userName,
			isError,
		});
	};

	const handleConfirmAction = async () => {
		if (!modalState.actionType || !modalState.userId) return;

		setProcessing(true);
		try {
			let successMessage = '';

			if (modalState.actionType === 'promote') {
				await promoteToAdmin(modalState.userId);
				successMessage = `${modalState.userName} has been successfully promoted to Admin.`;
			} else if (modalState.actionType === 'demote') {
				await demoteToResident(modalState.userId);
				successMessage = `${modalState.userName} has been successfully demoted to Resident.`;
			} else if (modalState.actionType === 'deactivate') {
				successMessage = 'User has been successfully deactivated.';
				console.log('Deactivate action for user:', modalState.userId);
			} else if (modalState.actionType === 'reactivate') {
				successMessage = 'User has been successfully reactivated.';
				console.log('Reactivate action for user:', modalState.userId);
			} else if (modalState.actionType === 'resendVerification') {
				await resendEmailVerification(modalState.userId);
				successMessage = `Verification email has been resent to ${modalState.userName}.`;
			} else if (modalState.actionType === 'deleteUser') {
				await deleteUser(modalState.userId);
				successMessage = `${modalState.userName} has been successfully deleted.`;
			}

			setModalState({
				isOpen: true,
				message: successMessage,
				heading: 'Success',
				actionType: modalState.actionType,
				userId: null,
				userName: '',
				isError: false,
			});

			setTimeout(() => {
				closeModal();
				fetchUsers();
			}, 1500);
		} catch (err: any) {
			const errorMessage = err?.message || 'Failed to complete action';
			showModal(errorMessage, null, null, '', true);
		} finally {
			setProcessing(false);
		}
	};

	const promteUserToAdmin = (userId: string, firstName: string, lastName: string) => {
		const userName = `${firstName} ${lastName}`.trim();
		if (userId === myId) {
			showModal('You cannot promote yourself to admin.', null, null, '', true);
			return;
		}

		showModal('Are you sure you want to promote this user to admin?', 'promote', userId, userName);
	};

	const demoteAdminToUser = (userId: string, firstName: string, lastName: string, userRole: UserRolesType) => {
		const userName = `${firstName} ${lastName}`.trim();
		console.log(userId, myId);

		if (userId === myId) {
			showModal('You cannot demote yourself from admin.', null, null, '', true);
			return;
		}

		if (userRole === 'primary_admin') {
			showModal('You cannot demote the primary admin.', null, null, '', true);
			return;
		}

		showModal('Are you sure you want to demote this admin?', 'demote', userId, userName);
	};

	const deativateUser = (userId: string, firstName: string, lastName: string) => {
		const userName = `${firstName} ${lastName}`.trim();
		if (userId === myId) {
			showModal('You cannot deactivate your own account.', null, null, '', true);
			return;
		}
		showModal('Are you sure you want to deactivate this user?', 'deactivate', userId, userName);
	};

	const reactivateUser = (userId: string, firstName: string, lastName: string) => {
		const userName = `${firstName} ${lastName}`.trim();
		if (userId === myId) {
			showModal('You cannot reactivate your own account.', null, null, '', true);
			return;
		}
		showModal('Are you sure you want to reactivate this user?', 'reactivate', userId, userName);
	};

	const resendEmail = (userId: string, firstName: string, lastName: string) => {
		const userName = `${firstName} ${lastName}`.trim();
		showModal('Are you sure you want to resend the verification email to this user?', 'resendVerification', userId, userName);
	};

	const deleteAccount = (userId: string, firstName: string, lastName: string) => {
		const userName = `${firstName} ${lastName}`.trim();
		if (userId === myId) {
			showModal('You cannot delete your own account.', null, null, '', true);
			return;
		}
		showModal('Are you sure you want to permanently delete this user?', 'deleteUser', userId, userName);
	};

	return (
		<div className="flex h-full w-screen overflow-y-scroll bg-body">
			<WebSidebar routes={menuRoutes.filter((el) => el.for === 'web' || el.for === 'both').map((data) => data)} onNavigate={onNavigate} />

			<div className="web-body">
				<div className="mt-20 mb-10">
					<div className="flex items-center justify-between mb-8">
						<h1 className="text-5xl font-ubuntu-regular text-grey">Admin Access</h1>
					</div>

					<div className="grid grid-cols-4 gap-8 md:grid-cols-12 mb-10">
						<div className="flex flex-col gap-5 w-full col-span-2">
							{adminRoutes.map(({ name, title, link, icon }, index) => {
								const isActive = pathname === link;

								return (
									<div key={index} onClick={() => onNavigate(link)} className={`flex gap-3 items-center cursor-pointer p-3 rounded-lg transition-all ${isActive ? 'bg-accent text-primary font-medium' : 'hover:bg-accent hover:text-primary hover:font-medium'}`}>
										<Image source={icon} style={{ width: 24, height: 24 }} resizeMode="contain" />
										<WebNavLink color="primary">{title}</WebNavLink>
									</div>
								);
							})}
						</div>

						<div className="col-span-10">
							<div className="grid grid-cols-12 gap-4 mb-8">
								<div className="border border-orange rounded-xl p-6 bg-orange/5 flex items-center gap-4 col-span-1 md:col-span-4">
									<Image source={icons.adminHomeIcon} style={{ width: 65, height: 60 }} />
									<div>
										<p className="text-grey text-2xl font-ubuntu-regular">Residents</p>
										<p className="text-orange text-5xl font-ubuntu-bold">{residentsCount}</p>
									</div>
								</div>

								<div className="border border-teal rounded-xl p-4 bg-teal/5 flex items-center gap-4 col-span-1 md:col-span-4">
									<Image source={icons.securityIcon} style={{ width: 60, height: 60 }} />

									<div>
										<p className="text-grey text-2xl font-ubuntu-regular">Security Personnels</p>
										<p className="text-teal text-5xl font-ubuntu-bold">{securityCount}</p>
									</div>
								</div>

								<div className="border border-primary rounded-xl p-6 flex items-center justify-center col-span-1 md:col-span-2">
									<div className="text-center">
										<p className="text-grey text-2xl font-ubuntu-regular uppercase tracking-wide">Total</p>
										<p className="text-primary text-5xl font-ubuntu-bold">{users.total}</p>
									</div>
								</div>

								<div className="flex items-center justify-center col-span-1 md:col-span-2">
									<button className="bg-grey/5 rounded-full p-4" onClick={() => router.push('/admin/users/add')}>
										<Image source={icons.plus} className="opacity-80" style={{ width: 30, height: 30 }} />
									</button>
								</div>
							</div>
							{/* Search and Filter Section */}
							<div className="mb-8">
								<h2 className="text-2xl font-ubuntu-regular text-grey mb-4">All Users</h2>
								<div className="flex gap-4 items-end">
									<div className="flex flex-1 gap-0">
										<div className="flex gap-2 w-full px-4 py-3 rounded-lg bg-light-grey focus-within:ring-1 focus-within:ring-primary focus-within:bg-white transition-all rounded-r-none">
											<Image source={icons.webSearch} style={{ width: 20, height: 20 }} resizeMode="contain" />
											<input
												type="text"
												placeholder="Search User List"
												value={searchQuery}
												onChange={(e) => {
													setSearchQuery(e.target.value);
												}}
												className="flex-1 focus:outline-none bg-transparent"
											/>
										</div>
										<button className="bg-primary text-white px-3 py-3 rounded-lg font-medium hover:opacity-90 transition rounded-l-none">Go</button>
										<button
											onClick={() => {
												setSelectedRole(selectedRole ? null : 'resident');
											}}
											className="flex items-center gap-2 px-6 py-3 rounded-lg hover:bg-primary/5 transition"
										>
											<Image source={icons.filter} style={{ width: 20, height: 20 }} resizeMode="contain" />
											Filter
										</button>
									</div>
								</div>
							</div>
							{loading ? (
								<div className="flex justify-center items-center py-12">
									<p className="text-grey">Loading users...</p>
								</div>
							) : filteredUsers.length > 0 ? (
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="border border-gray-200 rounded-3xl">
												<th className="text-left py-4 px-4 font-inter-regular text-grey text-sm">Type</th>
												<th className="text-left py-4 px-4 font-inter-regular text-grey text-sm">Name</th>
												<th className="text-left py-4 px-4 font-inter-regular text-grey text-sm">Email Address</th>
												<th className="text-left py-4 px-4 font-inter-regular text-grey text-sm">Phone Number</th>
												<th className="text-left py-4 px-4 font-inter-regular text-grey text-sm">Address</th>
												<th className="text-left py-4 px-4 font-inter-regular text-grey text-sm">Action</th>
											</tr>
										</thead>
										<tbody>
											{filteredUsers.map((user, index) => (
												<tr key={user.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-50 transition`}>
													<td className="p-4">
														<Image source={getRoleIcon(user.role)} style={{ width: getRoleIconWidth(user.role), height: getRoleIconHeight(user.role) }} resizeMode="contain" />
													</td>
													<td className="py-4 px-4">
														<p className="text-primary text-sm font-inter-regular">{`${user.first_name} ${user.last_name}`}</p>
													</td>
													<td className="py-4 px-4">
														<p className="text-primary text-sm font-inter-regular">{user.email}</p>
													</td>
													<td className="py-4 px-4">
														<p className="text-primary text-sm font-inter-regular">{user.phone_number}</p>
													</td>
													<td className="py-4 px-4">
														<p className="text-primary text-sm font-inter-regular">{user.home_address}</p>
													</td>
													<td className="py-4 px-4">
														<div className={`flex ${user.role === 'security' && 'justify-end'}`}>
															{user.role === 'security' ? (
																<></>
															) : !['admin', 'primary_admin'].includes(user.role!) ? (
																<button onClick={() => promteUserToAdmin(user.id!, user.first_name || '', user.last_name || '')} className="p-2 hover:bg-gray-200 transition border-r-2 border-grey" title="Make Admin">
																	<Image source={icons.userIcon} style={{ width: 20, height: 20 }} resizeMode="contain" />
																</button>
															) : (
																<button onClick={() => demoteAdminToUser(user.id!, user.first_name || '', user.last_name || '', user.role!)} className="p-2 hover:bg-gray-200 transition border-r-2 border-grey" title="Make Resident">
																	<Image source={icons.activeGuestIcon} style={{ width: 20, height: 20, opacity: 0.5 }} resizeMode="contain" />
																</button>
															)}

															{user.status ? (
																<button className="p-2 hover:bg-gray-200 transition" title="Deactivate User" onClick={() => deativateUser(user.id!, user.first_name || '', user.last_name || '')}>
																	<Image source={icons.userEdit} style={{ width: 20, height: 20 }} resizeMode="contain" />
																</button>
															) : (
																<button className="p-2 hover:bg-gray-200 transition" title="Reactivate User" onClick={() => reactivateUser(user.id!, user.first_name || '', user.last_name || '')}>
																	<Image source={icons.addUser} style={{ width: 20, height: 20 }} resizeMode="contain" />
																</button>
															)}
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<div className="flex justify-center items-center py-12">
									<p className="text-grey">No users found</p>
								</div>
							)}
							{/* Pagination */}
							{filteredUsers.length > 0 && (
								<div className="flex justify-end mt-8 mb-5">
									<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => fetchUsers(page)} condition={loading} />
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{modalState.isOpen && (
				<Modal
					closeModal={closeModal}
					heading={modalState.heading}
					message={modalState.message}
					cancelText={modalState.isError ? 'Close' : 'Cancel'}
					action={modalState.isError ? undefined : handleConfirmAction}
					actionText={modalState.actionType === 'promote' ? 'Promote' : modalState.actionType === 'demote' ? 'Demote' : modalState.actionType === 'deactivate' ? 'Deactivate' : modalState.actionType === 'reactivate' ? 'Reactivate' : modalState.actionType === 'resendVerification' ? 'Resend' : modalState.actionType === 'deleteUser' ? 'Delete' : undefined}
					actionBtnClassName={['promote', 'reactivate', 'resendVerification'].includes(modalState.actionType || '') ? 'bg-primary hover:bg-primary/90' : 'bg-red-600 hover:bg-red-700'}
					actionRunnig={processing}
					runningText="Processing..."
					btnDisabled={processing}
				/>
			)}
		</div>
	);
}

export default function AdminUsersPage() {
	const { width } = useWindowDimensions();

	const isLargeScreen = width > getWidthBreakpoint();
	return isLargeScreen ? <AdminUsersPageWeb /> : <AdminUsersMobilePage />;
}
