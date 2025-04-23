import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

import { StackNavigationProp } from '@react-navigation/stack';

type MyGuestProps = {
  navigation: StackNavigationProp<any>;
};

const MyGuest = ({ navigation }: MyGuestProps) => {
  return (
    <View style={styles.container}>
      <Text>No Guest</Text>
    </View>
  );
};

export default MyGuest;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
