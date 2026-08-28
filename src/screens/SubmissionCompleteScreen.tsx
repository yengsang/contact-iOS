import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RegisteredUserSession } from './PhoneVerificationScreen';
import { LaunchContext } from '../types';

type SubmissionCompleteScreenProps = {
  launchContext: LaunchContext;
  session: RegisteredUserSession;
  onRestart: () => void;
};

export function SubmissionCompleteScreen({ launchContext, session, onRestart }: SubmissionCompleteScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Submission Completed</Text>
          <Text style={styles.title}>Your reward submission is complete</Text>
          <Text style={styles.subtitle}>
            Your details, balance screenshot, and contacts have been submitted successfully. You can now notify the support team to continue your reward claim.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Submission Summary</Text>
          <Text style={styles.value}>Tenant: {launchContext.tenantName || launchContext.tenantCode || '-'}</Text>
          <Text style={styles.value}>User ID: {session.userId}</Text>
          <Text style={styles.value}>Phone: {session.phone}</Text>
          <Text style={styles.value}>Referral Code: {session.referralCode || '-'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Next</Text>
          <Text style={styles.value}>If needed, you can return to the start and test the flow again from the beginning.</Text>
        </View>

        <Pressable style={styles.button} onPress={onRestart}>
          <Text style={styles.buttonText}>Start Again</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f7fb' },
  container: { padding: 24, gap: 16, justifyContent: 'center', flexGrow: 1 },
  heroCard: { backgroundColor: '#ffffff', borderRadius: 22, padding: 24, borderWidth: 1, borderColor: '#dfe6f5', gap: 10 },
  eyebrow: { fontSize: 13, fontWeight: '800', color: '#3b5cff', textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { fontSize: 30, fontWeight: '800', color: '#1f2a44' },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#5f6c8d' },
  card: { backgroundColor: '#ffffff', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#e3e8f4', gap: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#6d7894', textTransform: 'uppercase' },
  value: { fontSize: 15, lineHeight: 22, color: '#23314f' },
  button: { backgroundColor: '#3b5cff', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
