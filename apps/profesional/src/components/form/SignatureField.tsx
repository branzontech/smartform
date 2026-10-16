import { useRef, useState } from 'react';
import { showAlert } from '@/components/overlay/Overlay';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import SignatureScreen, { type SignatureViewRef } from 'react-native-signature-canvas';
import type { FormAnswers, QuestionData } from '@kerhub/core/forms';
import { Button } from '@/components/ui';
import { colors } from '@/theme';
import { Notice } from './parts';
import { BottomSheet } from '@/components/overlay/BottomSheet';

/** El lienzo ocupa todo el recuadro, sin los botones propios de la librería. */
const PAD_STYLE = `
  .m-signature-pad { box-shadow: none; border: none; margin: 0; width: 100%; height: 100%; }
  .m-signature-pad--body { border: none; }
  .m-signature-pad--footer { display: none; margin: 0; }
  body, html { width: 100%; height: 100%; margin: 0; background: #fff; }
`;

/** Firma con el dedo; se guarda como imagen PNG dentro de la respuesta (igual que en la web). */
export function SignatureField({ q, data, set, readOnly }: { q: QuestionData; data: FormAnswers; set: (key: string, value: unknown) => void; readOnly: boolean }) {
  const value = typeof data[q.id] === 'string' ? (data[q.id] as string) : '';
  const [open, setOpen] = useState(false);
  const pad = useRef<SignatureViewRef>(null);

  return (
    <View style={{ gap: 10 }}>
      {value ? (
        <View style={styles.preview}>
          <Image source={{ uri: value }} style={{ width: '100%', height: 140 }} contentFit="contain" accessibilityLabel="Firma registrada" />
        </View>
      ) : (
        <Notice>{readOnly ? 'Sin firma.' : 'Aún no hay firma.'}</Notice>
      )}
      {!readOnly && (
        <View style={{ alignItems: 'flex-start' }}>
          <Button size="sm" title={value ? 'Firmar de nuevo' : 'Firmar'} variant="secondary" onPress={() => setOpen(true)} />
        </View>
      )}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={q.title} dragToClose={false}>
        <View style={styles.sheet}>
          <Notice>Firma con el dedo dentro del recuadro.</Notice>
          <View style={styles.padBox}>
            <SignatureScreen
              ref={pad}
              onOK={(img: string) => {
                set(q.id, img);
                setOpen(false);
              }}
              onEmpty={() => showAlert('Falta la firma', 'Firma dentro del recuadro antes de guardar.')}
              webStyle={PAD_STYLE}
              autoClear={false}
              imageType="image/png"
              penColor={colors.ink}
              backgroundColor="#ffffff"
            />
          </View>
          <View style={styles.row}>
            <Button title="Borrar" variant="secondary" onPress={() => pad.current?.clearSignature()} />
            <View style={{ flex: 1 }} />
            <Button title="Cancelar" variant="secondary" onPress={() => setOpen(false)} />
            <Button title="Guardar firma" onPress={() => pad.current?.readSignature()} />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  sheet: { flex: 1, paddingHorizontal: 16, gap: 12 },
  padBox: { flex: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
