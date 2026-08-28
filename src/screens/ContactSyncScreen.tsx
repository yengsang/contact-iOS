import * as ExpoContacts from 'expo-contacts/legacy';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { syncContacts } from '../api/contactSync';
import { readPhoneContacts } from '../contacts/repository';
import { LaunchContext } from '../types';
import { RegisteredUserSession } from './PhoneVerificationScreen';

type ContactSyncScreenProps = {
  launchContext: LaunchContext;
  session: RegisteredUserSession;
  onBack: () => void;
  onCompleted: () => void;
};

export function ContactSyncScreen({
  launchContext,
  session,
  onBack,
  onCompleted,
}: ContactSyncScreenProps) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null);

  const handleSyncContacts = async () => {
    setBusy(true);
    setError('');
    setResult(null);

    try {
      setStatus('Requesting contacts permission...');
      const permission = await ExpoContacts.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Please allow contacts access to continue.');
      }

      setStatus('Reading contacts from iPhone...');
      const contacts = await readPhoneContacts();
      if (!contacts.length) {
        throw new Error('No contacts were found on this device.');
      }

      setStatus(`Syncing ${contacts.length} contacts...`);
      const syncResult = await syncContacts({
        qrToken: launchContext.qrToken,
        referralCode: launchContext.referralCode,
        userId: session.userId,
        contacts,
        onProgress: (current, total) => {
          setStatus(`Syncing contacts ${current}/${total}...`);
        },
      });

      setResult(syncResult);
      setStatus('Contacts synced successfully.');
      onCompleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync contacts.');
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Reward Claim</Text>
        <Text style={styles.title}>Contacts Sync</Text>
        <Text style={styles.subtitle}>
          Allow contacts access so the app can submit the contact list linked to this reward claim.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Registered Session</Text>
          <Text style={styles.metaValue}>User ID: {session.userId}</Text>
          <Text style={styles.metaValue}>Phone: {session.phone}</Text>
          <Text style={styles.metaValue}>Referral Code: {launchContext.referralCode || '-'}</Text>
        </View>

        {status ? <View style={styles.infoCard}><Text style={styles.infoText}>{status}</Text></View> : null}
        {error ? <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View> : null}
        {result ? (
          <View style={styles.card}>
            <Text style={styles.label}>Sync Result</Text>
            <Text style={styles.metaValue}>Created: {result.created}</Text>
            <Text style={styles.metaValue}>Updated: {result.updated}</Text>
          </View>
        ) : null}
        {busy ? <View style={styles.statusRow}><ActivityIndicator color="#3b5cff" /><Text style={styles.statusText}>Working...</Text></View> : null}

        <View style={styles.actionRow}>
          <Pressable style={styles.secondaryButton} onPress={onBack}><Text style={styles.secondaryButtonText}>Back</Text></Pressable>
          <Pressable style={[styles.button, busy && styles.buttonDisabled]} disabled={busy} onPress={handleSyncContacts}>
            <Text style={styles.buttonText}>Allow and Sync Contacts</Text>
          </Pressable>
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
