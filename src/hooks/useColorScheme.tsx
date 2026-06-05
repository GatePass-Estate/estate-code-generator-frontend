import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import * as React from 'react';

import { COLORS } from '@/src/theme/colors';

function useColorScheme() {
  const { colorScheme, setColorScheme: setNativeWindColorScheme } = useNativewindColorScheme();

  async function setColorScheme(nextScheme: 'light' | 'dark') {
    setNativeWindColorScheme(nextScheme);
  }

  function toggleColorScheme() {
    return setColorScheme(colorScheme === 'light' ? 'dark' : 'light');
  }

  return {
    colorScheme: colorScheme ?? 'light',
    isDarkColorScheme: colorScheme === 'dark',
    setColorScheme,
    toggleColorScheme,
    colors: COLORS[colorScheme ?? 'light'],
  };
}

export { useColorScheme };
