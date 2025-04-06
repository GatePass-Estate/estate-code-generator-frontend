import { Stack } from 'expo-router';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View>
        <Stack.Screen options={{ headerShown: true }} />
        <Image 
          source={require('../../assets/images/Ghost.png')} // Replace with your image path
          style={{ width: 150, height: 150, left: 80, bottom: 50 }} 
          resizeMode="contain"
        />
        <Text style={{ fontSize: 23, fontWeight: 'light', color: '#D3D3D3', bottom: 50 }}>
          Click the '+'  to add your guest
        </Text>
      </View>
    </SafeAreaView>
  );
}
