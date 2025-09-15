import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { Image } from 'react-native';
import UserIcon from '@/components/UserIcon';
import { useRef, useState } from 'react';

const guests = [
	{ name: 'Sandra', relation: 'Friend', gender: 'female' },
	{ name: 'Jeff', relation: 'Service Provider', gender: 'male' },
	{ name: 'Sandra', relation: 'Friend', gender: 'prefer not to say' },
	{ name: 'Ben', relation: 'Partner', gender: 'male' },
	{ name: 'Maya', relation: 'Friend', gender: 'female' },
];

const MyGuest = () => {
	const [searchQuery, setSearchQuery] = useState('');

	const filteredGuests = guests.filter((guest) => guest.name.toLowerCase().includes(searchQuery.toLowerCase()) || guest.relation.toLowerCase().includes(searchQuery.toLowerCase()));

	const bounceValue = useRef(new Animated.Value(0)).current;

	return (
		<View style={styles.container}>
			<Stack.Screen
				options={{
					headerShown: true,
					title: 'My Guests',
					headerShadowVisible: false,
					headerStyle: {
						backgroundColor: '#FBFEFF',
					},
					headerRight: () => <UserIcon />,
					headerTitleStyle: {
						color: '#113E55',
						fontFamily: 'UbuntuSans',
						fontWeight: '700',
					},
				}}
			/>
			<View style={styles.searchBar}>
				<Ionicons name="search" size={18} color="#555" style={{ marginLeft: 8 }} />
				<TextInput placeholder="Search" style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} />
			</View>

			<Text style={styles.savedLabel}>All Saved Guests</Text>
			<View style={styles.divider} />

			<ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
				{filteredGuests.length === 0 ? (
					<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
						<Animated.Image
							source={require('@/assets/images/ghost.png')}
							style={{
								width: 300,
								height: 300,
								resizeMode: 'contain',
								transform: [{ translateY: bounceValue }],
							}}
						/>

						<Text style={{ textAlign: 'center', fontSize: 23, opacity: 0.2 }}>{`Click the ‘+’ to add \nyour guest`}</Text>
					</View>
				) : (
					filteredGuests.map((guest, index) => (
						<View key={index} style={[styles.card, { backgroundColor: guest.gender == 'female' ? '#f45f36e' : guest.gender == 'male' ? '#167a6ec' : '#dcdcdc30', borderColor: guest.gender == 'female' ? '#F46036' : guest.gender == 'male' ? '#167a6f' : '#dcdcdc' }]}>
							<View style={styles.guestInfo}>
								{guest.gender === 'male' ? <Ionicons name="male" size={18} color="#167a6f" /> : guest.gender === 'female' ? <Ionicons name="female" size={18} color="#F46036" /> : <Image source={require('@/assets/icons/not-saying.png')} style={{ width: 19, height: 19 }} />}

								<View style={{ marginLeft: 10 }}>
									<Text style={styles.guestName}>{guest.name}</Text>
									<Text style={styles.guestRelation}>{guest.relation}</Text>
								</View>
							</View>

							<View style={styles.actions}>
								<TouchableOpacity style={{ marginRight: 15 }}>
									<Image source={require('@/assets/images/delete(1).png')} style={{ width: 35, height: 35, resizeMode: 'contain', tintColor: '#a6a4a4' }} />
								</TouchableOpacity>

								{/* QRcode beside the deleete button */}
								<TouchableOpacity>
									<Image source={require('@/assets/images/generatecode(2).png')} style={{ width: 35, height: 35, resizeMode: 'contain', tintColor: '#a6a4a4' }} />
								</TouchableOpacity>
							</View>
						</View>
					))
				)}
			</ScrollView>
		</View>
	);
};

export default MyGuest;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FBFEFF',
		paddingHorizontal: 20,
		paddingTop: 35,
		elevation: 0,
		shadowOpacity: 0,
		borderBottomWidth: 0,
	},

	title: {
		fontSize: 22,
		fontWeight: 'bold',
		marginBottom: 15,
		color: '#113E55',
	},

	searchBar: {
		flexDirection: 'row',
		backgroundColor: '#F7F9F9',
		borderRadius: 8,
		alignItems: 'center',
		paddingHorizontal: 8,
		marginBottom: 20,
	},

	profileCircle: {
		width: 35,
		height: 35,
		borderRadius: 17,
		borderWidth: 1,
		marginRight: 30,
		borderColor: '#167a6f',
		justifyContent: 'center',
		alignItems: 'center',
	},

	profileInitials: {
		color: '#167a6f',
		fontWeight: '300',
		fontFamily: 'UbuntuSans',
		fontSize: 23,
	},

	searchInput: {
		padding: 10,
		flex: 1,
		fontSize: 14,
		paddingVertical: 20,
	},

	savedLabel: {
		fontSize: 14,
		marginTop: 20,
		marginBottom: 10,
		color: '#222',
	},

	card: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 12,
		borderRadius: 10,
		backgroundColor: '#F6F6F6',
		marginBottom: 10,
		alignItems: 'center',
		borderWidth: 1,
		height: 60,
		borderColor: '#e5e5e5',
	},

	guestInfo: {
		flexDirection: 'row',
		alignItems: 'center',
	},

	guestName: {
		fontWeight: 'light',
		fontSize: 18,
		color: '#04121a',
	},

	guestRelation: {
		fontWeight: 'semibold',
		fontSize: 13,
		color: '#113e55',
	},

	actions: {
		flexDirection: 'row',
	},

	fab: {
		position: 'absolute',
		bottom: 20,
		left: '50%',
		transform: [{ translateX: -30 }],
		backgroundColor: '#113E55',
		width: 60,
		height: 60,
		borderRadius: 30,
		justifyContent: 'center',
		alignItems: 'center',
		elevation: 5,
	},

	divider: {
		height: 0.5,
		backgroundColor: '#113E55',
		marginTop: 4,
		marginBottom: 15,
		width: '100%',
	},
});
