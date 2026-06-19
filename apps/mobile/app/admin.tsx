import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from './components/GlassCard';
import { colors } from './theme';

export default function AdminScreen() {
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Admin' }} />
      <GlassCard>
        <Text style={styles.title}>Painel administrativo</Text>
        <Text style={styles.body}>
          Web app separado (Next.js sugerido) consumindo mesmas APIs com RBAC. Mobile: visão
          reduzida apenas para staff.
        </Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  body: { marginTop: 8, color: colors.textMuted, lineHeight: 20 },
});
