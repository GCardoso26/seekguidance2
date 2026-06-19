import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from './components/GlassCard';
import { colors } from './theme';

export default function JudgeModeScreen() {
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Judge Mode' }} />
      <GlassCard>
        <Text style={styles.title}>Modo Juiz</Text>
        <Text style={styles.body}>
          Prompts técnicos, IPG/MTR/CR completos, lookup de infrações e políticas. Sempre exibir
          citações e versão do documento.
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
