import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from './components/GlassCard';
import { colors } from './theme';

export default function HistoryScreen() {
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Histórico' }} />
      <GlassCard>
        <Text style={styles.title}>Conversas</Text>
        <Text style={styles.body}>Lista paginada por conversation_id + game_id (Postgres).</Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  body: { marginTop: 8, color: colors.textMuted, lineHeight: 20 },
});
