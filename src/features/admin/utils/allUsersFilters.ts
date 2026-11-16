import type { EstateUserRoleFilter } from '@/src/features/users/hooks/estateUsers';

/** Role chips preselected from the `role` route param (`all` / unknown = none). */
export function roleFiltersFromParam(role: string | undefined): EstateUserRoleFilter[] | null {
  if (role === 'resident' || role === 'security' || role === 'admins') return [role];
  if (role === 'all') return [];
  return null;
}

/** Tapping a role chip: `null` ("All Users") clears, otherwise the chip toggles. */
export function toggleRoleFilter(
  current: readonly EstateUserRoleFilter[],
  value: EstateUserRoleFilter | null
): EstateUserRoleFilter[] {
  if (value === null) return [];
  return current.includes(value)
    ? current.filter((filter) => filter !== value)
    : [...current, value];
}

/** Validated / Non Validated chips toggle independently. */
export function toggleValidationStatus(current: readonly boolean[], value: boolean): boolean[] {
  return current.includes(value)
    ? current.filter((status) => status !== value)
    : [...current, value];
}
