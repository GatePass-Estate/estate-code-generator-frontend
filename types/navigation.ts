export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Admin: undefined;
  NotFound: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Admin: undefined;
};

// For useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
