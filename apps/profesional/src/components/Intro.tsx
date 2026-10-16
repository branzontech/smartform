import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeOut, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Braulio } from './Braulio';
import { colors } from '@/theme';

/**
 * Bienvenida al abrir la app: continúa la pantalla de arranque nativa (mismo
 * morado y Braulio en el centro) y se desvanece cuando la app está lista.
 */
export function Intro({ onShown }: { onShown?: () => void }) {
  const lift = useSharedValue(0);
  const scale = useSharedValue(0.86);
  const words = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
    words.value = withDelay(180, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    // Braulio flota mientras carga.
    lift.value = withDelay(500, withRepeat(withSequence(withTiming(-8, { duration: 700 }), withTiming(0, { duration: 700 })), -1));
  }, [lift, scale, words]);

  const braulio = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }, { scale: scale.value }] }));
  const brand = useAnimatedStyle(() => ({ opacity: words.value, transform: [{ translateY: (1 - words.value) * 12 }] }));

  return (
    <Animated.View style={styles.screen} exiting={FadeOut.duration(380)} onLayout={onShown}>
      <View style={styles.center}>
        <Animated.View style={braulio}>
          <Braulio pose="maletin" height={190} />
        </Animated.View>
        <Animated.View style={[styles.brand, brand]}>
          <Text style={styles.logo}>
            <Text style={{ fontWeight: '400' }}>Doctor </Text><Text style={{ color: colors.lime }}>Ker</Text>
          </Text>
          <Text style={styles.tagline}>Profesional</Text>
        </Animated.View>
      </View>
      <Animated.Text style={[styles.foot, brand]}>Branzon Tech</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  center: { alignItems: 'center', gap: 18 },
  brand: { alignItems: 'center', gap: 2 },
  logo: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.82)' },
  foot: { position: 'absolute', bottom: 48, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
});
