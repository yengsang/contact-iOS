import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { env } from '../config/env';
import { getDeviceId, getDeviceInfoPayload } from '../device/deviceInfo';
import { LaunchContext } from '../types';
import {
  registerVerifiedUser,
  sendPhoneOtp,
  verifyPhoneOtp,
} from '../api/phoneVerification';

export type RegisteredUserSession = {
  userId: number;
  phone: string;
  referralCode: string;
};

type PhoneVerificationScreenProps = {
  launchContext: LaunchContext;
  onBack: () => void;
  onPatchLaunchContext: (patch: Partial<LaunchContext>) => Promise<LaunchContext>;
  onRegistered: (session: RegisteredUserSession) => void;
};

export function PhoneVerificationScreen({
  launchContext,
  onBack,
  onPatchLaunchContext,
  onRegistered,
}: PhoneVerificationScreenProps) {
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const referralCode = launchContext.referralCode;
  const canContinue = useMemo(() => {
    if (busy || !phone.trim()) {
      return false;
    }

    return env.otpEnabled ? Boolean(otpCode.trim()) : true;
  }, [busy, phone, otpCode]);

  const missingContext = !launchContext.qrToken && !launchContext.referralCode;

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError('Please enter your phone number first.');
      return;
    }

    setBusy(true);
    setError('');
    setStatus('Sending OTP...');

    try {
      await sendPhoneOtp({
        qrToken: launchContext.qrToken,
        phone: phone.trim(),
        referralCode,
      });
      setStatus('OTP sent. Please enter the code you received.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP.');
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  const handleContinue = async () => {
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }

    if (missingContext) {
      setError('Please open the app from the invitation link first.');
      return;
    }

    setBusy(true);
    setError('');
    setStatus(env.otpEnabled ? 'Verifying phone number...' : 'Registering user...');

    try {
      if (env.otpEnabled) {
        await verifyPhoneOtp({
          qrToken: launchContext.qrToken,
          phone: phone.trim(),
          code: otpCode.trim(),
          referralCode,
        });
      }

      const deviceId = await getDeviceId();
      const deviceInfo = getDeviceInfoPayload();
      const registered = await registerVerifiedUser({
        qrToken: launchContext.qrToken,
        phone: phone.trim(),
        referralCode,
        deviceId,
        deviceInfo,
      });

      await onPatchLaunchContext({ referralCode });
      setStatus('Phone verification completed.');
      onRegistered({
        userId: registered.userId,
        phone: registered.phone,
        referralCode,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Phone verification failed.');
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Reward Claim</Text>
        <Text style={styles.title}>Phone Verification</Text>
        <Text style={styles.subtitle}>
          Enter your phone number and referral code to continue with your reward submission.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Referral Details</Text>
          <Text style={styles.metaValue}>Tenant: {launchContext.tenantName || launchContext.tenantCode || '-'}</Text>
          <Text style={styles.metaValue}>Referral Code: {referralCode || '-'}</Text>
          <Text style={styles.metaValue}>OTP Mode: {env.otpEnabled ? 'Enabled' : 'Disabled'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="e.g. +60123456789" keyboardType="phone-pad" autoCapitalize="none" autoCorrect={false} />
          <Text style={styles.label}>Referral Code</Text>
          <TextInput style={styles.input} value={referralCode} onChangeText={(text) => { void onPatchLaunchContext({ referralCode: text.trim() }); }} placeholder="Referral code" autoCapitalize="none" autoCorrect={false} />
          {env.otpEnabled ? (
            <>
              <Text style={styles.label}>OTP Code</Text>
              <TextInput style={styles.input} value={otpCode} onChangeText={setOtpCode} placeholder="Enter OTP" keyboardType="number-pad" autoCapitalize="none" autoCorrect={false} />
            </>
          ) : null}
        </View>

        {status ? <View style={styles.infoCard}><Text style={styles.infoText}>{status}</Text></View> : null}
        {error ? <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View> : null}
        {busy ? <View style={styles.statusRow}><ActivityIndicator color="#3b5cff" /><Text style={styles.statusText}>Working...</Text></View> : null}

        <View style={styles.actionRow}>
          <Pressable style={styles.secondaryButton} onPress={onBack}><Text style={styles.secondaryButtonText}>Back</Text></Pressable>
          {env.otpEnabled ? <Pressable style={styles.secondaryButton} onPress={handleSendOtp} disabled={busy}><Text style={styles.secondaryButtonText}>Send OTP</Text></Pressable> : null}
          <Pressable style={[styles.button, !canContinue && styles.buttonDisabled]} disabled={!canContinue} onPress={handleContinue}><Text style={styles.buttonText}>{env.otpEnabled ? 'Verify and Continue' : 'Continue'}</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f7fb' },
  container: { padding: 24, gap: 16 },
  eyebrow: { fontSize: 13, fontWeight: '700', color: '#3b5cff', textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { fontSize: 30, fontWeight: '800', color: '#1f2a44' },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#5f6c8d' },
  card: { backgroundColor: '#ffffff', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#e3e8f4', gap: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#6d7894', textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#d5dced', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#23314f', backgroundColor: '#fbfcff' },
  metaValue: { fontSize: 15, lineHeight: 22, color: '#23314f' },
  infoCard: { backgroundColor: '#eef4ff', borderRadius: 16, padding: 16 },
  infoText: { color: '#23408f', fontSize: 14, lineHeight: 21 },
  errorCard: { backgroundColor: '#fff1f3', borderRadius: 16, padding: 16 },
  errorText: { color: '#9f1239', fontSize: 14, lineHeight: 21 },
  actionRow: { gap: 12 },
  button: { backgroundColor: '#3b5cff', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#aeb9dd' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { backgroundColor: '#eef2ff', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#304bba', fontSize: 15, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusText: { fontSize: 14, color: '#4d5b7c' },
});
