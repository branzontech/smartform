import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

/** Entrada: con sesión va a Mi día; sin sesión, a iniciar sesión. */
export default function Index() {
  const { loading, me } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return <Redirect href={me ? '/mi-dia' : '/login'} />;
}
