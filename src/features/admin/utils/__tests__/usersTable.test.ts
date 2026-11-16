import { describe, expect, it } from '@jest/globals';
import type { User } from '@/src/features/users/types/user';
import {
  adminActionButtonLabel,
  adminActionHeading,
  adminActionSuccessMessage,
  filterAdminTableUsers,
  isPositiveAdminAction,
  parseAdminTableRoleFilter,
  tableRoleCounts,
  totalTablePages,
} from '@/src/features/admin/utils/usersTable';

const user = (overrides: Partial<User>): User =>
  ({
    first_name: 'Ada',
    last_name: 'Obi',
    email: 'ada@example.com',
    phone_number: '0800',
    home_address: '1 Palm Close',
    role: 'resident',
    status: true,
    ...overrides,
  }) as User;

const users = [
  user({ id: '1' }),
  user({ id: '2', first_name: 'Bayo', role: 'security' }),
  user({ id: '3', first_name: 'Chi', role: 'admin' }),
  user({ id: '4', first_name: 'Dan', role: 'primary_admin' }),
  user({ id: '5', first_name: 'Eze', status: false }),
];
const ids = (list: User[]) => list.map((u) => u.id);

describe('filterAdminTableUsers', () => {
  it('shows verified users of every role by default', () => {
    expect(ids(filterAdminTableUsers(users, '', null))).toEqual(['1', '2', '3', '4']);
  });

  it('filters by role, admins and unverified', () => {
    expect(ids(filterAdminTableUsers(users, '', 'security'))).toEqual(['2']);
    expect(ids(filterAdminTableUsers(users, '', 'admins'))).toEqual(['3', '4']);
    expect(ids(filterAdminTableUsers(users, '', 'unverified'))).toEqual(['5']);
  });

  it('searches name, email, phone and address case-insensitively', () => {
    expect(ids(filterAdminTableUsers(users, '  bAyO ', null))).toEqual(['2']);
    expect(ids(filterAdminTableUsers(users, 'palm', 'unverified'))).toEqual(['5']);
    expect(filterAdminTableUsers(users, 'nobody', null)).toEqual([]);
  });
});

describe('table helpers', () => {
  it('parses the role select', () => {
    expect(parseAdminTableRoleFilter('admins')).toBe('admins');
    expect(parseAdminTableRoleFilter('')).toBeNull();
    expect(parseAdminTableRoleFilter('root')).toBeNull();
  });

  it('counts pages and roles', () => {
    expect(totalTablePages(0, 20)).toBe(1);
    expect(totalTablePages(41, 20)).toBe(3);
    expect(tableRoleCounts({ items: users })).toEqual({ residents: 2, security: 1 });
    expect(
      tableRoleCounts({
        items: users,
        role_summary: { resident: 40, security: 3 },
      } as Parameters<typeof tableRoleCounts>[0])
    ).toEqual({ residents: 40, security: 3 });
  });

  it('labels actions', () => {
    expect(adminActionHeading('deleteUser', false)).toBe('Delete User');
    expect(adminActionHeading('deleteUser', true)).toBe('Error');
    expect(adminActionHeading(null, false)).toBe('Confirmation');
    expect(adminActionButtonLabel('resendVerification')).toBe('Resend');
    expect(adminActionButtonLabel(null)).toBeUndefined();
    expect(isPositiveAdminAction('promote')).toBe(true);
    expect(isPositiveAdminAction('deactivate')).toBe(false);
    expect(adminActionSuccessMessage('promote', 'Ada Obi')).toBe(
      'Ada Obi has been successfully promoted to Admin.'
    );
  });
});
