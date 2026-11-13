import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const exts = ['.ts', '.tsx', '.js', '.jsx', '.native.tsx', '.web.tsx', '.ios.tsx', '.android.tsx'];

const exact = {
  'lib/queryClient.ts': 'src/shared/services/api/queryClient.ts',
  'src/api/client.ts': 'src/shared/services/api/client.ts',
  'src/api/errors.ts': 'src/shared/services/api/errors.ts',
  'src/api/queryKeys.ts': 'src/shared/services/api/queryKeys.ts',
  'src/api/__tests__/errors.test.ts': 'src/shared/services/api/__tests__/errors.test.ts',
  'src/api/guests.ts': 'src/features/visitors/services/guests.ts',
  'src/api/__tests__/guests.test.ts': 'src/features/visitors/services/__tests__/guests.test.ts',
  'src/api/codes.ts': 'src/features/access-codes/services/codes.ts',
  'src/api/accessLogs.ts': 'src/features/history/services/accessLogs.ts',
  'src/api/auth.ts': 'src/features/auth/services/auth.ts',
  'src/api/user.ts': 'src/features/users/services/user.ts',
  'src/api/userDocuments.ts': 'src/features/profile/services/userDocuments.ts',
  'src/api/requests.ts': 'src/features/admin/services/requests.ts',
  'src/api/households.ts': 'src/features/admin/services/households.ts',
  'src/api/estate.ts': 'src/features/admin/services/estate.ts',
  'src/api/billing.ts': 'src/features/billing/services/billing.ts',
  'src/api/entitlements.ts': 'src/features/billing/services/entitlements.ts',
  'src/api/incidentManagement.ts': 'src/features/incidents/services/incidentManagement.ts',
  'src/api/incidentReports.ts': 'src/features/incidents/services/incidentReports.ts',
  'src/api/anomaly.ts': 'src/features/anomaly/services/anomaly.ts',
  'src/api/aiMarketplace.ts': 'src/features/marketplace/services/aiMarketplace.ts',
  'src/api/broadcast.ts': 'src/features/notifications/services/broadcast.ts',
  'src/api/notifications.ts': 'src/features/notifications/services/notifications.ts',
  'src/api/help.ts': 'src/features/support/services/help.ts',
  'src/state/queries/guests.ts': 'src/features/visitors/hooks/guests.ts',
  'src/state/queries/codes.ts': 'src/features/access-codes/hooks/codes.ts',
  'src/state/queries/accessLogs.ts': 'src/features/history/hooks/accessLogs.ts',
  'src/state/queries/auth.ts': 'src/features/auth/hooks/auth.ts',
  'src/state/queries/billing.ts': 'src/features/billing/hooks/billing.ts',
  'src/state/queries/entitlements.ts': 'src/features/billing/hooks/entitlements.ts',
  'src/state/queries/estateUsers.ts': 'src/features/admin/hooks/estateUsers.ts',
  'src/state/queries/incidents.ts': 'src/features/incidents/hooks/incidents.ts',
  'src/state/queries/anomaly.ts': 'src/features/anomaly/hooks/anomaly.ts',
  'src/state/queries/operations.ts': 'src/features/incidents/hooks/operations.ts',
  'src/state/session/index.ts': 'src/features/auth/session.ts',
  'src/features/guests/SavedGuestCard.tsx': 'src/features/visitors/components/SavedGuestCard.tsx',
  'src/features/guests/filterGuests.ts': 'src/features/visitors/utils/filterGuests.ts',
  'src/features/guests/types.ts': 'src/features/visitors/types/guests.ts',
  'src/features/guests/__tests__/filterGuests.test.ts':
    'src/features/visitors/utils/__tests__/filterGuests.test.ts',
  'src/types/guests.ts': 'src/features/visitors/types/index.ts',
  'src/types/codes.ts': 'src/features/access-codes/types/codes.ts',
  'src/types/accessLog.ts': 'src/features/history/types/accessLog.ts',
  'src/types/accessLogs.ts': 'src/features/history/types/accessLogs.ts',
  'src/types/auth.ts': 'src/features/auth/types/auth.ts',
  'src/types/registration.ts': 'src/features/auth/types/registration.ts',
  'src/types/billing.ts': 'src/features/billing/types/billing.ts',
  'src/types/entitlements.ts': 'src/features/billing/types/entitlements.ts',
  'src/types/broadcast.ts': 'src/features/notifications/types/broadcast.ts',
  'src/types/notification.ts': 'src/features/notifications/types/notification.ts',
  'src/types/requests.ts': 'src/features/admin/types/requests.ts',
  'src/types/household.ts': 'src/features/admin/types/household.ts',
  'src/types/estate.ts': 'src/features/admin/types/estate.ts',
  'src/types/user.ts': 'src/features/users/types/user.ts',
  'src/types/userDocuments.ts': 'src/features/profile/types/userDocuments.ts',
  'src/types/aiMarketplace.ts': 'src/features/marketplace/types/aiMarketplace.ts',
  'src/types/general.ts': 'src/shared/types/general.ts',
  'src/types/navigation.ts': 'src/shared/types/navigation.ts',
  'src/lib/stores/userStore.ts': 'src/store/userStore.ts',
  'src/lib/stores/authStore.ts': 'src/features/auth/store/authStore.ts',
  'src/lib/stores/notificationStore.ts': 'src/features/notifications/store/notificationStore.ts',
  'src/lib/stores/profileDocumentsStore.ts': 'src/features/profile/store/profileDocumentsStore.ts',
  'src/lib/authRefresh.ts': 'src/features/auth/services/authRefresh.ts',
  'src/lib/session.ts': 'src/features/auth/services/session.ts',
  'src/lib/signOutReason.ts': 'src/features/auth/services/signOutReason.ts',
  'src/lib/biometricAuth.ts': 'src/features/auth/services/biometricAuth.ts',
  'src/lib/twoFactorState.ts': 'src/features/auth/services/twoFactorState.ts',
  'src/lib/recoveryCodes.ts': 'src/features/auth/services/recoveryCodes.ts',
  'src/lib/registrationValidation.ts': 'src/features/auth/utils/registrationValidation.ts',
  'src/lib/verificationStep.ts': 'src/features/auth/utils/verificationStep.ts',
  'src/hooks/useAuthContext.tsx': 'src/features/auth/hooks/useAuthContext.tsx',
  'src/hooks/useRefreshUser.ts': 'src/features/auth/hooks/useRefreshUser.ts',
  'src/hooks/useTwoFactorSetup.ts': 'src/features/auth/hooks/useTwoFactorSetup.ts',
  'src/hooks/useTwoFactorStatus.ts': 'src/features/auth/hooks/useTwoFactorStatus.ts',
  'src/hooks/useAccountVerification.ts': 'src/features/auth/hooks/useAccountVerification.ts',
  'src/lib/userDocumentCache.ts': 'src/features/profile/services/userDocumentCache.ts',
  'src/lib/userDocumentHelpers.ts': 'src/features/profile/utils/userDocumentHelpers.ts',
  'src/lib/idRejection.ts': 'src/features/profile/utils/idRejection.ts',
  'src/lib/profileOnboardingCache.ts': 'src/features/profile/utils/profileOnboardingCache.ts',
  'src/lib/profilePendingFields.ts': 'src/features/profile/utils/profilePendingFields.ts',
  'src/hooks/useProfilePendingFields.ts': 'src/features/profile/hooks/useProfilePendingFields.ts',
  'src/lib/billing.ts': 'src/features/billing/utils/billing.ts',
  'src/lib/billingCheckout.tsx': 'src/features/billing/utils/billingCheckout.tsx',
  'src/lib/planAvailability.ts': 'src/features/billing/utils/planAvailability.ts',
  'src/lib/plans.ts': 'src/features/billing/utils/plans.ts',
  'src/lib/estateAiTools.ts': 'src/features/billing/utils/estateAiTools.ts',
  'src/lib/serviceCatalog.ts': 'src/features/marketplace/utils/serviceCatalog.ts',
  'src/lib/currency.ts': 'src/features/billing/utils/currency.ts',
  'src/hooks/usePlan.ts': 'src/features/billing/hooks/usePlan.ts',
  'src/hooks/useBillingScreenGuard.ts': 'src/features/billing/hooks/useBillingScreenGuard.ts',
  'src/hooks/useEstatePlanFreshness.ts': 'src/features/billing/hooks/useEstatePlanFreshness.ts',
  'src/lib/pushNotifications.ts': 'src/features/notifications/services/pushNotifications.ts',
  'src/lib/readBroadcasts.ts': 'src/features/notifications/utils/readBroadcasts.ts',
  'src/lib/notificationDetail.ts': 'src/features/notifications/utils/notificationDetail.ts',
  'src/lib/broadcastForm.ts': 'src/features/notifications/utils/broadcastForm.ts',
  'src/lib/broadcastStyle.ts': 'src/features/notifications/utils/broadcastStyle.ts',
  'src/hooks/useInfoBoard.ts': 'src/features/notifications/hooks/useInfoBoard.ts',
  'src/lib/incidentReportDraft.ts': 'src/features/incidents/utils/incidentReportDraft.ts',
  'src/lib/incidentReportNavigation.ts': 'src/features/incidents/utils/incidentReportNavigation.ts',
  'src/lib/incidentTypeSelection.ts': 'src/features/incidents/utils/incidentTypeSelection.ts',
  'src/lib/securityScanWarning.ts': 'src/features/scanner/utils/securityScanWarning.ts',
  'src/lib/accessLogMappers.ts': 'src/features/history/utils/accessLogMappers.ts',
  'src/lib/pendingRequestHelpers.ts': 'src/features/admin/utils/pendingRequestHelpers.ts',
  'src/lib/brandedQr.ts': 'src/shared/utils/brandedQr.ts',
  'src/lib/helpers.ts': 'src/shared/utils/helpers.ts',
  'src/lib/cn.ts': 'src/shared/utils/cn.ts',
  'src/lib/selectInputText.ts': 'src/shared/utils/selectInputText.ts',
  'src/lib/scrollIntoView.ts': 'src/shared/utils/scrollIntoView.ts',
  'src/lib/androidActionLock.ts': 'src/shared/utils/androidActionLock.ts',
  'src/lib/index.ts': 'src/shared/utils/platform.ts',
  'src/lib/deviceId.ts': 'src/shared/services/storage/deviceId.ts',
  'src/lib/deviceLabel.ts': 'src/shared/services/storage/deviceLabel.ts',
  'src/lib/deviceName.ts': 'src/shared/services/storage/deviceName.ts',
  'src/hooks/useAndroidBottomInset.ts': 'src/shared/hooks/useAndroidBottomInset.ts',
  'src/hooks/useAndroidNavBar.ts': 'src/shared/hooks/useAndroidNavBar.ts',
  'src/hooks/useColorScheme.tsx': 'src/shared/hooks/useColorScheme.tsx',
  'src/hooks/useColorScheme.web.ts': 'src/shared/hooks/useColorScheme.web.ts',
  'src/hooks/useThemeColor.ts': 'src/shared/hooks/useThemeColor.ts',
  'src/hooks/useHeaderSearchBar.tsx': 'src/shared/hooks/useHeaderSearchBar.tsx',
  'src/hooks/useFetch.tsx': 'src/shared/hooks/useFetch.tsx',
};

const testTargets = {
  'src/lib/__tests__/authRefresh.test.ts':
    'src/features/auth/services/__tests__/authRefresh.test.ts',
  'src/lib/__tests__/signOutReason.test.ts':
    'src/features/auth/services/__tests__/signOutReason.test.ts',
  'src/lib/__tests__/registrationValidation.test.ts':
    'src/features/auth/utils/__tests__/registrationValidation.test.ts',
  'src/lib/__tests__/verificationStep.test.ts':
    'src/features/auth/utils/__tests__/verificationStep.test.ts',
  'src/lib/__tests__/userDocumentCache.test.ts':
    'src/features/profile/services/__tests__/userDocumentCache.test.ts',
  'src/lib/__tests__/userDocumentHelpers.test.ts':
    'src/features/profile/utils/__tests__/userDocumentHelpers.test.ts',
  'src/lib/__tests__/idRejection.test.ts':
    'src/features/profile/utils/__tests__/idRejection.test.ts',
  'src/lib/__tests__/billing.test.ts': 'src/features/billing/utils/__tests__/billing.test.ts',
  'src/lib/__tests__/planAvailability.test.ts':
    'src/features/billing/utils/__tests__/planAvailability.test.ts',
  'src/lib/__tests__/plans.test.ts': 'src/features/billing/utils/__tests__/plans.test.ts',
  'src/lib/__tests__/estateAiTools.test.ts':
    'src/features/billing/utils/__tests__/estateAiTools.test.ts',
  'src/lib/__tests__/currency.test.ts': 'src/features/billing/utils/__tests__/currency.test.ts',
  'src/lib/__tests__/notificationDetail.test.ts':
    'src/features/notifications/utils/__tests__/notificationDetail.test.ts',
  'src/lib/__tests__/incidentReportDraft.test.ts':
    'src/features/incidents/utils/__tests__/incidentReportDraft.test.ts',
  'src/lib/__tests__/incidentReportNavigation.test.ts':
    'src/features/incidents/utils/__tests__/incidentReportNavigation.test.ts',
  'src/lib/__tests__/incidentTypeSelection.test.ts':
    'src/features/incidents/utils/__tests__/incidentTypeSelection.test.ts',
  'src/lib/__tests__/securityScanWarning.test.ts':
    'src/features/scanner/utils/__tests__/securityScanWarning.test.ts',
  'src/lib/__tests__/securityCodeValidation.test.ts':
    'src/features/access-codes/services/__tests__/securityCodeValidation.test.ts',
  'src/lib/__tests__/validityTime.test.ts':
    'src/features/access-codes/utils/__tests__/validityTime.test.ts',
  'src/lib/__tests__/deviceLabel.test.ts':
    'src/shared/services/storage/__tests__/deviceLabel.test.ts',
  'src/lib/__tests__/selectInputText.test.ts': 'src/shared/utils/__tests__/selectInputText.test.ts',
  'src/lib/__tests__/androidActionLock.test.ts':
    'src/shared/utils/__tests__/androidActionLock.test.ts',
  'src/lib/__tests__/brandedQr.test.ts': 'src/shared/utils/__tests__/brandedQr.test.ts',
  'src/components/__tests__/ThemedText-test.tsx':
    'src/shared/components/__tests__/ThemedText-test.tsx',
};

const mobileFeature = {
  AccessHistoryDetail: 'history',
  AccessLogCard: 'history',
  AccessTimeline: 'history',
  ActiveCodeCard: 'access-codes',
  AccessCodeRing: 'access-codes',
  CodeActionsSheet: 'access-codes',
  CodeItem: 'access-codes',
  CodeDateTimePicker: 'access-codes',
  SetTimeSheet: 'access-codes',
  MonthCalendar: 'access-codes',
  TimeWheelColumn: 'access-codes',
  ResidentAccessCodeQRModal: 'profile',
  ProfileFieldRow: 'profile',
  ProfileOnboardingBanner: 'profile',
  ProfilePhotoSheet: 'profile',
  ProfilePreviewModal: 'profile',
  IdentificationSheet: 'profile',
  IdDocumentPreview: 'profile',
  InfoBoardRows: 'notifications',
  InfoBoardTabs: 'notifications',
  ActivityDetailModal: 'notifications',
  HouseholdSelectorSheet: 'admin',
  AddHouseholdSheet: 'admin',
  ConfirmHouseholdSheet: 'admin',
  selectUser: 'admin',
  PendingRequestSheet: 'admin',
  UserTabBar: 'dashboard',
  HeaderActions: 'dashboard',
  MoreMenuScreen: 'profile',
  MoreMenuRow: 'profile',
  PlanGuard: 'billing',
  PlanNotice: 'billing',
  PlanPressable: 'billing',
  FreePlanNotice: 'billing',
  UpgradePlanModal: 'billing',
  SeatCapacitySheet: 'billing',
  VerifyAccountGuard: 'auth',
  VerifyAccountModal: 'auth',
  BiometricPromptModal: 'auth',
};

function screenFeature(rel) {
  const p = rel.replace(/^app\//, '');
  if (p.startsWith('_layout') || p.startsWith('+')) return null;
  if (
    p.startsWith('auth/') ||
    p === 'activate.tsx' ||
    p.includes('account-security') ||
    p.includes('linked-devices') ||
    p.includes('delete-account')
  ) {
    return 'auth';
  }
  if (p.includes('/guests')) return 'visitors';
  if (p.includes('history/duration') || p.includes('/invite/')) return 'access-codes';
  if (p.includes('/history')) return 'history';
  if (p.includes('/security/')) return 'scanner';
  if (/\/user\/index\.(native\.tsx|web\.tsx|tsx)$/.test(p)) return 'dashboard';
  if (p.includes('/report') || p.includes('incident-report')) return 'incidents';
  if (p.includes('anomaly-detection')) return 'anomaly';
  if (p.includes('ai-store')) return 'marketplace';
  if (p.includes('/profile') || p.includes('/settings')) return 'profile';
  if (p.includes('/billing') || p.includes('/seats') || p.startsWith('payment/')) return 'billing';
  if (p.includes('/admin/')) return 'admin';
  if (p.includes('info-board')) return 'notifications';
  if (p.includes('rating-feedback')) return 'support';
  return null;
}

function destFor(rel) {
  if (exact[rel]) return exact[rel];
  if (testTargets[rel]) return testTargets[rel];
  if (rel.startsWith('src/lib/api/')) return null;
  if (
    [
      'src/hooks/useBillingQueries.ts',
      'src/hooks/useAnomalyQueries.ts',
      'src/hooks/useIncidentQueries.ts',
      'src/hooks/useEstateUsers.ts',
    ].includes(rel)
  ) {
    return null;
  }
  if (rel.startsWith('src/data/')) return null;
  if (rel.startsWith('src/theme/')) return rel.replace('src/theme/', 'src/shared/theme/');
  if (rel.startsWith('src/constants/'))
    return rel.replace('src/constants/', 'src/shared/constants/');
  if (rel.startsWith('src/components/billing/')) {
    return rel.replace('src/components/billing/', 'src/features/billing/components/');
  }
  if (rel.startsWith('src/components/anomaly/')) {
    return rel.replace('src/components/anomaly/', 'src/features/anomaly/components/');
  }
  if (rel.startsWith('src/components/incident/')) {
    return rel.replace('src/components/incident/', 'src/features/incidents/components/');
  }
  if (rel.startsWith('src/components/security/')) {
    return rel.replace('src/components/security/', 'src/features/scanner/components/');
  }
  if (rel.startsWith('src/components/mobile/')) {
    const base = path
      .basename(rel)
      .replace(/\.(native|ios|android|web)\.(tsx|ts)$/, '')
      .replace(/\.(tsx|ts)$/, '');
    const feature = mobileFeature[base];
    if (feature) return `src/features/${feature}/components/${path.basename(rel)}`;
    return rel.replace('src/components/mobile/', 'src/shared/components/');
  }
  if (rel.startsWith('src/components/web/')) {
    const base = path.basename(rel, path.extname(rel));
    if (base === 'AccessCodeCard')
      return `src/features/access-codes/components/${path.basename(rel)}`;
    if (base === 'UpdatePassword' || base === 'WebPasswordInput') {
      return `src/features/auth/components/${path.basename(rel)}`;
    }
    return rel.replace('src/components/web/', 'src/shared/components/');
  }
  if (rel.startsWith('src/components/common/')) {
    const base = path.basename(rel).replace(/\.(tsx|ts)$/, '');
    if (
      [
        'BroadcastPopup',
        'BroadcastPopupHost',
        'NotificationBell',
        'PushNotificationsHost',
        'PriorityBadge',
      ].includes(base)
    ) {
      return `src/features/notifications/components/${path.basename(rel)}`;
    }
    if (base === 'RegistrationIdPicker')
      return `src/features/admin/components/${path.basename(rel)}`;
    if (base === 'PaymentProcessingModal')
      return `src/features/billing/components/${path.basename(rel)}`;
    if (base === 'PasswordInput') return `src/shared/components/${path.basename(rel)}`;
    return rel.replace('src/components/common/', 'src/shared/components/');
  }
  if (rel.startsWith('src/components/')) {
    return rel.replace('src/components/', 'src/shared/components/');
  }
  if (
    rel.startsWith('app/') &&
    !path.basename(rel).startsWith('_layout') &&
    !path.basename(rel).startsWith('+')
  ) {
    const feature = screenFeature(rel);
    if (!feature) return null;
    const rest = rel.replace(/^app\//, '').replace(/[()]/g, '');
    return `src/features/${feature}/screens/${rest}`;
  }
  return null;
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) acc.push(path.relative(root, full));
  }
  return acc;
}

function moduleId(filePath) {
  return filePath
    .replace(/\.(native|ios|android|web)\.(tsx|ts|jsx|js)$/, '')
    .replace(/\.(tsx|ts|jsx|js)$/, '');
}

const files = [
  ...walk(path.join(root, 'src')),
  ...walk(path.join(root, 'app')),
  ...walk(path.join(root, 'lib')),
];

const moves = new Map();
for (const rel of files) {
  const dest = destFor(rel);
  if (dest && dest !== rel) moves.set(rel, dest);
}

const idToDest = new Map();
for (const rel of files) {
  const dest = moves.get(rel) ?? rel;
  idToDest.set(moduleId(rel), moduleId(dest));
}
idToDest.set('src/lib/api', 'src/shared/services/api/client');
idToDest.set('src/lib/api/index', 'src/shared/services/api/client');
idToDest.set('src/lib/api/auth', 'src/features/auth');
idToDest.set('src/lib/api/entitlements', 'src/features/billing');
idToDest.set('src/hooks/useBillingQueries', 'src/features/billing/hooks/billing');
idToDest.set('src/hooks/useAnomalyQueries', 'src/features/anomaly/hooks/anomaly');
idToDest.set('src/hooks/useIncidentQueries', 'src/features/incidents/hooks/incidents');
idToDest.set('src/hooks/useEstateUsers', 'src/features/admin/hooks/estateUsers');
idToDest.set('lib/queryClient', 'src/shared/services/api/queryClient');

function resolveModule(fromRel, spec) {
  if (spec.startsWith('@/')) return spec.slice(2);
  if (spec.startsWith('.')) {
    const abs = path.normalize(path.join(path.dirname(fromRel), spec)).replace(/\\/g, '/');
    return abs;
  }
  return null;
}

function rewrite(fromRel, source) {
  return source.replace(
    /(from\s+|import\s*\(\s*|require\s*\(\s*|jest\.mock\s*\(\s*)(['"])([^'"]+)\2/g,
    (full, lead, quote, spec) => {
      const resolved = resolveModule(fromRel, spec);
      if (!resolved) return full;
      const next = idToDest.get(resolved) ?? idToDest.get(moduleId(resolved));
      if (!next) return full;
      return `${lead}${quote}@/${next}${quote}`;
    }
  );
}

for (const rel of files) {
  const full = path.join(root, rel);
  const next = rewrite(rel, fs.readFileSync(full, 'utf8'));
  if (next !== fs.readFileSync(full, 'utf8')) fs.writeFileSync(full, next);
}

for (const [from, to] of moves) {
  const target = path.join(root, to);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.renameSync(path.join(root, from), target);
}

for (const [from, to] of moves) {
  if (!from.startsWith('app/')) continue;
  const spec = `@/${moduleId(to)}`;
  const shim = `export { default } from '${spec}';\nexport * from '${spec}';\n`;
  const shimPath = path.join(root, from);
  fs.mkdirSync(path.dirname(shimPath), { recursive: true });
  fs.writeFileSync(shimPath, shim);
}

const remove = [
  ...files.filter((rel) => rel.startsWith('src/lib/api/') || rel.startsWith('src/data/')),
  'src/hooks/useBillingQueries.ts',
  'src/hooks/useAnomalyQueries.ts',
  'src/hooks/useIncidentQueries.ts',
  'src/hooks/useEstateUsers.ts',
];
for (const rel of remove) {
  const full = path.join(root, rel);
  if (fs.existsSync(full)) fs.rmSync(full);
}

function writeIndexes() {
  const featuresDir = path.join(root, 'src/features');
  for (const feature of fs.readdirSync(featuresDir)) {
    const dir = path.join(featuresDir, feature);
    if (!fs.statSync(dir).isDirectory()) continue;
    const lines = [];
    for (const folder of ['services', 'hooks', 'store', 'types', 'utils']) {
      const folderPath = path.join(dir, folder);
      if (!fs.existsSync(folderPath)) continue;
      for (const name of fs.readdirSync(folderPath)) {
        if (!/\.(ts|tsx)$/.test(name) || name.includes('.native') || name.includes('.web'))
          continue;
        if (name.endsWith('.test.ts') || name.endsWith('.test.tsx')) continue;
        lines.push(`export * from './${folder}/${name.replace(/\.(tsx|ts)$/, '')}';`);
      }
    }
    if (fs.existsSync(path.join(dir, 'session.ts'))) lines.push(`export * from './session';`);
    if (lines.length) fs.writeFileSync(path.join(dir, 'index.ts'), `${lines.join('\n')}\n`);
  }
}
writeIndexes();

fs.mkdirSync(path.join(root, 'src/store'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'src/store/index.ts'),
  `export { useUserStore } from './userStore';\n`
);

function prune(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) prune(full);
  }
  if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}
for (const dir of [
  'src/api',
  'src/hooks',
  'src/lib',
  'src/state',
  'src/types',
  'src/components',
  'src/data',
  'src/features/guests',
  'lib',
]) {
  prune(path.join(root, dir));
}

console.log(`moved ${moves.size} files`);
