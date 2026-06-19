import { Stack } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { GlassCard } from './components/GlassCard';
import { colors } from './theme';

export default function ChatScreen() {
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Chat IA' }} />
      <GlassCard>
        <Text style={styles.label}>Pergunta</Text>
        <TextInput
          placeholder="Ex.: Como funciona a stack no Magic?"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
        />
        <Text style={styles.disclaimer}>
          Informações obtidas diretamente das regras oficiais publicadas pela publisher.
        </Text>
      </GlassCard>
      <Text style={styles.note}>
        MVP: integrar POST /v1/chat/ask com game_slug, mode=player|judge e renderizar citações +
        confidence.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 20, gap: 14 },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: {
    minHeight: 96,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    textAlignVertical: 'top',
  },
  disclaimer: { marginTop: 12, fontSize: 11, color: colors.textMuted, fontStyle: 'italic' },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});
