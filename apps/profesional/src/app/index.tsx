import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

/** Entrada: con sesión va al Inicio; sin sesión, a iniciar sesión (la bienvenida cubre la espera). */
export default function Index() {
  const { loading, me } = useAuth();
  if (loading) return <View style={{ flex: 1, backgroundColor: colors.primary }} />;
  return <Redirect href={me ? '/inicio' : '/login'} />;
}
