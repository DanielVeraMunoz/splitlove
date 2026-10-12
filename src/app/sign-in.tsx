import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const theme = useTheme();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isSignUp = mode === 'signUp';

  async function submit() {
    setLoading(true);
    setMessage(null);
    // keyboards often autocomplete with a trailing space
    const cleanEmail = email.trim();

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { display_name: displayName.trim() } },
        });
        if (error) setMessage(error.message);
        // With email confirmation enabled there is no session until the link is opened
        else if (!data.session) setMessage('Check your email to confirm your account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) setMessage(error.message);
      }
    } catch {
      // network failures reject instead of returning { error }
      setMessage('Something went wrong. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.form}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ThemedText type="title">Splitlove</ThemedText>

          {isSignUp && (
            <TextInput
              style={inputStyle}
              placeholder="Your name"
              placeholderTextColor={theme.textSecondary}
              value={displayName}
              onChangeText={setDisplayName}
            />
          )}
          <TextInput
            style={inputStyle}
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={inputStyle}
            placeholder="Password"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />

          {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}

          <Pressable
            style={[styles.button, { backgroundColor: theme.text }]}
            onPress={submit}
            disabled={loading || !email || !password || (isSignUp && !displayName.trim())}>
            {loading ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <ThemedText style={{ color: theme.background }}>
                {isSignUp ? 'Create account' : 'Sign in'}
              </ThemedText>
            )}
          </Pressable>

          <Pressable onPress={() => setMode(isSignUp ? 'signIn' : 'signUp')}>
            <ThemedText type="link">
              {isSignUp ? 'I already have an account' : 'Create an account'}
            </ThemedText>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  form: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
