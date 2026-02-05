import { StyleSheet } from 'react-native';

export const sharedStyles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FBFEFF',
		paddingHorizontal: 20,
	},

	title: {
		color: '#113E55',
		fontFamily: 'UbuntuSans-SemiBold',
		textAlign: 'left',
		fontSize: 23,
	},

	header: {
		backgroundColor: '#FBFEFF',
	},

	modalContainer: {
		paddingTop: 20,
	},

	tabBar: {
		position: 'absolute',
		backgroundColor: '#CEE5ED',
		height: 80,
		flex: 1,
		elevation: 0,
		shadowColor: 'transparent',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0,
		shadowRadius: 0,
		borderTopWidth: 0,
	},

	fab: {
		top: -20,
		width: 90,
		height: 90,
		borderRadius: 50,
		borderColor: '#FBFEFF',
		borderWidth: 6,
		justifyContent: 'center',
		alignItems: 'center',
		elevation: 0,
		shadowColor: 'transparent',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0,
		shadowRadius: 0,
	},

	label: {
		fontSize: 12,
		color: '#113E55',
		marginTop: 20,
	},

	input: {
		backgroundColor: '#F7F9F9',
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 12,
		marginTop: 5,
		height: 50,
		paddingLeft: 15,
	},
});
