import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from './components/GlassCard';
import { colors } from './theme';

export default function AnalyticsScreen() {
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Analytics' }} />
      <GlassCard>
        <Text style={styles.title}>Telemetria</Text>
        <Text style={styles.body}>
          Eventos estruturados, latência RAG, taxa de citação, erros de ingestão — export OTel +
          dashboards.
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
