import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Ionicons,
  MaterialIcons,
  Feather,
  FontAwesome,
} from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuthContext';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const router = useRouter();
  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Admin</Text>
          <View style={styles.profileCircle} >
            
            <Text style={styles.profileInitials}>GD</Text>
          </View>

        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, styles.residentBox]}>
            <Ionicons name='home' size={24} color='#E76F51' />
            <Text style={styles.residentText}>Residents</Text>
            <Text style={styles.statNumber}>178</Text>
          </View>
          <View style={[styles.statBox, styles.securityBox]}>
            <Ionicons name='shield-checkmark' size={24} color='#2A9D8F' />
            <Text style={styles.securityText}>Security P...</Text>
            <Text style={styles.statSNumber} >178</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalNumber}>600</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Feather name='plus' size={32} color='#BDBDBD' />
          </TouchableOpacity>
        </View>

        <View style={styles.iconRow}>
          <TouchableOpacity style={[styles.iconButton, styles.activeIcon]}>
            <FontAwesome name='user' size={20} color='#113E55' />
            <Text style={styles.iconLabel}>See All Users</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              router.push('/(admin)/(adminReg)');
            }}>
            <Feather name='user-plus' size={20} color='#113E55' />
            <Text style={styles.iconLabel}>Register User</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name='send' size={20} color='#113E55' />
            <Text style={styles.iconLabel}>Broadcast</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={signOut}>
            <Feather name='download' size={20} color='#113E55' />
            <Text style={styles.iconLabel}>Edit Requests</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.userListHeader}>
          <Text style={styles.userListTitle}>All Users</Text>
          <TouchableOpacity
            onPress={() => {
              router.push('/(admin)/(userList)');
            }}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {[1, 2, 3].map((_, index) => (
          <TouchableOpacity key={index} style={styles.userItem}>
            <Ionicons
              name='home'
              size={20}
              color='#E76F51'
              style={{ marginRight: 10 }}
            />
            <View>
              <Text style={styles.userName}>Sandra Happiness</Text>
              <Text style={styles.userFlat}>Flat 56</Text>
            </View>
            <Feather
              name='chevron-right'
              size={20}
              color='#113E55'
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '600',
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#113E55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#113E55',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statBox: {
    width: '48%',
    borderRadius: 10,
    padding: 15,
  },
  residentBox: {
    backgroundColor: '#FFF4EF',
    borderColor: '#E76F51',
    borderWidth: 1,
  },
  securityBox: {
    backgroundColor: '#EDF9F6',
    borderColor: '#2A9D8F',
    borderWidth: 1,
  },
  residentText: {
    marginTop: 5,
    color: '#E76F51',
  },
  securityText: {
    marginTop: 5,
    color: '#2A9D8F',
  },
  statNumber: {
    marginTop: 5,
    fontSize: 20,
    fontWeight: '600',
    color:'#E76F51'
  },
  statSNumber:{
    marginTop: 5,
    fontSize: 20,
    fontWeight: '600',
    color:'green'
  },
  totalBox: {
    width: '48%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 10,
  },
  totalLabel: {
    color: '#113E55',
  },
  totalNumber: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 5,
  },
  addButton: {
    width: '48%',
    backgroundColor: '#F7F7F7',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    height: 80,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    backgroundColor: '#F4F9FB',
    padding: 10,
    borderRadius: 10,
  },
  iconButton: {
    alignItems: 'center',
    flex: 1,
  },
  activeIcon: {
    backgroundColor: '#DCE9EE',
    padding: 10,
    borderRadius: 10,
  },
  iconLabel: {
    marginTop: 5,
    fontSize: 12,
    color: '#113E55',
  },
  userListHeader: {
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userListTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAll: {
    color: '#2A9D8F',
    fontWeight: '500',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
  },
  userFlat: {
    fontSize: 12,
    color: '#888',
  },
});
