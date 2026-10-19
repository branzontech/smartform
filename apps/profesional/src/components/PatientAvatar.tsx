import { memo } from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { AVATAR_SIZE, beamAvatar } from '@kerhub/core/avatar';

/** Avatar de persona como en Doctor Ker web (boring-avatars «beam»): el mismo nombre se ve igual en todo el sistema. */
export const PatientAvatar = memo(function PatientAvatar({ name, size = 44 }: { name: string; size?: number }) {
  const a = beamAvatar(name);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox={`0 0 ${AVATAR_SIZE} ${AVATAR_SIZE}`}>
        <Rect width={AVATAR_SIZE} height={AVATAR_SIZE} fill={a.backgroundColor} />
        <Rect x={0} y={0} width={AVATAR_SIZE} height={AVATAR_SIZE} transform={a.wrapperTransform} fill={a.wrapperColor} rx={a.isCircle ? 36 : 6} />
        <G transform={a.faceTransform}>
          {a.isMouthOpen ? (
            <Path d={a.mouthPath} stroke={a.faceColor} fill="none" strokeLinecap="round" />
          ) : (
            <Path d={a.mouthPath} fill={a.faceColor} />
          )}
          <Rect x={a.eyeLeftX} y={14} width={1.5} height={2} rx={1} fill={a.faceColor} />
          <Rect x={a.eyeRightX} y={14} width={1.5} height={2} rx={1} fill={a.faceColor} />
        </G>
      </Svg>
    </View>
  );
});
