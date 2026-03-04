import { useRouter } from 'expo-router';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const users = Array(7).fill({ name: 'Sandra Happiness', flat: 'Flat 56' });

const AllUsersWeb = () => {
	const router = useRouter();
	return (
		<View style={styles.container}>
			<TouchableOpacity onPress={() => router.back()}>
				<Text style={styles.back}>{'<  Back'}</Text>
			</TouchableOpacity>

			<Text style={styles.heading}>See All Users</Text>

			<View style={styles.searchContainer}>
				<Icon name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
				<TextInput placeholder="Search User" placeholderTextColor="#9CA3AF" style={styles.searchInput} />
			</View>

			<View style={styles.tabContainer}>
				<TouchableOpacity style={[styles.tab, styles.activeTab]}>
					<Icon name="home" size={20} color="#D97706" />
				</TouchableOpacity>
				<TouchableOpacity style={styles.tab}>
					<Icon name="shield" size={20} color="#9CA3AF" />
				</TouchableOpacity>
				<TouchableOpacity style={styles.tab}>
					<Icon name="lock" size={20} color="#9CA3AF" />
				</TouchableOpacity>
			</View>

			<FlatList
				data={users}
				keyExtractor={(_, index) => index.toString()}
				renderItem={({ item }) => (
					<TouchableOpacity
						style={styles.userCard}
						// onPress={() => router.push('/(admin)/(userProfile)')}
					>
						<Icon name="home" size={20} color="#D97706" style={styles.cardIcon} />
						<View>
							<Text style={styles.userName}>{item.name}</Text>
							<Text style={styles.userFlat}>{item.flat}</Text>
						</View>
						<Icon name="chevron-right" size={20} color="#059669" style={styles.chevronIcon} />
					</TouchableOpacity>
				)}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 20,
		backgroundColor: '#fff',
		flex: 1,
		paddingTop: 50,
	},
	back: {
		color: '#1F2937',
		fontSize: 16,
		marginBottom: 10,
		opacity: 0.6,
	},
	heading: {
		fontSize: 20,
		fontWeight: '600',
		marginBottom: 20,
		color: '#1F2937',
	},
	searchContainer: {
		backgroundColor: '#F3F4F6',
		borderRadius: 12,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 6,
		marginBottom: 20,
	},
	searchIcon: {
		marginRight: 8,
	},
	searchInput: {
		fontSize: 16,
		flex: 1,
		color: '#1F2937',
	},
	tabContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 20,
	},
	tab: {
		backgroundColor: '#F3F4F6',
		padding: 12,
		borderRadius: 10,
		flex: 1,
		alignItems: 'center',
		marginHorizontal: 5,
	},
	activeTab: {
		borderColor: '#D97706',
		borderWidth: 1,
		backgroundColor: '#FFF7ED',
	},
	userCard: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 16,
		paddingHorizontal: 12,
		backgroundColor: '#fff',
		borderBottomWidth: 1,
		borderBottomColor: '#F3F4F6',
	},
	cardIcon: {
		marginRight: 12,
	},
	userName: {
		fontSize: 16,
		fontWeight: '500',
		color: '#1F2937',
	},
	userFlat: {
		fontSize: 14,
		color: '#6B7280',
	},
	chevronIcon: {
		marginLeft: 'auto',
	},
});

export default AllUsersWeb;
