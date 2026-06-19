import { type Href, Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from './components/GlassCard';
import { colors } from './theme';

const disclaimer =
  'Informações obtidas diretamente das regras oficiais publicadas pela publisher.';

export default function HomeScreen() {
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Início' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <GlassCard style={styles.hero}>
          <Text style={styles.heroTitle}>TCG Judge</Text>
          <Text style={styles.heroBody}>
            Consulte CR, MTR, políticas e FAQs com citações oficiais. Modo Jogador ou Modo Juiz.
          </Text>
          <Text style={styles.disclaimer}>{disclaimer}</Text>
        </GlassCard>

        <Text style={styles.section}>Navegação</Text>
        <View style={styles.grid}>
          <Nav href="/regras-oficiais" label="CR & docs oficiais" emoji="📜" />
          <Nav href="/login" label="Login" emoji="🔐" />
          <Nav href="/tcg-select" label="Seleção de TCG" emoji="🎴" />
          <Nav href="/chat" label="Chat IA" emoji="💬" />
          <Nav href="/history" label="Histórico" emoji="🕘" />
          <Nav href="/favorites" label="Regras favoritas" emoji="⭐" />
          <Nav href="/judge-mode" label="Judge Mode" emoji="⚖️" />
          <Nav href="/admin" label="Admin" emoji="🛠️" />
          <Nav href="/settings" label="Configurações" emoji="⚙️" />
          <Nav href="/analytics" label="Analytics" emoji="📊" />
        </View>
      </ScrollView>
    </View>
  );
}

function Nav({ href, label, emoji }: { href: string; label: string; emoji: string }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.nav, pressed && styles.navPressed]}
      onPress={() => router.push(href as Href)}
    >
      <Text style={styles.navEmoji}>{emoji}</Text>
      <Text style={styles.navLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },
  hero: { marginBottom: 8 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  heroBody: { marginTop: 8, color: colors.textMuted, lineHeight: 20 },
  disclaimer: { marginTop: 12, fontSize: 11, color: colors.textMuted, fontStyle: 'italic' },
  section: { marginTop: 8, fontSize: 13, fontWeight: '700', color: colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  nav: {
    width: '47%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  navPressed: { opacity: 0.85 },
  navEmoji: { fontSize: 22, marginBottom: 6 },
  navLabel: { color: colors.text, fontWeight: '600', fontSize: 14 },
});
