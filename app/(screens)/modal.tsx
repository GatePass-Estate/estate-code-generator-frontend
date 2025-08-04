import React, { useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '@/hooks/useAuthContext';
import { Image } from 'react-native';
import { router } from 'expo-router';



const ProfileScreen = () => {
  const { signOut } = useAuth();
  const navigation = useNavigation();

  // Hide the header
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
  <Image
    source={require('@/assets/icons/keyboard_arrow_left (1).png')} // update path if needed
    style={styles.backIcon}
  />
  <Text style={styles.backText}>Back</Text>
</TouchableOpacity>

      {/* Profile Title */}
      <Text style={styles.title}>My Profile</Text>

      {/* Personal Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          PERSONAL DETAILS
          <TouchableOpacity style={styles.editIcon} onPress={() => router.push('/edit-request')}>
  <Image
    source={require('@/assets/icons/edit-button.png')}
    style={{
      width: 20,
      height: 15,
      resizeMode: 'contain',
      marginTop: 9,
      left: 10,
      top: 2,
    }}
  />
</TouchableOpacity>

        </Text>

        {/* Access Code Card */}
        {/* <View style={accesstyles.access}>
          <Text style={accesstyles.text}>My access code:  90t 76E</Text>
        </View> */}

        {/* Expire Card */}
        {/* <View style={styles.expire}>
          <Text style={accesstyles.textExpire}> */}
            {/* <Icon name="alert-circle-outline" size={20} color="#113E55"   /> */}
            {/* Code expires on 31st May 2003
          </Text> 
        </View> */}

        {/* Profile Card */}
        <View style={styles.card}>
          <ProfileDetail label="Name" value="Sandra Happiness" />
          <ProfileDetail label="Address" value="Flat 1, 18A Olayinka Street" />
          <ProfileDetail label="Email Address" value="ckmdkcmdcdmckdmckmdkcmkmhfffffbhbgyroJ@gmail.com" />
          <ProfileDetail label="Phone Number" value="0902 443 4224" />
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText} >Log Out </Text>
      </TouchableOpacity>
    </View>
  );
};

// Reusable Component for Profile Details
const ProfileDetail = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label} :</Text>



    <Text numberOfLines={2}
  ellipsizeMode="head"
  style={{
    flexWrap: "wrap",
    // textAlign: "justify",
    fontSize: 14,
  }}>{value}</Text>
    
  </View>
);

// accesstyles
const accesstyles = StyleSheet.create({
  access: {
    backgroundColor: '#CEE5ED',
    color: '#113E55',
    height: 50,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  text: {
    color: '#113E55',
    fontWeight: 'bold',
  },
  textExpire: {
    color: '#113E55',
    marginBottom: 40,
    fontStyle: 'italic',
  }
});

// Styles
const styles = StyleSheet.create({
  container: {
     flex: 1,
    backgroundColor: "#FBFEFF",
    paddingHorizontal: 20,
    paddingTop: 70,
     elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    color: '#113E55',
    fontSize: 16,
    marginLeft: 5,
    fontFamily: "UbuntuSans",
    fontWeight: "bold",
  },
  value:{
    flexWrap: "wrap",        // ✅ allow wrapping
    width: "20%", 
  },
  backIcon: {
  width: 25,
  height: 25,
  resizeMode: 'contain',
},
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#113E55',
    marginBottom: 20,
    fontFamily: "UbuntuSans",
  },
  section: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 400,
    color: '#113E55',
    marginBottom: 10,
    flexDirection: 'row',
  },
  editIcon: {
    marginLeft: 10,
    borderRadius: 20,
  },
  card: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    width: "100%",
    borderWidth: 0.1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  detailLabel: {
    color: '#888',
    fontSize: 14,
    fontWeight: 400,
  },
  detailValue: {
    color: '#113E55',
    fontSize: 14,
    fontWeight: 400,
    fontFamily: "UbuntuSans",
  },
  logoutButton: {
    alignSelf: 'center',
    marginTop: 30,
  },
  logoutText: {
    top: 130,
    color: '#E63946',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expire: {
    marginTop: 10,
    marginBottom: 10,
  },
});

export default ProfileScreen;
