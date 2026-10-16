import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { colors } from '@/theme';

/** Menú inferior del profesional (barra nativa) con los íconos 3D de Doctor Ker. */
export default function TabsLayout() {
  return (
    <NativeTabs tintColor={colors.primary}>
      <NativeTabs.Trigger name="inicio">
        <NativeTabs.Trigger.Icon
          src={{ default: require('../../../assets/tabs/inicio-off.png'), selected: require('../../../assets/tabs/inicio.png') }}
          renderingMode="original"
        />
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="mi-dia">
        <NativeTabs.Trigger.Icon
          src={{ default: require('../../../assets/tabs/citas-off.png'), selected: require('../../../assets/tabs/citas.png') }}
          renderingMode="original"
        />
        <NativeTabs.Trigger.Label>Mi día</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ruta">
        <NativeTabs.Trigger.Icon
          src={{ default: require('../../../assets/tabs/zonas-off.png'), selected: require('../../../assets/tabs/zonas.png') }}
          renderingMode="original"
        />
        <NativeTabs.Trigger.Label>Ruta</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="pacientes">
        <NativeTabs.Trigger.Icon
          src={{ default: require('../../../assets/tabs/pacientes-off.png'), selected: require('../../../assets/tabs/pacientes.png') }}
          renderingMode="original"
        />
        <NativeTabs.Trigger.Label>Pacientes</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="perfil">
        <NativeTabs.Trigger.Icon
          src={{ default: require('../../../assets/tabs/medicos-off.png'), selected: require('../../../assets/tabs/medicos.png') }}
          renderingMode="original"
        />
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
