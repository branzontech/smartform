import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors } from '@/theme';

const PAD = 4;

/** Selector de vistas: riel redondeado con un indicador que se desliza a la opción elegida. */
export function SegmentedTabs<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const [width, setWidth] = useState(0);
  const segment = width > 0 ? (width - PAD * 2) / options.length : 0;
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const thumb = useAnimatedStyle(() => ({
    width: segment,
    transform: [{ translateX: withTiming(index * segment, { duration: 200, easing: Easing.out(Easing.cubic) }) }],
  }));

  return (
    <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="tablist">
      {segment > 0 && <Animated.View style={[styles.thumb, thumb]} />}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={styles.option} accessibilityRole="tab" accessibilityState={{ selected: active }}>
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14, padding: PAD },
  thumb: { position: 'absolute', top: PAD, bottom: PAD, left: PAD, borderRadius: 11, backgroundColor: colors.primary },
  option: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: colors.muted },
  labelActive: { color: '#fff' },
});
