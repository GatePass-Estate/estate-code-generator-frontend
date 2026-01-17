import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

const MOCK_REQUESTS = [
	{
		id: '1',
		name: 'Sandra Happiness',
		field: 'Phone Number',
		date: '12 Aug 2024',
		status: 'Pending',
	},
	{
		id: '2',
		name: 'John Michael',
		field: 'Apartment Number',
		date: '11 Aug 2024',
		status: 'Pending',
	},
	{
		id: '3',
		name: 'Blessing Okorie',
		field: 'Email Address',
		date: '10 Aug 2024',
		status: 'Approved',
	},
];

export default function EditRequestsPage() {
	return (
		<View className="flex-1 bg-page px-6 pt-6">
			{/* Header */}
			<View className="mb-8">
				<Text className="text-text-primary text-2xl font-semibold">Edit Requests</Text>
				<Text className="text-text-secondary text-sm mt-1">Review and approve user profile change requests</Text>
			</View>

			{/* Table Header */}
			<View className="flex-row items-center border-b border-border pb-4 mb-4">
				<Text className="flex-1 text-text-muted text-xs uppercase">User</Text>
				<Text className="flex-1 text-text-muted text-xs uppercase">Field</Text>
				<Text className="w-24 text-text-muted text-xs uppercase">Date</Text>
				<Text className="w-24 text-text-muted text-xs uppercase text-right">Status</Text>
			</View>

			{/* List */}
			<ScrollView>
				{MOCK_REQUESTS.map((item) => (
					<View key={item.id} className="flex-row items-center border-b border-border py-5">
						{/* User */}
						<Text className="flex-1 text-text-primary font-medium">{item.name}</Text>

						{/* Field */}
						<Text className="flex-1 text-text-secondary">{item.field}</Text>

						{/* Date */}
						<Text className="w-24 text-text-secondary text-sm">{item.date}</Text>

						{/* Status */}
						<View className="w-24 items-end">
							<View className={`px-3 py-1.5 rounded-full ${item.status === 'Approved' ? 'bg-highlight' : 'bg-muted'}`}>
								<Text className="text-xs text-text-primary">{item.status}</Text>
							</View>
						</View>
					</View>
				))}
			</ScrollView>

			{/* Actions */}
			<View className="flex-row gap-4 mt-6">
				<TouchableOpacity className="flex-1 bg-secondary py-4 rounded-lg">
					<Text className="text-center text-white font-medium">Approve</Text>
				</TouchableOpacity>

				<TouchableOpacity className="flex-1 border border-border py-4 rounded-lg">
					<Text className="text-center text-text-primary font-medium">Decline</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}
