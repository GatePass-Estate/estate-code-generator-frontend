import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import InviteCard from './InviteCard';
import QrBox from './QrBox';
import { useLocalSearchParams, useNavigation } from 'expo-router';

export default function InvitePage() {
  const { name = "Sandra", code = "000 000" } = useLocalSearchParams();
  const navigation = useNavigation();

  const address = "Flat 1, 18A Something Street";
  const date = "14/08/2023";
  const time = "6:00pm to 7:00pm";

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(code);
    Alert.alert("Copied", "Code copied to clipboard");
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `You're invited!\n\nName: ${name}\nAddress: ${address}\nDate: ${date}\nTime: ${time}\nCode: ${code}`,
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

      <QrBox value={code} />

      <View style={styles.codeRow}>
        <Text style={styles.code}>{code}</Text>
        <Ionicons name="copy-outline" size={18} color="#113E55" onPress={copyToClipboard} />
      </View>

      <InviteCard
        name={name.toString()}
        address={address}
        date={date}
        time={time}
        code={code.toString()}
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
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#113E55',
    fontSize: 16,
    marginLeft: 5,
    fontFamily: "UbuntuSans",
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  cancelText: {
    color: '#113E55',
    textDecorationLine: 'none',
    fontSize: 14,
  },
});
