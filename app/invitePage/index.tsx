import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import InviteCard from './InviteCard'; // Make sure this path is correct
import QrBox from './QrBox';           // Make sure this path is correct

export default function InvitePage() {
  const navigation = useNavigation();
  const accessCode = '56T73E';
  const name = 'Sandra Happiness';
  const address = 'Flat 1, 18A Clayinka Something Street, U3 Estate';
  const date = '14/08/2023';
  const time = '6:23pm to 7:23pm';

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(accessCode);
    Alert.alert('Copied to clipboard');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `You're invited!\n\nName: ${name}\nAddress: ${address}\nDate: ${date}\nTime: ${time}\nCode: ${accessCode}`,
      });
    } catch (error) {
      Alert.alert('Failed to share');
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={20} color="#113E55" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <QrBox value={accessCode} />

      <View style={styles.codeRow}>
        <Text style={styles.code}>{accessCode}</Text>
        <Ionicons
          name="copy-outline"
          size={18}
          color="#113E55"
          onPress={copyToClipboard}
        />
      </View>
      
      <InviteCard
        name={name}
        address={address}
        date={date}
        time={time}
        code={accessCode}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleShare}>
        <Text style={styles.primaryButtonText}>Share Invite</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.cancelText}>Cancel Invite</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 100,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
        // marginBottom: 20,
    top: 70,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backText: {
    color: '#113E55',
    fontSize: 16,
    marginLeft: 5,
    fontFamily: 'UbuntuSans',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  code: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 6,
    color: '#113E55',
    marginRight: 8,
  },
  primaryButton: {
    backgroundColor: '#113E55',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 12,
    marginTop: 20,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  cancelText: {
    color: '#113E55',
    fontSize: 14,
    textDecorationLine: 'none',
  },
});
