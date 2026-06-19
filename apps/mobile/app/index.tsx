import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors } from './theme';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => router.replace('/(tabs)/judge'), 900);
    return () => clearTimeout(id);
  }, [router]);

  return (
    <LinearGradient colors={[colors.bgElevated, colors.bg]} style={styles.root}>
      <Text style={styles.logo}>⚖️</Text>
      <Text style={styles.title}>Judge TCG</Text>
      <Text style={styles.sub}>Rulings · Torneios · Comunidade</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },
  sub: { marginTop: 8, color: colors.textMuted, fontSize: 14, textAlign: 'center' },
});
