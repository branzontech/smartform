import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInUp, FadeOutUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { BottomSheet } from './BottomSheet';

/**
 * Ventanas y avisos de la app (reemplazan a Alert del sistema).
 * - showAlert (misma forma que Alert.alert): con botones abre una hoja desde abajo;
 *   sin botones muestra un aviso oscuro arriba que se va solo.
 * - showNotice: mensaje importante en el centro de la pantalla (errores, falta completar),
 *   que se cierra con «Entendido».
 */
export interface SheetButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export type NoticeTone = 'error' | 'warning' | 'success';

export interface NoticeInput {
  title: string;
  message?: string;
  tone?: NoticeTone;
  /** Texto del botón; por defecto «Entendido». */
  action?: string;
  onClose?: () => void;
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

interface NoticeState extends NoticeInput {
  id: number;
}

/** Cuánto se ve un aviso. */
const TOAST_MS = 3600;
const NOTICE_IN = { duration: 180, easing: Easing.out(Easing.cubic) };

const TONE: Record<NoticeTone, { color: string; soft: string; glyph: string }> = {
  error: { color: colors.danger, soft: '#fdecec', glyph: '!' },
  warning: { color: '#b45309', soft: '#fdf3e2', glyph: '!' },
  success: { color: colors.success, soft: '#e8f6ee', glyph: '✓' },
};

let nextId = 1;
let sheetListener: ((s: SheetState | null) => void) | null = null;
let toastListener: ((t: ToastState | null) => void) | null = null;
let noticeListener: ((n: NoticeState | null) => void) | null = null;

export function showAlert(title: string, message?: string, buttons?: SheetButton[]) {
  if (!buttons || buttons.length === 0) {
    toastListener?.({ id: nextId++, title, message });
    return;
  }
  sheetListener?.({ id: nextId++, title, message, buttons });
}

export function showNotice(notice: NoticeInput) {
  noticeListener?.({ id: nextId++, tone: 'error', ...notice });
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

/** Mensaje importante en el centro: ícono de color, título grande y «Entendido». */
function Notice({ notice, onClose }: { notice: NoticeState; onClose: () => void }) {
  const tone = TONE[notice.tone ?? 'error'];
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, NOTICE_IN);
  }, [progress]);
  const card = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ scale: 0.94 + progress.value * 0.06 }] }));
  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const close = () => {
    onClose();
    notice.onClose?.();
  };
  return (
    <Modal transparent visible animationType="none" onRequestClose={close} statusBarTranslucent>
      <View style={styles.noticeRoot}>
        <Animated.View style={[styles.backdrop, backdrop]} />
        <Animated.View style={[styles.noticeCard, card]} accessibilityRole="alert" accessibilityViewIsModal>
          <View style={[styles.noticeIcon, { backgroundColor: tone.soft }]}>
            <Text style={[styles.noticeGlyph, { color: tone.color }]}>{tone.glyph}</Text>
          </View>
          <Text style={styles.noticeTitle}>{notice.title}</Text>
          {notice.message ? <Text style={styles.noticeMessage}>{notice.message}</Text> : null}
          <Pressable onPress={close} accessibilityRole="button" style={({ pressed }) => [styles.noticeButton, pressed && styles.pressed]}>
            <Text style={styles.noticeButtonText}>{notice.action ?? 'Entendido'}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** Se monta una vez en la raíz de la app. */
export function OverlayHost() {
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  useEffect(() => {
    sheetListener = setSheet;
    toastListener = setToast;
    noticeListener = setNotice;
    return () => {
      sheetListener = null;
      toastListener = null;
      noticeListener = null;
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
      {notice ? <Notice key={notice.id} notice={notice} onClose={() => setNotice(null)} /> : null}
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.duration(200)}
          exiting={FadeOutUp.duration(160)}
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
  noticeRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,22,28,0.45)' },
  noticeCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 18,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#14161c',
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  noticeIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  noticeGlyph: { fontSize: 28, fontWeight: '800' },
  noticeTitle: { fontSize: 20, fontWeight: '800', color: colors.ink, textAlign: 'center', letterSpacing: -0.3 },
  noticeMessage: { fontSize: 15, color: colors.muted, lineHeight: 22, textAlign: 'center' },
  noticeButton: { marginTop: 12, alignSelf: 'stretch', minHeight: 46, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  noticeButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  toastWrap: { position: 'absolute', left: 12, right: 12, zIndex: 50 },
  toast: {
    backgroundColor: '#1d1b26',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 3,
    shadowColor: '#14161c',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  toastTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  toastMessage: { fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 19 },
});
