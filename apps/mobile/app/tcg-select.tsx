import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from './components/GlassCard';
import { colors } from './theme';

const GAMES = [
  'Magic: The Gathering',
  'Pokémon TCG',
  'Yu-Gi-Oh!',
  'One Piece Card Game',
  'Disney Lorcana',
  'Star Wars: Unlimited',
  'Digimon Card Game',
  'Dragon Ball Super Fusion World',
  'Gundam Card Game',
  'Riftbound',
];

export default function TcgSelectScreen() {
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Selecionar TCG' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.hint}>Lista habilitada pelo tenant · ingestão modular por slug.</Text>
        {GAMES.map((g) => (
          <GlassCard key={g} style={styles.row}>
            <Text style={styles.name}>{g}</Text>
            <Text style={styles.meta}>Toque para associar sessão RAG (MVP)</Text>
          </GlassCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, gap: 12, paddingBottom: 32 },
  hint: { color: colors.textMuted, marginBottom: 8, fontSize: 13 },
  row: { marginBottom: 4 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16 },
  meta: { marginTop: 6, color: colors.textMuted, fontSize: 12 },
});
