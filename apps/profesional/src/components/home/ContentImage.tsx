import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { contentImageUrl } from '@/lib/api';
import { Icon3D, type Icon3DName } from '@/components/Icon3D';
import { colors } from '@/theme';

/** Imagen de una publicación; sin imagen, el ícono 3D de su tipo sobre el tinte de la marca. */
export function ContentImage({ path, fallback, style, iconSize = 56 }: { path: string | null; fallback: Icon3DName; style: StyleProp<ViewStyle>; iconSize?: number }) {
  if (!path) {
    return (
      <View style={[styles.fallback, style]}>
        <Icon3D name={fallback} size={iconSize} />
      </View>
    );
  }
  return (
    <View style={[styles.frame, style]}>
      <Image source={{ uri: contentImageUrl(path) }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="disk" transition={200} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.primarySoft },
  fallback: { overflow: 'hidden', backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
});
