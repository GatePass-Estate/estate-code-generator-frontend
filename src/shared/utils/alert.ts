import { Alert, Platform } from 'react-native';

type AlertButton = {
  text?: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

/**
 * STB-10: `Alert.alert` is a no-op on react-native-web. Use this helper so web gets
 * `window.alert` / `window.confirm` while native keeps the system alert sheet.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: { cancelable?: boolean }
): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons, options);
    return;
  }

  const body = [title, message].filter(Boolean).join('\n\n');
  const actions = buttons?.length ? buttons : [{ text: 'OK' as const }];
  const cancel = actions.find((b) => b.style === 'cancel');
  const confirm =
    actions.find((b) => b.style === 'destructive') ??
    actions.find((b) => b !== cancel) ??
    actions[0];

  if (actions.length <= 1) {
    window.alert(body);
    confirm?.onPress?.();
    return;
  }

  const ok = window.confirm(body);
  if (ok) confirm?.onPress?.();
  else cancel?.onPress?.();
}
