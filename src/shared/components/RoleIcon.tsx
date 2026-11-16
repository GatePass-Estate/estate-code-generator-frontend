import { Image } from 'react-native';
import icons from '@/src/shared/constants/icons';
import { UserRolesType } from '@/src/shared/types/general';
import AdminHomeSvg from '@/src/assets/icons/admin-home.svg';
import AdminSecuritySvg from '@/src/assets/icons/admin-security.svg';
import { getRoleIconHeight, getRoleIconWidth } from '@/src/shared/utils/roles';

type RoleIconProps = {
  role: UserRolesType;
  width?: number;
  height?: number;
};

/** Lightweight SVG role glyphs (resident / security); admin keeps the existing asset. */
export default function RoleIcon({ role, width, height }: RoleIconProps) {
  const w = width ?? getRoleIconWidth(role);
  const h = height ?? getRoleIconHeight(role);

  if (role === 'resident') {
    return <AdminHomeSvg width={w} height={h} />;
  }
  if (role === 'security') {
    return <AdminSecuritySvg width={w} height={h} />;
  }

  return (
    <Image source={icons.activeAdminIcon} style={{ width: w, height: h }} resizeMode="contain" />
  );
}
