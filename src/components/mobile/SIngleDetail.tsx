import { Text, View } from 'react-native';

export const SingleDetail = ({ label, value, contentColor = 'text-black' }: { label: string; value: string | null; contentColor?: string }) => (
	<View className="gap-1 flex-row items-start justify-between mb-5">
		<Text className="text-[15px] text-grey font-UbuntuSans" style={{ flexShrink: 0, marginRight: 8 }}>
			{label}:
		</Text>

		<Text
			numberOfLines={2}
			ellipsizeMode="tail"
			style={{
				flex: 1,
				flexWrap: 'wrap',
				fontSize: 15,
			}}
			className={`${contentColor} text-right`}
		>
			{value ?? ''}
		</Text>
	</View>
);
