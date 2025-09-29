import { Switch } from 'react-native';

import { useColorScheme } from '@/src/hooks/useColorScheme';
import { COLORS } from '@/src/theme/colors';

function Toggle(props: React.ComponentPropsWithoutRef<typeof Switch>) {
	const { colors } = useColorScheme();
	return (
		<Switch
			trackColor={{
				true: colors.primary,
				false: colors.grey,
			}}
			thumbColor={COLORS.white}
			{...props}
		/>
	);
}

export { Toggle };
