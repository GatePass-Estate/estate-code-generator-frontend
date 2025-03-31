import { StatusBar } from 'expo-status-bar';
import { Linking, Platform, View } from 'react-native';

import { useColorScheme } from '@/lib/useColorScheme';

export default function ModalScreen() {
  const { colors, colorScheme } = useColorScheme();
  return (
    <>
      <StatusBar
        style={
          Platform.OS === 'ios'
            ? 'light'
            : colorScheme === 'dark'
            ? 'light'
            : 'dark'
        }
      />
    </>
  );
}
