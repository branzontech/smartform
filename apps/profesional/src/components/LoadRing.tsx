import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

/** Anillo fino que se llena según la carga (0 a 1). El contenido va al centro. */
export function LoadRing({
  size,
  progress,
  color,
  track,
  stroke = 2.5,
  children,
}: {
  size: number;
  progress: number;
  color: string;
  track: string;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  const c = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        {p > 0 && (
          <Circle
            cx={c}
            cy={c}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference * p} ${circumference}`}
            rotation={-90}
            origin={`${c}, ${c}`}
          />
        )}
      </Svg>
      {children}
    </View>
  );
}
