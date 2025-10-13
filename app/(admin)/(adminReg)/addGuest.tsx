import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const GENDERS = ["Female", "Male", "I'd prefer not to say"];
const RELATIONSHIPS = [
  "Spouse",
  "Friends",
  "Family",
  "Delivery",
  "Taxi",
  "Service Provider",
];

export default function AddGuestScreen() {
  const [name, setName] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedRelationships, setSelectedRelationships] = useState<string[]>(
    []
  );
  const [otherRelationship, setOtherRelationship] = useState<string>("");
  const [saveToList, setSaveToList] = useState<boolean>(false);

  function toggleRelationship(rel: string) {
    setSelectedRelationships((prev) =>
      prev.includes(rel) ? prev.filter((r) => r !== rel) : [...prev, rel]
    );
  }

  function handleSaveGuest() {
    if (!name.trim()) {
      Alert.alert("Validation", "Please enter the guest's name.");
      return;
    }
    if (!selectedGender) {
      Alert.alert("Validation", "Please select a gender.");
      return;
    }
    if (selectedRelationships.length === 0 && !otherRelationship.trim()) {
      Alert.alert("Validation", "Please select or enter a relationship.");
      return;
    }
    const payload = {
      name: name.trim(),
      gender: selectedGender,
      relationships: [
        ...selectedRelationships,
        ...(otherRelationship.trim() ? [otherRelationship.trim()] : []),
      ],
      saveToList,
    };

    console.log("Save guest:", payload);
    Alert.alert("Success", "Guest saved (see console).");
  }

  function handleGenerateCode() {
    const code = Math.random().toString(36).slice(2, 9).toUpperCase();
    Alert.alert("Generated Code", code);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Add Guest</Text>
          <Text style={styles.subtitle}>
            Fill in your guest details, it will take only a couple of minutes
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            placeholder="Enter guest name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            returnKeyType="done"
            accessibilityLabel="Guest name"
          />

          <Text style={[styles.label, { marginTop: 18 }]}>Select Gender</Text>
          <View style={styles.row}>
            {GENDERS.map((g) => {
              const active = selectedGender === g;
              return (
                <Pressable
                  key={g}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedGender(g)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {g}
                  </Text>
                  {active && (
                    <MaterialIcons
                      name="check-circle"
                      size={18}
                      color="#2f855a"
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { marginTop: 18 }]}>
            Select your relationship with guest
          </Text>
          <View style={styles.rowWrap}>
            {RELATIONSHIPS.map((r) => {
              const active = selectedRelationships.includes(r);
              return (
                <Pressable
                  key={r}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleRelationship(r)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {r}
                  </Text>
                  {active && (
                    <MaterialIcons
                      name="check-circle"
                      size={18}
                      color="#2f855a"
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { marginTop: 14 }]}>Other:</Text>
          <TextInput
            placeholder="Specify other relationship"
            value={otherRelationship}
            onChangeText={setOtherRelationship}
            style={[styles.input, { marginTop: 8 }]}
            accessibilityLabel="Other relationship"
          />
        </View>

        <View style={styles.saveRow}>
          <Switch
            value={saveToList}
            onValueChange={setSaveToList}
            accessibilityRole="switch"
            accessibilityState={{ checked: saveToList }}
          />
          <Text style={styles.saveLabel}>Save details to my guest list</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSaveGuest}
          >
            <Text style={styles.buttonText}>Save Guest</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.generateButton]}
            onPress={handleGenerateCode}
          >
            <Text style={styles.buttonText}>Generate Code</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    marginBottom: 8,
    maxWidth: 880,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0b1a18",
    marginBottom: 6,
  },
  subtitle: {
    color: "#c05621",
    fontSize: 13,
  },
  card: {
    borderWidth: 1,
    borderColor: "#d8e3e0",
    borderRadius: 8,
    padding: 16,
    marginTop: 18,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  label: {
    fontSize: 13,
    color: "#667a75",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f7f6",
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#0b1a18",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f3f6f5",
    marginRight: 10,
    marginTop: 6,
  },
  chipActive: {
    backgroundColor: "#e6f4ef",
    borderWidth: 1,
    borderColor: "#cfe7db",
  },
  chipText: {
    marginRight: 8,
    color: "#1f3a36",
    fontSize: 14,
  },
  chipTextActive: {
    fontWeight: "600",
  },
  saveRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  saveLabel: {
    marginLeft: 8,
    color: "#2f5a54",
    fontSize: 14,
  },
  buttonRow: {
    marginTop: 26,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  button: {
    minWidth: 140,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#2f7e6a",
  },
  generateButton: {
    backgroundColor: "#243a3f",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
