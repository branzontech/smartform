import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { Braulio } from '@/components/Braulio';
import { ScreenTitle } from '@/components/ScreenTitle';
import { Button, Card } from '@/components/ui';
import { colors } from '@/theme';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  doctor: 'Médico',
  nurse: 'Enfermería',
  receptionist: 'Recepción',
  patient: 'Paciente',
  user: 'Usuario',
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export default function Perfil() {
  const { me, environment, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const confirmSignOut = () =>
    Alert.alert('Cerrar sesión', 'Tendrás que volver a entrar con tu correo y contraseña.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);

  return (
    <ScrollView contentContainerStyle={[styles.page, { paddingTop: insets.top + 12 }]} contentInsetAdjustmentBehavior="automatic">
      <ScreenTitle title="Perfil" />
      <View style={styles.hero}>
        <Braulio pose="medicamento" height={130} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.name}>{me?.user.name ?? ''}</Text>
          <Text style={styles.email}>{me?.user.email ?? ''}</Text>
        </View>
      </View>
      <Card>
        <Row label="Empresa" value={me?.empresa?.nombre ?? 'Sin empresa'} />
        <Row label="Rol" value={ROLE_LABEL[me?.empresa?.rol ?? ''] ?? me?.empresa?.rol ?? '—'} />
        <Row label="Ambiente" value={environment.label} />
        <Row label="Versión" value={Constants.expoConfig?.version ?? '—'} />
      </Card>
      <Button title="Cerrar sesión" variant="danger" onPress={confirmSignOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 16, paddingBottom: 40 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  name: { fontSize: 20, fontWeight: '700', color: colors.ink },
  email: { fontSize: 14, color: colors.muted },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6 },
  label: { fontSize: 14, color: colors.muted },
  value: { fontSize: 14, color: colors.ink, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});
