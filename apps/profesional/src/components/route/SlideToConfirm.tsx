import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme';

const KNOB = 52;
const PAD = 4;
/** Desde esta fracción del recorrido se confirma al soltar. */
const CONFIRM_AT = 0.85;
const BACK = { duration: 220, easing: Easing.out(Easing.cubic) };

/**
 * Deslizar para confirmar (como en DiDi): para marcar la llegada hay que
 * arrastrar el botón hasta el final, así no se marca por un toque accidental.
 */
export function SlideToConfirm({ label, onConfirm, busy = false }: { label: string; onConfirm: () => void; busy?: boolean }) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const max = Math.max(0, width - KNOB - PAD * 2);

  const confirm = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    onConfirm();
  };

  const pan = Gesture.Pan()
    .enabled(!busy && max > 0)
    .onUpdate((e) => {
      x.value = Math.min(max, Math.max(0, e.translationX));
    })
    .onEnd(() => {
      if (x.value >= max * CONFIRM_AT) runOnJS(confirm)();
      x.value = withTiming(0, BACK);
    });

  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const hint = useAnimatedStyle(() => ({ opacity: max ? interpolate(x.value, [0, max * 0.6], [1, 0]) : 1 }));

  return (
    <GestureHandlerRootView>
      <View
        style={styles.track}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityActions={[{ name: 'activate', label }]}
        onAccessibilityAction={() => !busy && onConfirm()}>
        <Animated.Text style={[styles.label, hint]}>{label}</Animated.Text>
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.knob, knob]}>
            {busy ? <ActivityIndicator color={colors.primaryDark} /> : <Text style={styles.arrow}>›</Text>}
          </Animated.View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  track: { height: KNOB + PAD * 2, borderRadius: (KNOB + PAD * 2) / 2, backgroundColor: colors.ink, justifyContent: 'center', padding: PAD },
  label: { position: 'absolute', left: 0, right: 0, textAlign: 'center', paddingLeft: KNOB / 2, color: '#fff', fontSize: 15, fontWeight: '700' },
  knob: { width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 30, fontWeight: '700', color: colors.primaryDark, marginTop: -3 },
});
