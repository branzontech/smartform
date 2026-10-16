import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedKeyboard, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';

/** Parte de la pantalla que cubre la hoja grande. */
const LARGE = 0.92;
/** Cuánto hay que arrastrar hacia abajo (o con qué velocidad) para cerrarla. */
const CLOSE_DISTANCE = 120;
const CLOSE_VELOCITY = 900;
/** Aire entre el borde de arriba de la pantalla y la hoja cuando el teclado la empuja. */
const TOP_GAP = 8;
const SPRING = { damping: 24, stiffness: 230, mass: 0.9 };

/**
 * Hoja que nace desde abajo: la forma de toda ventana con contenido en la app.
 * «large» cubre casi toda la pantalla (formularios, buscadores, detalle);
 * «auto» se ajusta a su contenido (confirmaciones). Sube con el teclado y se
 * encoge lo necesario para que el campo y sus botones queden siempre a la vista.
 * Se cierra arrastrando la barrita hacia abajo, tocando fuera o con «atrás».
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  title,
  size = 'large',
  dragToClose = true,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'large' | 'auto';
  /** Apagarlo donde el dedo dibuja (la firma). */
  dragToClose?: boolean;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const keyboard = useAnimatedKeyboard();
  const offset = useSharedValue(height);
  const shade = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      offset.value = height;
      offset.value = withSpring(0, SPRING);
      shade.value = withTiming(1, { duration: 220 });
    } else {
      shade.value = withTiming(0, { duration: 160 });
      offset.value = withTiming(height, { duration: 200 }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
  }, [visible, height, offset, shade]);

  const pan = Gesture.Pan()
    .enabled(dragToClose)
    .onUpdate((e) => {
      offset.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > CLOSE_DISTANCE || e.velocityY > CLOSE_VELOCITY) runOnJS(onClose)();
      else offset.value = withSpring(0, SPRING);
    });

  const topInset = insets.top;
  const bottomInset = insets.bottom;
  const sheetStyle = useAnimatedStyle(() => {
    const kb = keyboard.height.value;
    // Con el teclado arriba, la hoja se apoya sobre él y nunca pasa del borde superior.
    const room = height - kb - topInset - TOP_GAP;
    return {
      bottom: kb,
      paddingBottom: kb > 0 ? 8 : bottomInset + 8,
      ...(size === 'large' ? { height: Math.min(height * LARGE, room) } : { maxHeight: Math.min(height * LARGE, room) }),
      transform: [{ translateY: offset.value }],
    };
  });
  const shadeStyle = useAnimatedStyle(() => ({ opacity: shade.value }));

  if (!mounted) return null;
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[styles.shade, shadeStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
        </Animated.View>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <GestureDetector gesture={pan}>
            <View style={styles.grip} accessibilityRole="adjustable" accessibilityLabel="Arrastra hacia abajo para cerrar">
              <View style={styles.handle} />
              {title ? <Text style={styles.title}>{title}</Text> : null}
            </View>
          </GestureDetector>
          <View style={size === 'large' ? { flex: 1 } : { flexShrink: 1 }}>{children}</View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,22,28,0.42)' },
  sheet: { position: 'absolute', left: 0, right: 0, backgroundColor: colors.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  grip: { paddingTop: 10, paddingBottom: 6, paddingHorizontal: 20, gap: 10 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#d4d0de' },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
});
