import WebSidebar from '@/src/features/dashboard/components/WebSidebar';
import { Href, router, usePathname } from 'expo-router';
import { adminRoutes, menuRoutes } from '@/src/features/dashboard/components/menuRoutes';
import { useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import icons from '@/src/shared/constants/icons';
import { Pagination } from '@/src/shared/components/Pagination';
import { Image, Platform, useWindowDimensions } from 'react-native';
import {
  getRoleIconHeight,
  getRoleIconWidth,
  getWidthBreakpoint,
} from '@/src/shared/utils/helpers';
import RoleIcon from '@/src/shared/components/RoleIcon';
import AdminHomeSvg from '@/src/assets/icons/admin-home.svg';
import AdminSecuritySvg from '@/src/assets/icons/admin-security.svg';
import WebNavLink from '@/src/shared/components/navigation/WebNavLink';
import Modal from '@/src/shared/components/feedback/Modal';
import AdminUsersMobilePage from './index.native';
import { useAdminUsersTable } from '@/src/features/admin/hooks/useAdminUsersTable';
import { canChangeAdminRole } from '@/src/features/admin/utils/roleChange';
import {
  adminActionButtonLabel,
  isPositiveAdminAction,
  parseAdminTableRoleFilter,
} from '@/src/features/admin/utils/usersTable';

function AdminUsersPageWeb() {
  const {
    viewerRole,
    users,
    loading,
    searchLoading,
    isSearching,
    searchQuery,
    setSearchQuery,
    selectedRole,
    setSelectedRole,
    filteredUsers,
    residentsCount,
    securityCount,
    currentPage,
    totalPages,
    goToPage,
    modalState,
    closeModal,
    handleConfirmAction,
    processing,
    promoteUser: promteUserToAdmin,
    demoteUser: demoteAdminToUser,
    deactivate: deativateUser,
    resendEmail,
    deleteAccount,
  } = useAdminUsersTable();

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Admin Access - GatePass';
  }, []);

  const pathname = usePathname();

  function onNavigate(route: Href): void {
    router.push(route);
  }

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      <WebSidebar
        routes={menuRoutes
          .filter((el) => el.for === 'web' || el.for === 'both')
          .map((data) => data)}
        onNavigate={onNavigate}
      />

      <div className="web-body">
        <div className="mt-20 mb-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-5xl font-ubuntu-regular text-grey">Admin Access</h1>
          </div>

          <div className="grid grid-cols-4 gap-8 md:grid-cols-12 mb-10">
            <div className="flex flex-col gap-5 w-full col-span-2">
              {adminRoutes.map(({ name, title, link, icon, disabled }, index) => {
                const isActive = pathname === link;

                return (
                  <div
                    key={index}
                    onClick={() => !disabled && onNavigate(link)}
                    className={`flex gap-3 items-center p-3 rounded-lg transition-all ${
                      disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : isActive
                          ? 'bg-accent text-primary font-medium cursor-pointer'
                          : 'hover:bg-accent hover:text-primary hover:font-medium cursor-pointer'
                    }`}
                  >
                    <Image source={icon} style={{ width: 24, height: 24 }} resizeMode="contain" />
                    <WebNavLink color="primary">{title}</WebNavLink>
                  </div>
                );
              })}
            </div>

            <div className="col-span-10">
              <div className="grid grid-cols-12 gap-4 mb-8">
                <div className="border border-orange rounded-xl p-6 bg-orange/5 flex items-center gap-4 col-span-1 md:col-span-4">
                  <AdminHomeSvg width={65} height={60} />
                  <div>
                    <p className="text-grey text-2xl font-ubuntu-regular">Residents</p>
                    <p className="text-orange text-5xl font-ubuntu-bold">{residentsCount}</p>
                  </div>
                </div>

                <div className="border border-teal rounded-xl p-4 bg-teal/5 flex items-center gap-4 col-span-1 md:col-span-4">
                  <AdminSecuritySvg width={60} height={60} />

                  <div>
                    <p className="text-grey text-2xl font-ubuntu-regular">Security Personnels</p>
                    <p className="text-teal text-5xl font-ubuntu-bold">{securityCount}</p>
                  </div>
                </div>

                <div className="border border-primary rounded-xl p-6 flex items-center justify-center col-span-1 md:col-span-2">
                  <div className="text-center">
                    <p className="text-grey text-2xl font-ubuntu-regular uppercase tracking-wide">
                      Total
                    </p>
                    <p className="text-primary text-5xl font-ubuntu-bold">{users.total}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center col-span-1 md:col-span-2">
                  <button
                    className="bg-grey/5 rounded-full p-4"
                    onClick={() => router.push('/admin/users/add')}
                  >
                    <Image
                      source={icons.plus}
                      className="opacity-80"
                      style={{ width: 30, height: 30 }}
                    />
                  </button>
                </div>
              </div>
              {/* Search and Filter Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-ubuntu-regular text-grey mb-4">All Users</h2>
                <div className="flex gap-4 items-end">
                  <div className="flex flex-1 gap-0">
                    <div className="flex gap-2 w-full px-4 py-3 rounded-lg bg-light-grey focus-within:ring-1 focus-within:ring-primary focus-within:bg-white transition-all rounded-r-none">
                      <Image
                        source={icons.webSearch}
                        style={{ width: 20, height: 20 }}
                        resizeMode="contain"
                      />
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
                    <button className="bg-primary text-white px-3 py-3 rounded-lg font-medium hover:opacity-90 transition rounded-l-none">
                      Go
                    </button>
                    <div className="relative">
                      <select
                        value={selectedRole || ''}
                        onChange={(e) => setSelectedRole(parseAdminTableRoleFilter(e.target.value))}
                        className="appearance-none flex items-center gap-2 px-6 py-3 pr-10 rounded-lg hover:bg-primary/5 transition bg-light-grey focus:outline-none text-primary cursor-pointer font-inter-regular"
                      >
                        <option value="">All Verified</option>
                        <option value="resident">Residents</option>
                        <option value="security">Security</option>
                        <option value="admins">Admins</option>
                        <option value="unverified">Unverified</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4">
                        <Image
                          source={icons.filter}
                          style={{ width: 16, height: 16 }}
                          resizeMode="contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {loading || searchLoading ? (
                <div className="flex justify-center items-center py-12">
                  <p className="text-grey">Loading users...</p>
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border border-gray-200 rounded-3xl">
                        <th className="text-left py-4 px-4 font-inter-regular text-grey text-sm">
                          Type
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
                          Address
                        </th>
                        <th className="text-left py-4 px-4 font-inter-regular text-grey text-sm">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, index) => (
                        <tr
                          key={user.id}
                          className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-50 transition`}
                        >
                          <td className="p-4">
                            <RoleIcon
                              role={user.role}
                              width={getRoleIconWidth(user.role)}
                              height={getRoleIconHeight(user.role)}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-primary text-sm font-inter-regular">{`${user.first_name} ${user.last_name}`}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-primary text-sm font-inter-regular">{user.email}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-primary text-sm font-inter-regular">
                              {user.phone_number}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-primary text-sm font-inter-regular">
                              {user.home_address}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              {user.status ? (
                                <>
                                  {!canChangeAdminRole(viewerRole, user.role) ? (
                                    <button
                                      className="p-2 border-r-2 border-transparent opacity-0 pointer-events-none"
                                      disabled
                                    >
                                      <div style={{ width: 20, height: 20 }} />
                                    </button>
                                  ) : user.role === 'resident' ? (
                                    <button
                                      onClick={() =>
                                        promteUserToAdmin(
                                          user.id!,
                                          user.first_name || '',
                                          user.last_name || ''
                                        )
                                      }
                                      className="p-2 hover:bg-gray-200 transition border-r-2 border-grey"
                                      title="Make Admin"
                                    >
                                      <Image
                                        source={icons.userIcon}
                                        style={{ width: 20, height: 20, tintColor: '#113E55' }}
                                        resizeMode="contain"
                                      />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        demoteAdminToUser(
                                          user.id!,
                                          user.first_name || '',
                                          user.last_name || '',
                                          user.role!
                                        )
                                      }
                                      className="p-2 hover:bg-gray-200 transition border-r-2 border-grey"
                                      title="Make Resident"
                                    >
                                      <Image
                                        source={icons.activeGuestIcon}
                                        style={{ width: 20, height: 20, tintColor: '#113E55' }}
                                        resizeMode="contain"
                                      />
                                    </button>
                                  )}

                                  <button
                                    className="p-2 hover:bg-gray-200 transition"
                                    title="Deactivate User"
                                    onClick={() =>
                                      deativateUser(
                                        user.id!,
                                        user.first_name || '',
                                        user.last_name || ''
                                      )
                                    }
                                  >
                                    <Image
                                      source={icons.userEdit}
                                      style={{ width: 20, height: 20, tintColor: '#113E55' }}
                                      resizeMode="contain"
                                    />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="p-2 hover:bg-gray-200 transition border-r-2 border-grey"
                                    title="Resend Email"
                                    onClick={() =>
                                      resendEmail(
                                        user.id!,
                                        user.first_name || '',
                                        user.last_name || ''
                                      )
                                    }
                                  >
                                    <Feather name="mail" size={20} color="#113E55" />
                                  </button>
                                  <button
                                    className="p-2 hover:bg-gray-200 transition"
                                    title="Delete User"
                                    onClick={() =>
                                      deleteAccount(
                                        user.id!,
                                        user.first_name || '',
                                        user.last_name || ''
                                      )
                                    }
                                  >
                                    <Feather name="trash-2" size={20} color="#113E55" />
                                  </button>
                                </>
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
              {!isSearching && filteredUsers.length > 0 && (
                <div className="flex justify-end mt-8 mb-5">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                    condition={loading}
                  />
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
          actionText={adminActionButtonLabel(modalState.actionType)}
          actionBtnClassName={
            isPositiveAdminAction(modalState.actionType)
              ? 'bg-primary hover:bg-primary/90'
              : 'bg-red-600 hover:bg-red-700'
          }
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
