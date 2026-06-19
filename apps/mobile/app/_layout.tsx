import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { OfflineBanner } from '../components/OfflineBanner';
import { PushNotificationHandler } from '../components/PushNotificationHandler';
import { colors } from './theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <PushNotificationHandler />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <OfflineBanner />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bgElevated },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </View>
    </>
  );
}
