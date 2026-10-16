import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import { colors } from '@/theme';

export interface MenuAction {
  label: string;
  destructive?: boolean;
  onPress: () => void;
}

const MENU_WIDTH = 248;
const ROW_HEIGHT = 50;
const EDGE = 12;

/**
 * «···» que abre un menú flotante anclado a sí mismo (sin oscurecer la pantalla).
 * Es el menú de acciones de la app: las de borrar o cancelar van al final, en rojo.
 */
export function MoreButton({ actions, label = 'Más acciones', size = 36 }: { actions: MenuAction[]; label?: string; size?: number }) {
  const ref = useRef<View>(null);
  const { width, height } = useWindowDimensions();
  const [anchor, setAnchor] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  if (actions.length === 0) return null;

  const open = () => ref.current?.measureInWindow((x, y, w, h) => setAnchor({ x, y, w, h }));
  const close = () => setAnchor(null);
  const menuHeight = actions.length * ROW_HEIGHT;
  const below = anchor ? anchor.y + anchor.h + 6 : 0;
  const top = anchor && below + menuHeight > height - 40 ? Math.max(EDGE + 40, anchor.y - menuHeight - 6) : below;
  const right = anchor ? Math.min(Math.max(EDGE, width - (anchor.x + anchor.w)), width - MENU_WIDTH - EDGE) : EDGE;

  return (
    <>
      <Pressable
        ref={ref}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={6}
        style={({ pressed }) => [styles.button, { width: size, height: size }, pressed && { backgroundColor: colors.primarySoft }]}>
        <Text style={styles.dots}>···</Text>
      </Pressable>
      <Modal transparent visible={!!anchor} animationType="none" onRequestClose={close} statusBarTranslucent>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Cerrar menú" />
        {anchor ? (
          <Animated.View entering={ZoomIn.duration(140)} exiting={FadeOut.duration(120)} style={[styles.menu, { top, right }]}>
            {actions.map((a, i) => (
              <Pressable
                key={`${a.label}-${i}`}
                onPress={() => {
                  close();
                  // Deja cerrar el menú antes de abrir lo siguiente (una hoja, otra pantalla).
                  setTimeout(a.onPress, 160);
                }}
                accessibilityRole="menuitem"
                style={({ pressed }) => [styles.item, i > 0 && styles.divider, pressed && { backgroundColor: colors.canvas }]}>
                <Text style={[styles.itemText, a.destructive && { color: colors.danger }]}>{a.label}</Text>
              </Pressable>
            ))}
          </Animated.View>
        ) : null}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dots: { color: colors.muted, fontSize: 20, fontWeight: '700', marginTop: -6 },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#14161c',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  item: { minHeight: ROW_HEIGHT, justifyContent: 'center', paddingHorizontal: 16 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  itemText: { fontSize: 15, color: colors.ink },
});
