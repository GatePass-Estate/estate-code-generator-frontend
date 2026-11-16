import { ADMIN_ROLES, homeRouteForRole, SECURITY_ROLES, USER_HOME_ROLES } from '../roleRoutes';

describe('homeRouteForRole', () => {
  it('sends security to the scanner home', () => {
    expect(homeRouteForRole('security')).toBe('/security');
  });

  it('sends residents and admins to the user home', () => {
    expect(homeRouteForRole('resident')).toBe('/user');
    expect(homeRouteForRole('admin')).toBe('/user');
    expect(homeRouteForRole('primary_admin')).toBe('/user');
    expect(homeRouteForRole('root')).toBe('/user');
  });

  it('falls back to auth when the role is missing', () => {
    expect(homeRouteForRole(null)).toBe('/auth');
    expect(homeRouteForRole('guest')).toBe('/auth');
  });
});

describe('role allow-lists', () => {
  it('keeps admin and security branches disjoint', () => {
    for (const role of ADMIN_ROLES) {
      expect(SECURITY_ROLES).not.toContain(role);
    }
    expect(USER_HOME_ROLES).toEqual(expect.arrayContaining([...ADMIN_ROLES, 'resident']));
  });
});
