import { SafeAreaView } from 'react-native-safe-area-context';
import { PropsWithChildren } from 'react';
import { Platform, KeyboardAvoidingView, StyleSheet, ViewStyle } from 'react-native';

export const isAndroid = Platform.OS === 'android';

const CustomSafeAreaView = ({ children, ...rest }: PropsWithChildren) => {

  return (
    <SafeAreaView style={[styles.container]} {...rest}>
      <KeyboardAvoidingView
        behavior={'height'}
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1"
        keyboardVerticalOffset={10}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CustomSafeAreaView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: !isAndroid ? 10 : 10,
  },
});
