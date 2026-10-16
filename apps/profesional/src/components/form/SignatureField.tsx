import { useRef, useState } from 'react';
import { showAlert } from '@/components/overlay/Overlay';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SignatureScreen, { type SignatureViewRef } from 'react-native-signature-canvas';
import type { FormAnswers, QuestionData } from '@kerhub/core/forms';
import { Button } from '@/components/ui';
import { colors } from '@/theme';
import { Notice } from './parts';

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
  const insets = useSafeAreaInsets();

  return (
    <View style={{ gap: 10 }}>
      {value ? (
        <View style={styles.preview}>
          <Image source={{ uri: value }} style={{ width: '100%', height: 140 }} contentFit="contain" accessibilityLabel="Firma registrada" />
        </View>
      ) : (
        <Notice>{readOnly ? 'Sin firma.' : 'Aún no hay firma.'}</Notice>
      )}
      {!readOnly && <Button title={value ? 'Firmar de nuevo' : 'Firmar'} variant="secondary" onPress={() => setOpen(true)} />}

      <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setOpen(false)}>
        <View style={[styles.sheet, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.title}>{q.title}</Text>
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
          <Button title="Guardar firma" onPress={() => pad.current?.readSignature()} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Button title="Borrar" variant="secondary" onPress={() => pad.current?.clearSignature()} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Cancelar" variant="secondary" onPress={() => setOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  sheet: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink },
  padBox: { flex: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', gap: 10 },
});
