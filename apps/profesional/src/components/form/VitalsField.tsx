import { useRef, type ReactNode } from 'react';
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

/** Enteros de 2 o 3 cifras: con 1 o 2 adelante llevan 3 (120, 210); con 3–9, dos (72, 90). */
const twoOrThree = (t: string) => t.length === 3 || (t.length === 2 && Number(t[0]) >= 3);

/**
 * Cómo se escribe cada signo: cuántos caracteres admite, si lleva decimales y
 * cuándo la lectura ya está completa para pasar solo al siguiente campo.
 * Peso no avanza solo: 7, 70 y 70.5 son todos válidos.
 */
const ENTRY: Record<string, { max: number; decimals: boolean; complete?: (t: string) => boolean }> = {
  heart_rate: { max: 3, decimals: false, complete: twoOrThree },
  respiratory_rate: { max: 2, decimals: false, complete: (t) => t.length === 2 },
  systolic_bp: { max: 3, decimals: false, complete: twoOrThree },
  diastolic_bp: { max: 3, decimals: false, complete: twoOrThree },
  oxygen_saturation: { max: 3, decimals: false, complete: (t) => t.length === 3 || (t.length === 2 && t[0] !== '1') },
  temperature: { max: 4, decimals: true, complete: (t) => /^\d{2}\.\d$/.test(t) },
  height: { max: 4, decimals: true, complete: (t) => /^\d\.\d{2}$/.test(t) || /^\d{3}$/.test(t) },
  weight: { max: 5, decimals: true },
};
const DEFAULT_ENTRY = { max: 6, decimals: true };

/** Solo cifras (y un separador decimal si el signo lo admite), cortado a su largo. */
function clean(text: string, decimals: boolean, max: number) {
  let t = decimal(text).replace(decimals ? /[^\d.]/g : /\D/g, '');
  const dot = t.indexOf('.');
  if (dot >= 0) t = t.slice(0, dot + 1) + t.slice(dot + 1).replace(/\./g, '');
  return t.slice(0, max);
}

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

/**
 * Signos vitales en baldosas: tensión en una sola, calculados (IMC, TAM) al día.
 * Cada campo admite solo su largo y, al completar la lectura, pasa al siguiente.
 */
export function VitalsField({ q, data, set, readOnly }: { q: QuestionData; data: FormAnswers; set: (key: string, value: unknown) => void; readOnly: boolean }) {
  const config = vitalsConfig(q);
  const value = (key: string) => vitalNumber(data, q.id, key);
  const calc = calculateVitals(config, value);
  const keys = VITAL_ORDER.filter((k) => config[k]?.enabled);
  // Orden en que se recorren los campos: el mismo en que se ven.
  const order = keys.filter((k) => !config[k].calculated);
  const refs = useRef<Record<string, TextInput | null>>({});

  const focusAfter = (key: string) => {
    const next = order[order.indexOf(key) + 1];
    if (next) refs.current[next]?.focus();
    else refs.current[key]?.blur();
  };

  const input = (key: string, label: string, width?: number) => {
    const entry = ENTRY[key] ?? DEFAULT_ENTRY;
    const current = str(data[`${q.id}_${key}`]);
    return (
      <TextInput
        ref={(r) => {
          refs.current[key] = r;
        }}
        value={current}
        onChangeText={(t) => {
          const next = clean(t, entry.decimals, entry.max);
          set(`${q.id}_${key}`, next);
          // Solo al escribir (no al borrar) y cuando la lectura quedó completa.
          if (next.length > current.length && entry.complete?.(next)) focusAfter(key);
        }}
        editable={!readOnly}
        keyboardType={entry.decimals ? 'decimal-pad' : 'number-pad'}
        maxLength={entry.max + 1}
        selectTextOnFocus
        placeholder="—"
        placeholderTextColor="#b9b5c6"
        accessibilityLabel={label}
        style={[styles.input, width ? { width, textAlign: 'center' } : { flex: 1 }]}
      />
    );
  };

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
              onChangeText={(t) => set(`${q.id}_custom_${cv.id}`, cv.valueType === 'number' ? clean(t, true, DEFAULT_ENTRY.max) : t)}
              editable={!readOnly}
              keyboardType={cv.valueType === 'number' ? 'decimal-pad' : 'default'}
              maxLength={cv.valueType === 'number' ? DEFAULT_ENTRY.max + 1 : 40}
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
