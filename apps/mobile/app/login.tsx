import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from './components/GlassCard';
import { colors } from './theme';

export default function LoginScreen() {
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Login' }} />
      <GlassCard style={styles.card}>
        <Text style={styles.title}>Autenticação</Text>
        <Text style={styles.body}>
          Stubs: Google, Discord, Apple e modo convidado. OAuth + refresh tokens no backend FastAPI.
        </Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  card: { marginTop: 12 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  body: { marginTop: 10, color: colors.textMuted, lineHeight: 20 },
});
