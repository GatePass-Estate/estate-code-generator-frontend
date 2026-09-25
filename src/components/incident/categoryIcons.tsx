import type { ComponentType } from 'react';

import {
  IncidentAccessControlFilledIcon,
  IncidentAccessControlOutlineIcon,
  IncidentDisputeFilledIcon,
  IncidentDisputeOutlineIcon,
  IncidentFireSafetyFilledIcon,
  IncidentFireSafetyOutlineIcon,
  IncidentHarassmentFilledIcon,
  IncidentHarassmentOutlineIcon,
  IncidentMaintenanceFilledIcon,
  IncidentMaintenanceOutlineIcon,
  IncidentMedicalEmergencyFilledIcon,
  IncidentMedicalEmergencyOutlineIcon,
  IncidentNoiseDisturbanceFilledIcon,
  IncidentNoiseDisturbanceOutlineIcon,
  IncidentOtherFilledIcon,
  IncidentOtherOutlineIcon,
  IncidentPropertyDamageFilledIcon,
  IncidentPropertyDamageOutlineIcon,
  IncidentSecurityFilledIcon,
  IncidentSecurityOutlineIcon,
  IncidentTheftFilledIcon,
  IncidentTheftOutlineIcon,
  IncidentUnauthorizedAccessFilledIcon,
  IncidentUnauthorizedAccessOutlineIcon,
} from './incidentCategorySvgIcons';

/**
 * OpenAPI `IncidentCategory` enum — maps 1:1 to Figma category icons (6792:103*).
 * Path data inlined from Figma (outline = inactive, filled = active).
 */
export const INCIDENT_API_CATEGORIES = [
  'security',
  'access_control',
  'noise_disturbance',
  'property_damage',
  'maintenance',
  'fire_safety',
  'medical_emergency',
  'theft',
  'harassment',
  'dispute',
  'unauthorized_access',
  'other',
] as const;

export type IncidentApiCategory = (typeof INCIDENT_API_CATEGORIES)[number];

export const INCIDENT_API_CATEGORY_LABELS: Record<IncidentApiCategory, string> = {
  security: 'Security',
  access_control: 'Access Control',
  noise_disturbance: 'Noise Disturbance',
  property_damage: 'Property Damage',
  maintenance: 'Maintenance',
  fire_safety: 'Fire Safety',
  medical_emergency: 'Medical Emergency',
  theft: 'Theft',
  harassment: 'Harassment',
  dispute: 'Dispute',
  unauthorized_access: 'Unauthorized Access',
  other: 'Other',
};

type CategoryIconProps = { color?: string; size?: number };
type SvgIcon = ComponentType<CategoryIconProps>;

const ICON_SVGS: Record<IncidentApiCategory, { outline: SvgIcon; filled: SvgIcon }> = {
  security: { outline: IncidentSecurityOutlineIcon, filled: IncidentSecurityFilledIcon },
  access_control: {
    outline: IncidentAccessControlOutlineIcon,
    filled: IncidentAccessControlFilledIcon,
  },
  noise_disturbance: {
    outline: IncidentNoiseDisturbanceOutlineIcon,
    filled: IncidentNoiseDisturbanceFilledIcon,
  },
  property_damage: {
    outline: IncidentPropertyDamageOutlineIcon,
    filled: IncidentPropertyDamageFilledIcon,
  },
  maintenance: { outline: IncidentMaintenanceOutlineIcon, filled: IncidentMaintenanceFilledIcon },
  fire_safety: { outline: IncidentFireSafetyOutlineIcon, filled: IncidentFireSafetyFilledIcon },
  medical_emergency: {
    outline: IncidentMedicalEmergencyOutlineIcon,
    filled: IncidentMedicalEmergencyFilledIcon,
  },
  theft: { outline: IncidentTheftOutlineIcon, filled: IncidentTheftFilledIcon },
  harassment: { outline: IncidentHarassmentOutlineIcon, filled: IncidentHarassmentFilledIcon },
  dispute: { outline: IncidentDisputeOutlineIcon, filled: IncidentDisputeFilledIcon },
  unauthorized_access: {
    outline: IncidentUnauthorizedAccessOutlineIcon,
    filled: IncidentUnauthorizedAccessFilledIcon,
  },
  other: { outline: IncidentOtherOutlineIcon, filled: IncidentOtherFilledIcon },
};

/** Normalize API / free-text category to a known slug. */
export function resolveApiCategory(raw?: string | null): IncidentApiCategory {
  if (!raw) return 'other';
  const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
  if ((INCIDENT_API_CATEGORIES as readonly string[]).includes(key)) {
    return key as IncidentApiCategory;
  }
  if (key === 'others' || key === 'custom') return 'other';
  if (key === 'medical') return 'medical_emergency';
  if (key === 'property') return 'property_damage';
  if (key === 'noise') return 'noise_disturbance';
  if (key === 'fire') return 'fire_safety';
  if (key === 'access') return 'access_control';
  return 'other';
}

export function formatApiCategoryLabel(raw: string): string {
  const resolved = resolveApiCategory(raw);
  if (resolved !== 'other' || INCIDENT_API_CATEGORIES.includes(raw as IncidentApiCategory)) {
    return INCIDENT_API_CATEGORY_LABELS[resolved];
  }
  return raw
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

type IncidentCategoryIconProps = {
  category: string;
  color?: string;
  size?: number;
  /** Prefer filled glyph (active / on dark bubble). */
  filled?: boolean;
};

/** Renders Figma SVG path icons — outline inactive, filled active. */
export function IncidentCategoryIcon({
  category,
  color = '#113E55',
  size = 24,
  filled = false,
}: IncidentCategoryIconProps) {
  const slug = resolveApiCategory(category);
  const Comp = filled ? ICON_SVGS[slug].filled : ICON_SVGS[slug].outline;
  return <Comp size={size} color={color} />;
}
