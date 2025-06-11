import React, { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SecurityVerification() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);
  const router = useRouter(); // ✅ You forgot this line!

  const handleChange = (text, index) => {
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputs.current[index + 1].focus();
    }

    if (!text && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const validateCode = () => {
    const enteredCode = code.join('');
    Keyboard.dismiss();

    // Optional: Validate enteredCode here

    // ✅ Navigate to validation result page
    router.push('/(security)/(validationResult)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.subtitle}>Verify incoming {'\n'} guest’s code</Text>
      <Text style={styles.instructions}>Enter the code from guest here</Text>

      <View style={styles.inputRow}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={styles.inputBox}
            maxLength={1}
            keyboardType="text-pad"
            onChangeText={(text) => handleChange(text, index)}
            value={digit}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={validateCode}> 
        <Text style={styles.buttonText}>Validate Code</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
      fontFamily: 'ubuntu',
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#113E55',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    color: '#113E55',
    fontSize: 20,
    fontWeight: '400',
    fontFamily: 'Ubuntu',
    textAlign: 'center',
    marginBottom: 5,
  },
  instructions: {
    color: '#E76F51',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 150,
  },
  inputBox: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    width: 40,
    height: 50,
    textAlign: 'center',
    fontSize: 20,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  button: {
    backgroundColor: '#113E55',
    padding: 15,
    borderRadius: 8,
    width: 240,
    left: 40,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});
