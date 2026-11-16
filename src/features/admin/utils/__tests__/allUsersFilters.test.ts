import { describe, expect, it } from '@jest/globals';
import {
  roleFiltersFromParam,
  toggleRoleFilter,
  toggleValidationStatus,
} from '@/src/features/admin/utils/allUsersFilters';

describe('All Users filters', () => {
  it('reads the role route param', () => {
    expect(roleFiltersFromParam('security')).toEqual(['security']);
    expect(roleFiltersFromParam('all')).toEqual([]);
    expect(roleFiltersFromParam(undefined)).toBeNull();
    expect(roleFiltersFromParam('root')).toBeNull();
  });

  it('toggles role chips and clears on All Users', () => {
    expect(toggleRoleFilter([], 'resident')).toEqual(['resident']);
    expect(toggleRoleFilter(['resident', 'admins'], 'resident')).toEqual(['admins']);
    expect(toggleRoleFilter(['resident'], null)).toEqual([]);
  });

  it('toggles validation chips', () => {
    expect(toggleValidationStatus([], true)).toEqual([true]);
    expect(toggleValidationStatus([true, false], true)).toEqual([false]);
  });
});
