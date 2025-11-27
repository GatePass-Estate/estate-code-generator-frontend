import { Text, View } from 'react-native';

export const SingleDetail = ({ label, value }: { label: string; value: string | null }) => (
	<View className="gap-1 flex-row items-center justify-between mb-5">
		<Text className="text-[15px] text-grey font-UbuntuSans">{label}: </Text>

		<Text
			numberOfLines={2}
			ellipsizeMode="head"
			style={{
				flexWrap: 'wrap',
				fontSize: 15,
			}}
			className="text-black"
		>
			{value}{' '}
		</Text>
	</View>
);
