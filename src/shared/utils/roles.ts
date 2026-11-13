import icons from '@/src/shared/constants/icons';
import { UserRolesType } from '@/src/shared/types/general';

export const getRoleIcon = (role: UserRolesType) => {
  switch (role) {
    case 'resident':
      return icons.adminHomeIcon;
    case 'security':
      return icons.securityIcon;
    case 'primary_admin':
    case 'admin':
      return icons.activeAdminIcon;
    default:
      return icons.adminHomeIcon;
  }
};

export const getRoleIconHeight = (role: UserRolesType): number => {
  switch (role) {
    case 'primary_admin':
    case 'admin':
      return 28;
    default:
      return 28;
  }
};

export const getRoleIconWidth = (role: UserRolesType) => {
  switch (role) {
    case 'primary_admin':
    case 'admin':
      return 23;
    default:
      return 28;
  }
};

export const getRoleColor = (role: UserRolesType) => {
  switch (role) {
    case 'resident':
      return '#FF9A56';
    case 'security':
      return '#1B998B';
    case 'primary_admin':
      return '#333333';
    default:
      return '#333333';
  }
};
