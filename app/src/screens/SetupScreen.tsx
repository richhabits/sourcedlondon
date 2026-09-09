import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, ScrollView, Linking } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { setBackendConfig, testBackendConnection } from '../backend';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Setup'>;

export default function SetupScreen({ navigation }: Props) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'error'>('idle');
  const [error, setError] = useState('');

  async function connect() {
    setStatus('testing');
    setError('');
    const trimmedUrl = url.trim().replace(/\/+$/, '');
    const trimmedKey = anonKey.trim();
    if (!trimmedUrl.startsWith('https://') || !trimmedUrl.includes('.supabase.co')) {
      setStatus('error');
      setError('That doesn’t look like a Supabase Project URL — it should look like https://xxxx.supabase.co');
      return;
    }
    if (trimmedKey.length < 20) {
      setStatus('error');
      setError('That anon key looks too short — copy it in full from Project Settings → API.');
      return;
    }
    const result = await testBackendConnection({ url: trimmedUrl, anonKey: trimmedKey });
    if (!result.ok) {
      setStatus('error');
      setError(result.error || 'Could not connect. Double-check the URL and key, and that schema.sql has been run.');
      return;
    }
    await setBackendConfig({ url: trimmedUrl, anonKey: trimmedKey });
    navigation.replace('Vehicles');
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Connect your backend</Text>
      <Text style={styles.title}>One step to go live</Text>
      <Text style={styles.lede}>
        This app connects to the same Supabase project as your Sourced London website — no separate
        setup, no extra cost. Paste the two values from Project Settings → API.
      </Text>

      <Text style={styles.label}>Project URL</Text>
      <TextInput
        style={styles.input}
        placeholder="https://xxxxxxxx.supabase.co"
        placeholderTextColor={colors.ivoryMuted}
        autoCapitalize="none"
        autoCorrect={false}
        value={url}
        onChangeText={setUrl}
      />

      <Text style={styles.label}>anon public key</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        placeholder="eyJhbGciOi..."
        placeholderTextColor={colors.ivoryMuted}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        value={anonKey}
        onChangeText={setAnonKey}
      />

      {status === 'error' && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={connect} disabled={status === 'testing'}>
        {status === 'testing' ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text style={styles.buttonText}>Test &amp; connect</Text>
        )}
      </Pressable>

      <Pressable onPress={() => Linking.openURL('https://supabase.com/dashboard')}>
        <Text style={styles.link}>Don’t have a Supabase project yet? Create one free →</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(6), paddingTop: spacing(16), gap: spacing(3) },
  eyebrow: { color: colors.gold, fontFamily: 'Manrope_700Bold', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { color: colors.ivory, fontFamily: 'BodoniModa_600SemiBold', fontSize: 30, marginBottom: spacing(1) },
  lede: { color: colors.ivoryMuted, fontFamily: 'Manrope_400Regular', fontSize: 15, lineHeight: 22, marginBottom: spacing(4) },
  label: { color: colors.ivory, fontFamily: 'Manrope_600SemiBold', fontSize: 13, marginTop: spacing(2) },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing(3),
    color: colors.ivory,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    marginTop: spacing(1),
  },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  error: { color: colors.danger, fontFamily: 'Manrope_400Regular', fontSize: 13, marginTop: spacing(2) },
  button: {
    backgroundColor: colors.gold,
    borderRadius: radius.sm,
    paddingVertical: spacing(3.5),
    alignItems: 'center',
    marginTop: spacing(5),
  },
  buttonText: { color: colors.bg, fontFamily: 'Manrope_700Bold', fontSize: 15 },
  link: { color: colors.gold, fontFamily: 'Manrope_600SemiBold', fontSize: 13, textAlign: 'center', marginTop: spacing(4) },
});
