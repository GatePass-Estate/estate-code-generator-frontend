import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Clipboard,
  Alert,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { MaterialIcons } from "@expo/vector-icons";

const invite = {
  name: "Sandra Happiness",
  address: "Flat 1, 18A Olayinka Something Street, U3 Estate",
  date: "14/08/2023",
  timeframe: "6:23pm to 7:23pm",
  code: "56T73E",
};

export default function ShareInvitePage() {
  const handleCopy = () => {
    Clipboard.setString(invite.code);
    Alert.alert("Copied", "Access code copied to clipboard!");
  };

  const handleShare = () => {
    Alert.alert("Share", "Invite shared!");
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Share Invite</Text>
      <Text style={styles.subtitle}>Share the information to your guest</Text>
      <View style={styles.contentRow}>
        <View style={styles.qrSection}>
          <View style={styles.qrBox}>
            <QRCode
              value={invite.code}
              size={180}
              backgroundColor="#fff"
              color="#fff"
            />
          </View>
          <View style={styles.codeRow}>
            <Text style={styles.code}>{invite.code}</Text>
            <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
              <MaterialIcons name="content-copy" size={22} color="#243a3f" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Invite Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name :</Text>
            <Text style={styles.detailValue}>{invite.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address :</Text>
            <Text style={styles.detailValue}>{invite.address}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date :</Text>
            <Text style={styles.detailValue}>{invite.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Timeframe :</Text>
            <Text style={styles.detailValue}>{invite.timeframe}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>One time access code :</Text>
            <Text style={styles.detailValue}>{invite.code}</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share invite</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 32,
    paddingTop: 36,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#0b1a18",
  },
  subtitle: {
    color: "#c05621",
    fontSize: 15,
    marginBottom: 32,
    marginTop: 4,
  },
  contentRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 36,
  },
  qrSection: {
    alignItems: "center",
    marginRight: 32,
  },
  qrBox: {
    backgroundColor: "#F15A29",
    borderRadius: 16,
    padding: 24,
    marginBottom: 18,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  code: {
    fontSize: 32,
    letterSpacing: 12,
    fontWeight: "700",
    color: "#243a3f",
  },
  copyBtn: {
    marginLeft: 6,
    padding: 4,
  },
  detailsCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#b5c6c3",
    borderRadius: 10,
    padding: 24,
    backgroundColor: "#fff",
    minWidth: 320,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  detailsTitle: {
    color: "#c05621",
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 18,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  detailLabel: {
    color: "#667a75",
    fontSize: 15,
    minWidth: 120,
  },
  detailValue: {
    color: "#0b1a18",
    fontSize: 15,
    fontWeight: "500",
    flexShrink: 1,
  },
  shareBtn: {
    marginTop: 24,
    backgroundColor: "#243a3f",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  shareBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
