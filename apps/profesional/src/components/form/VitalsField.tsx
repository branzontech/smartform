import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import {
  VITAL_ORDER,
  bloodPressureState,
  bmiClassification,
  calculateVitals,
  vitalDecimals,
  vitalNumber,
  vitalRangeState,
  vitalsConfig,
  type FormAnswers,
  type QuestionData,
  type VitalState,
} from '@kerhub/core/forms';
import { colors } from '@/theme';
import { decimal, str } from './parts';

const TONE = { ok: colors.success, warn: colors.warning, bad: colors.danger };
const BMI_COLOR: Record<string, string> = { blue: '#1d4ed8', green: colors.success, yellow: '#a16207', orange: '#c2410c', red: colors.danger, darkred: '#991b1b' };

function Tile({ label, state, calculated, children }: { label: string; state?: { label: string; color: string } | null; calculated?: boolean; children: ReactNode }) {
  return (
    <View style={[styles.tile, calculated && styles.calc]}>
      <Text style={styles.tileLabel}>{label}</Text>
      <View style={styles.valueRow}>{children}</View>
      <Text style={[styles.state, state && { color: state.color }]}>{state?.label ?? ' '}</Text>
    </View>
  );
}

const toState = (s: VitalState | null) => (s ? { label: s.label, color: TONE[s.tone] } : null);

/** Signos vitales en baldosas: tensión en una sola, calculados (IMC, TAM) al día. */
export function VitalsField({ q, data, set, readOnly }: { q: QuestionData; data: FormAnswers; set: (key: string, value: unknown) => void; readOnly: boolean }) {
  const config = vitalsConfig(q);
  const value = (key: string) => vitalNumber(data, q.id, key);
  const calc = calculateVitals(config, value);
  const keys = VITAL_ORDER.filter((k) => config[k]?.enabled);
  const input = (key: string, label: string, width?: number) => (
    <TextInput
      value={str(data[`${q.id}_${key}`])}
      onChangeText={(t) => set(`${q.id}_${key}`, decimal(t))}
      editable={!readOnly}
      keyboardType="decimal-pad"
      placeholder="—"
      placeholderTextColor="#b9b5c6"
      accessibilityLabel={label}
      style={[styles.input, width ? { width, textAlign: 'center' } : { flex: 1 }]}
    />
  );

  return (
    <View style={styles.grid}>
      {keys.map((key) => {
        const v = config[key];
        if (key === 'systolic_bp' && config.diastolic_bp?.enabled) {
          return (
            <Tile key={key} label="Tensión arterial" state={toState(bloodPressureState(value('systolic_bp'), value('diastolic_bp')))}>
              {input('systolic_bp', 'Tensión sistólica', 52)}
              <Text style={styles.slash}>/</Text>
              {input('diastolic_bp', 'Tensión diastólica', 52)}
              <Text style={styles.unit}>mmHg</Text>
            </Tile>
          );
        }
        if (key === 'diastolic_bp' && config.systolic_bp?.enabled) return null;
        if (v.calculated) {
          const n = calc[key];
          const bmi = key === 'bmi' && n && (q.showBmiClassification ?? true) ? bmiClassification(n) : null;
          return (
            <Tile key={key} label={`${v.label} · calculado`} calculated state={bmi ? { label: bmi.label, color: BMI_COLOR[bmi.color] } : null}>
              <Text style={styles.calcValue}>{n != null ? n.toFixed(vitalDecimals(key)) : '—'}</Text>
              <Text style={styles.unit}>{v.unit}</Text>
            </Tile>
          );
        }
        return (
          <Tile key={key} label={v.label} state={toState(vitalRangeState(key, value(key)))}>
            {input(key, v.label)}
            <Text style={styles.unit}>{v.unit}</Text>
          </Tile>
        );
      })}
      {(q.customVitals ?? []).map((cv) =>
        cv.calculated ? (
          <Tile key={cv.id} label={`${cv.label} · calculado`} calculated>
            <Text style={styles.calcValue}>—</Text>
            <Text style={styles.unit}>{cv.unit}</Text>
          </Tile>
        ) : (
          <Tile key={cv.id} label={cv.label}>
            <TextInput
              value={str(data[`${q.id}_custom_${cv.id}`])}
              onChangeText={(t) => set(`${q.id}_custom_${cv.id}`, cv.valueType === 'number' ? decimal(t) : t)}
              editable={!readOnly}
              keyboardType={cv.valueType === 'number' ? 'decimal-pad' : 'default'}
              placeholder="—"
              placeholderTextColor="#b9b5c6"
              style={[styles.input, { flex: 1 }]}
            />
            <Text style={styles.unit}>{cv.unit}</Text>
          </Tile>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', flexGrow: 1, borderRadius: 14, backgroundColor: colors.canvas, paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
  calc: { backgroundColor: colors.primarySoft },
  tileLabel: { fontSize: 12, fontWeight: '600', color: colors.muted },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  input: { fontSize: 24, fontWeight: '700', color: colors.ink, paddingVertical: 2, fontVariant: ['tabular-nums'] },
  calcValue: { fontSize: 24, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  slash: { fontSize: 20, color: colors.muted },
  unit: { fontSize: 12, color: colors.muted },
  state: { fontSize: 12, fontWeight: '700', color: colors.muted, minHeight: 16 },
});
