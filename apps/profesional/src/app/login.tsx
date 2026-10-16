import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { ENVIRONMENTS } from '@/lib/config';
import { errorMessage } from '@/lib/api';
import { Button } from '@/components/ui';
import { Braulio } from '@/components/Braulio';
import { colors, radius } from '@/theme';

export default function Login() {
  const { signIn, environment, selectEnvironment } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) return setError('Escribe tu correo y tu contraseña.');
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace('/mi-dia');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
        <View style={styles.brand}>
          <Braulio pose="maletin" height={150} />
          <Text style={styles.logo}>
            Ker<Text style={{ color: colors.lime }}>Hub</Text>
          </Text>
          <Text style={styles.subtitle}>Profesional</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Bienvenido</Text>
          <Text style={styles.hint}>Entra con tu cuenta de Ker Hub.</Text>
          {ENVIRONMENTS.length > 1 && (
            <View style={styles.envs} accessibilityRole="radiogroup">
              {ENVIRONMENTS.map((e) => {
                const active = e.id === environment.id;
                return (
                  <Pressable
                    key={e.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      setError(null);
                      void selectEnvironment(e.id);
                    }}
                    style={[styles.env, active && styles.envActive]}>
                    <Text style={[styles.envLabel, active && { color: colors.primary }]}>{e.label}</Text>
                    <Text style={styles.envHint}>{e.description}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
          />
          {error && (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          )}
          <Button title="Entrar" busy={busy} onPress={submit} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  wrap: { flex: 1, justifyContent: 'center', padding: 20, gap: 20 },
  brand: { alignItems: 'center', gap: 2 },
  logo: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  card: { backgroundColor: colors.surface, borderRadius: 24, padding: 22, gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink },
  hint: { fontSize: 14, color: colors.muted, marginBottom: 4 },
  input: { height: 50, borderRadius: radius.control, backgroundColor: colors.canvas, paddingHorizontal: 14, fontSize: 16, color: colors.ink },
  error: { color: colors.danger, fontSize: 13 },
  envs: { flexDirection: 'row', gap: 8 },
  env: { flex: 1, borderRadius: radius.control, backgroundColor: colors.canvas, padding: 12, gap: 2 },
  envActive: { backgroundColor: colors.primarySoft },
  envLabel: { fontSize: 14, fontWeight: '700', color: colors.ink },
  envHint: { fontSize: 12, color: colors.muted },
});
