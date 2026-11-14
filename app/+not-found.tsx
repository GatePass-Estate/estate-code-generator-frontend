import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn&apos;t exist.</Text>
        <Link href="/auth/login" style={styles.link}>
          <Text style={styles.linkText}>Go to login</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F6F7F7',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#113E55',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    color: '#113E55',
    textDecorationLine: 'underline',
  },
});
