import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BraulioEmpty } from '@/components/Braulio';
import { ScreenTitle } from '@/components/ScreenTitle';

export default function Pacientes() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, gap: 24 }} contentInsetAdjustmentBehavior="automatic">
      <ScreenTitle title="Pacientes" subtitle="Ficha e historial de tus pacientes." />
      <BraulioEmpty
        pose="historial"
        title="Aquí podrás buscar a tus pacientes"
        hint="Verás su ficha y el historial de atenciones. Por ahora, entra a la cita desde Mi día."
      />
    </ScrollView>
  );
}
