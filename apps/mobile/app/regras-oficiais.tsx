import { Stack } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from './components/GlassCard';
import { colors } from './theme';

const LINKS: { title: string; subtitle: string; url: string }[] = [
  {
    title: 'Magic — Central de regras (Wizards)',
    subtitle:
      'A partir daqui você abre a CR, MTR, IPG e demais PDFs/HTML oficiais. O app ainda não embute o leitor; esta é a fonte canônica.',
    url: 'https://magic.wizards.com/en/rules',
  },
];

export default function RegrasOficiaisScreen() {
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'CR & oficiais' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <GlassCard>
          <Text style={styles.title}>Documentos oficiais</Text>
          <Text style={styles.body}>
            O MVP ainda não faz ingestão nem leitor embutido da CR. Aqui você abre as fontes oficiais
            no navegador. Depois, o RAG responderá com trechos indexados destes mesmos documentos.
          </Text>
          <Text style={styles.disclaimer}>
            Informações obtidas diretamente das regras oficiais publicadas pela publisher.
          </Text>
        </GlassCard>

        {LINKS.map((item) => (
          <Pressable
            key={item.url}
            accessibilityRole="link"
            style={({ pressed }) => [styles.linkCard, pressed && styles.linkPressed]}
            onPress={() => Linking.openURL(item.url)}
          >
            <Text style={styles.linkTitle}>{item.title}</Text>
            <Text style={styles.linkSub}>{item.subtitle}</Text>
            <Text style={styles.linkUrl}>{item.url}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, gap: 14, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  body: { marginTop: 10, color: colors.textMuted, lineHeight: 20 },
  disclaimer: {
    marginTop: 12,
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  linkCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  linkPressed: { opacity: 0.88 },
  linkTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
  linkSub: { marginTop: 6, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  linkUrl: { marginTop: 10, color: colors.accent, fontSize: 12 },
});
