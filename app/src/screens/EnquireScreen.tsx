import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { getSupabase } from '../backend';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Enquire'>;

export default function EnquireScreen({ route, navigation }: Props) {
  const vehicle = route.params?.vehicle;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [make, setMake] = useState(vehicle?.make || '');
  const [model, setModel] = useState(vehicle?.model || '');
  const [budget, setBudget] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit() {
    if (!name.trim() || !email.trim()) {
      setStatus('error');
      setError('Name and email are required.');
      return;
    }
    setStatus('sending');
    setError('');
    const supabase = await getSupabase();
    if (!supabase) {
      navigation.replace('Setup');
      return;
    }
    const { error: err } = await supabase.from('enquiries').insert({
      lead_type: 'purchase',
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      make: make.trim() || null,
      model: model.trim() || null,
      budget: budget.trim() || null,
      message: message.trim() || null,
    });
    if (err) {
      setStatus('error');
      setError(err.message);
      return;
    }
    setStatus('sent');
  }

  if (status === 'sent') {
    return (
      <View style={styles.sentScreen}>
        <Text style={styles.sentTitle}>Enquiry sent</Text>
        <Text style={styles.sentBody}>Dre or Ferrell will get back to you directly — no call centre, no chasing.</Text>
        <Pressable style={styles.button} onPress={() => navigation.navigate('Vehicles')}>
          <Text style={styles.buttonText}>Back to vehicles</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>{vehicle ? `${vehicle.make} ${vehicle.model}` : 'General enquiry'}</Text>
      <Text style={styles.title}>Tell us what you're after</Text>

      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field label="Make" value={make} onChangeText={setMake} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Model" value={model} onChangeText={setModel} />
        </View>
      </View>
      <Field label="Budget (optional)" value={budget} onChangeText={setBudget} />
      <Field label="Message (optional)" value={message} onChangeText={setMessage} multiline />

      {status === 'error' && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={submit} disabled={status === 'sending'}>
        {status === 'sending' ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Send enquiry</Text>}
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, ...props }: any) {
  return (
    <View style={{ marginTop: spacing(3) }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, props.multiline && styles.inputMultiline]}
        placeholderTextColor={colors.ivoryMuted}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(6), paddingTop: spacing(16), paddingBottom: spacing(20) },
  eyebrow: { color: colors.gold, fontFamily: 'Manrope_700Bold', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { color: colors.ivory, fontFamily: 'BodoniModa_600SemiBold', fontSize: 26, marginTop: spacing(1) },
  row: { flexDirection: 'row', gap: spacing(3) },
  label: { color: colors.ivory, fontFamily: 'Manrope_600SemiBold', fontSize: 13, marginBottom: spacing(1) },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing(3),
    color: colors.ivory,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  error: { color: colors.danger, fontFamily: 'Manrope_400Regular', fontSize: 13, marginTop: spacing(3) },
  button: {
    backgroundColor: colors.gold,
    borderRadius: radius.sm,
    paddingVertical: spacing(3.5),
    alignItems: 'center',
    marginTop: spacing(6),
  },
  buttonText: { color: colors.bg, fontFamily: 'Manrope_700Bold', fontSize: 15 },
  sentScreen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing(8) },
  sentTitle: { color: colors.ivory, fontFamily: 'BodoniModa_600SemiBold', fontSize: 26, marginBottom: spacing(2) },
  sentBody: { color: colors.ivoryMuted, fontFamily: 'Manrope_400Regular', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: spacing(8) },
});
