import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BraulioEmpty } from '@/components/Braulio';
import { ScreenTitle } from '@/components/ScreenTitle';

export default function Ruta() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, gap: 24 }} contentInsetAdjustmentBehavior="automatic">
      <ScreenTitle title="Ruta" subtitle="Tus visitas a domicilio del día, en orden." />
      <BraulioEmpty
        pose="maletin"
        title="Aquí verás tu ruta en el mapa"
        hint="Podrás iniciar la ruta, ver el orden de las visitas y la IPS sabrá dónde vas. Mientras tanto, usa «Cómo llegar» en cada cita."
      />
    </ScrollView>
  );
}
