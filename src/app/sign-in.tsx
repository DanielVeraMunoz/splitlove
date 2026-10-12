import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { useCelebration } from '@/components/celebration';
import { Wordmark } from '@/components/wordmark';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const theme = useTheme();
  const { celebrate } = useCelebration();
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
        else if (!data.session) setMessage(t('auth.checkEmail'));
        else celebrate();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) setMessage(error.message);
        else celebrate();
      }
    } catch {
      // network failures reject instead of returning { error }
      setMessage(t('common.networkError'));
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
          <Wordmark size={48} />

          {isSignUp && (
            <TextInput
              style={inputStyle}
              placeholder={t('auth.yourName')}
              placeholderTextColor={theme.textSecondary}
              value={displayName}
              onChangeText={setDisplayName}
            />
          )}
          <TextInput
            style={inputStyle}
            placeholder={t('auth.email')}
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={inputStyle}
            placeholder={t('auth.password')}
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />

          {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}

          <Button
            label={isSignUp ? t('auth.createAccount') : t('auth.signIn')}
            onPress={submit}
            loading={loading}
            disabled={!email || !password || (isSignUp && !displayName.trim())}
          />

          <Pressable onPress={() => setMode(isSignUp ? 'signIn' : 'signUp')}>
            <ThemedText type="link" style={styles.centered}>
              {isSignUp ? t('auth.switchToSignIn') : t('auth.switchToSignUp')}
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
  centered: { textAlign: 'center' },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontFamily: FontFamily.body,
    fontSize: 16,
  },
});
