import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { BottomSheet } from './BottomSheet';

/**
 * Hoja de acciones y avisos de la app (reemplazan a Alert del sistema).
 * showAlert tiene la misma forma que Alert.alert: con botones abre una hoja
 * desde abajo; sin botones muestra un aviso arriba que se va solo.
 */
export interface SheetButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface SheetState {
  id: number;
  title: string;
  message?: string;
  buttons: SheetButton[];
}

interface ToastState {
  id: number;
  title: string;
  message?: string;
}

/** Cuánto se ve un aviso. */
const TOAST_MS = 3200;

let nextId = 1;
let sheetListener: ((s: SheetState | null) => void) | null = null;
let toastListener: ((t: ToastState | null) => void) | null = null;

export function showAlert(title: string, message?: string, buttons?: SheetButton[]) {
  if (!buttons || buttons.length === 0) {
    toastListener?.({ id: nextId++, title, message });
    return;
  }
  sheetListener?.({ id: nextId++, title, message, buttons });
}

function Sheet({ sheet, onClose }: { sheet: SheetState; onClose: () => void }) {
  const [visible, setVisible] = useState(true);
  const cancel = sheet.buttons.find((b) => b.style === 'cancel');
  const actions = sheet.buttons.filter((b) => b.style !== 'cancel');
  const pick = (b?: SheetButton) => {
    setVisible(false);
    // Deja bajar la hoja antes de abrir lo siguiente (otra hoja, una pantalla).
    setTimeout(() => {
      onClose();
      b?.onPress?.();
    }, 220);
  };
  return (
    <BottomSheet visible={visible} onClose={() => pick(cancel)} size="auto" title={sheet.title}>
      <View style={styles.body}>
        {sheet.message ? <Text style={styles.message}>{sheet.message}</Text> : null}
        <View style={styles.actions}>
          {actions.map((b, i) => (
            <Pressable
              key={`${b.text}-${i}`}
              onPress={() => pick(b)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.action, i > 0 && styles.divider, pressed && styles.pressed]}>
              <Text style={[styles.actionText, b.style === 'destructive' && { color: colors.danger }]}>{b.text}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => pick(cancel)} accessibilityRole="button" style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
          <Text style={styles.cancelText}>{cancel?.text ?? 'Cancelar'}</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

/** Se monta una vez en la raíz de la app. */
export function OverlayHost() {
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    sheetListener = setSheet;
    toastListener = setToast;
    return () => {
      sheetListener = null;
      toastListener = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast((cur) => (cur?.id === toast.id ? null : cur)), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      {sheet ? <Sheet key={sheet.id} sheet={sheet} onClose={() => setSheet(null)} /> : null}
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.springify().damping(20)}
          exiting={FadeOutUp.duration(180)}
          pointerEvents="box-none"
          style={[styles.toastWrap, { top: insets.top + 8 }]}>
          <Pressable onPress={() => setToast(null)} style={styles.toast} accessibilityRole="alert">
            <Text style={styles.toastTitle}>{toast.title}</Text>
            {toast.message ? <Text style={styles.toastMessage}>{toast.message}</Text> : null}
          </Pressable>
        </Animated.View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingBottom: 6, gap: 10 },
  message: { fontSize: 15, color: colors.muted, lineHeight: 21, paddingHorizontal: 4 },
  actions: { backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden' },
  action: { minHeight: 54, justifyContent: 'center', paddingHorizontal: 18 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  pressed: { opacity: 0.7 },
  actionText: { fontSize: 16, color: colors.ink },
  cancel: { minHeight: 54, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  toastWrap: { position: 'absolute', left: 12, right: 12, zIndex: 50 },
  toast: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 2,
    shadowColor: '#14161c',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  toastTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  toastMessage: { fontSize: 13, color: colors.muted, lineHeight: 18 },
});
