import { StyleSheet, Text, View } from 'react-native';
import { multifieldTotal, scoreSummary, scoredItemsOf, selectionModeOf, toggleScored, type FormAnswers, type QuestionData } from '@kerhub/core/forms';
import { Card } from '@/components/ui';
import { colors } from '@/theme';
import { DiagnosisField } from './DiagnosisField';
import { Field, Label, Notice, OptionRow, decimal, str } from './parts';
import { SignatureField } from './SignatureField';
import { VitalsField } from './VitalsField';

export interface FieldProps {
  q: QuestionData;
  data: FormAnswers;
  all: QuestionData[];
  set: (key: string, value: unknown) => void;
  readOnly: boolean;
}

const RANGE_COLOR: Record<string, string> = {
  red: colors.danger,
  orange: '#c2410c',
  yellow: '#a16207',
  lime: '#4d7c0f',
  green: colors.success,
  blue: '#1d4ed8',
  gray: colors.ink,
};

function Body({ q, data, all, set, readOnly }: FieldProps) {
  switch (q.type) {
    case 'short':
    case 'paragraph':
      return <Field value={str(data[q.id])} onChangeText={(t) => set(q.id, t)} multiline={q.type === 'paragraph'} readOnly={readOnly} placeholder="Escribe aquí" />;

    case 'multiple':
    case 'dropdown':
      return (
        <View style={styles.options}>
          {(q.options ?? []).map((o) => (
            <OptionRow key={o} label={o} kind="radio" selected={data[q.id] === o} disabled={readOnly} onPress={() => set(q.id, data[q.id] === o ? '' : o)} />
          ))}
        </View>
      );

    case 'checkbox': {
      const chosen: string[] = Array.isArray(data[q.id]) ? data[q.id] : [];
      return (
        <View style={styles.options}>
          {(q.options ?? []).map((o) => (
            <OptionRow
              key={o}
              label={o}
              kind="check"
              selected={chosen.includes(o)}
              disabled={readOnly}
              onPress={() => set(q.id, chosen.includes(o) ? chosen.filter((x) => x !== o) : [...chosen, o])}
            />
          ))}
        </View>
      );
    }

    case 'scored_checkbox': {
      const selected: string[] = data[q.id]?.selectedOptions ?? [];
      const multiple = selectionModeOf(q) === 'multiple';
      return (
        <View style={styles.options}>
          {multiple && <Notice>Puedes elegir varias</Notice>}
          {scoredItemsOf(q).map((it) => {
            const on = selected.includes(it.id);
            return (
              <OptionRow
                key={it.id}
                label={it.text}
                kind={multiple ? 'check' : 'radio'}
                selected={on}
                disabled={readOnly}
                onPress={() => set(q.id, toggleScored(q, data[q.id], it.id))}
                right={
                  <View style={[styles.score, on && styles.scoreOn]}>
                    <Text style={[styles.scoreText, on && { color: '#fff' }]}>{it.score}</Text>
                  </View>
                }
              />
            );
          })}
        </View>
      );
    }

    case 'score_total': {
      const s = scoreSummary(q, data, all);
      const ranges = q.scoring?.enabled ? q.scoring.ranges ?? [] : [];
      return (
        <View style={{ gap: 6 }}>
          <Text style={styles.total}>
            {s.total}
            {s.maxScore ? <Text style={styles.max}> / {s.maxScore}</Text> : null}
          </Text>
          <Text style={[styles.interpretation, s.complete && s.range ? { color: RANGE_COLOR[s.range.color] ?? colors.ink } : null]}>
            {s.complete ? s.interpretation || 'Sin interpretación para este puntaje' : `Faltan ${s.sourceCount - s.answered} de ${s.sourceCount} ítems`}
          </Text>
          {ranges.map((r) => {
            const on = s.complete && s.range === r;
            return (
              <Text key={`${r.min}-${r.max}-${r.label}`} style={[styles.range, on && { color: RANGE_COLOR[r.color] ?? colors.ink, fontWeight: '700' }]}>
                {r.min === r.max ? r.min : `${r.min}–${r.max}`} · {r.label}
              </Text>
            );
          })}
        </View>
      );
    }

    case 'calculation':
      return <Text style={styles.calc}>{str(data[q.id]) || 'Se calcula automáticamente'}</Text>;

    case 'vitals':
      return <VitalsField q={q} data={data} set={set} readOnly={readOnly} />;

    case 'diagnosis':
      return <DiagnosisField q={q} data={data} set={set} readOnly={readOnly} />;

    case 'clinical':
      return (
        <View style={{ gap: 8 }}>
          <Field value={str(data[`${q.id}_title`])} onChangeText={(t) => set(`${q.id}_title`, t)} placeholder="Título" readOnly={readOnly} />
          <Field value={str(data[`${q.id}_detail`])} onChangeText={(t) => set(`${q.id}_detail`, t)} placeholder="Detalle" multiline readOnly={readOnly} />
        </View>
      );

    case 'multifield':
      return (
        <View style={{ gap: 8 }}>
          {(q.multifields ?? []).map((f) => (
            <View key={f.id} style={{ gap: 4 }}>
              <Text style={styles.sub}>{f.label}</Text>
              <Field
                value={str(data[`${q.id}_${f.id}`])}
                onChangeText={(t) => set(`${q.id}_${f.id}`, q.isCalculated ? decimal(t) : t)}
                keyboardType={q.isCalculated ? 'decimal-pad' : 'default'}
                readOnly={readOnly}
              />
            </View>
          ))}
          {q.isCalculated && (
            <View style={styles.totalRow}>
              <Text style={styles.sub}>Total calculado</Text>
              <Text style={styles.totalSmall}>{multifieldTotal(q, data)}</Text>
            </View>
          )}
        </View>
      );

    case 'signature':
      return <SignatureField q={q} data={data} set={set} readOnly={readOnly} />;

    case 'file':
      return <Notice>Las fotos y adjuntos desde el celular llegan en la próxima entrega. Por ahora se cargan en Doctor Ker web.</Notice>;

    case 'medication':
      return <Notice>Los medicamentos se formulan en Doctor Ker web, en la pestaña Medicamentos de la consulta.</Notice>;

    default:
      return <Notice>Este campo se diligencia en Doctor Ker web.</Notice>;
  }
}

/** Una pregunta del formato: título de sección o tarjeta con su campo. */
export function QuestionView({ missing, ...props }: FieldProps & { missing: boolean }) {
  const { q } = props;
  if (q.type === 'section') {
    return (
      <Text style={styles.section} accessibilityRole="header">
        {q.title}
      </Text>
    );
  }
  return (
    <Card style={missing ? styles.missing : undefined}>
      <Label q={q} title={q.type === 'vitals' ? q.title || 'Signos vitales' : undefined} />
      <Body {...props} />
      {missing && <Text style={styles.missingText}>Este campo es obligatorio.</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 10, letterSpacing: -0.3 },
  options: { gap: 8 },
  score: { minWidth: 34, height: 30, borderRadius: 9, backgroundColor: '#e9e6f0', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  scoreOn: { backgroundColor: colors.primary },
  scoreText: { fontSize: 14, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  total: { fontSize: 40, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  max: { fontSize: 18, fontWeight: '500', color: colors.muted },
  interpretation: { fontSize: 16, fontWeight: '700', color: colors.muted },
  range: { fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] },
  calc: { fontSize: 18, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 13, fontWeight: '600', color: colors.muted },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', backgroundColor: colors.primarySoft, borderRadius: 12, padding: 12 },
  totalSmall: { fontSize: 22, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  missing: { borderWidth: 1.5, borderColor: colors.danger },
  missingText: { fontSize: 13, color: colors.danger, fontWeight: '600' },
});
