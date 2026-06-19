import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '../theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

export function GlassCard({ children, style }: Props) {
  const useBlur = Platform.OS !== 'web';

  return (
    <View style={[styles.wrap, style]}>
      {useBlur ? (
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.webBlurFallback]} />
      )}
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.border} />
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.glassBg,
  },
  webBlurFallback: {
    backgroundColor: 'rgba(24, 28, 40, 0.85)',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  inner: {
    padding: 16,
  },
});
