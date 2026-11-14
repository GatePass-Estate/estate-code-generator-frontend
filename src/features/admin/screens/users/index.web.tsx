import AllUsersMobile from './index.native';

/**
 * Desktop used to render fake placeholder users (STB-03). The native All Users
 * screen is the real paginated list — reuse it on every breakpoint.
 */
export default function AdminAllUsersPage() {
  return <AllUsersMobile />;
}
