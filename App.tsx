import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';
import { useLaunchContext } from './src/launch/useLaunchContext';
import { BootstrapScreen } from './src/screens/BootstrapScreen';
import { ContactSyncScreen } from './src/screens/ContactSyncScreen';
import { PhoneVerificationScreen, RegisteredUserSession } from './src/screens/PhoneVerificationScreen';
import { SubmissionCompleteScreen } from './src/screens/SubmissionCompleteScreen';
import { UserProfileScreen } from './src/screens/UserProfileScreen';

const queryClient = new QueryClient();

type AppStep = 'launch' | 'verify' | 'profile' | 'contacts' | 'submitted';

function AppFlow() {
  const [step, setStep] = useState<AppStep>('launch');
  const [registeredSession, setRegisteredSession] = useState<RegisteredUserSession | null>(null);
  const { launchContext, hasLaunchSelection, loading, patchLaunchContext, clearLaunchContext } = useLaunchContext();

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#3b5cff" size="large" />
        <Text style={styles.loadingText}>Preparing invitation context...</Text>
      </SafeAreaView>
    );
  }

  if (step === 'verify') {
    return <PhoneVerificationScreen launchContext={launchContext} onBack={() => setStep('launch')} onPatchLaunchContext={patchLaunchContext} onRegistered={(session) => { setRegisteredSession(session); setStep('profile'); }} />;
  }

  if (step === 'profile' && registeredSession) {
    return <UserProfileScreen launchContext={launchContext} session={registeredSession} onBack={() => setStep('verify')} onCompleted={() => setStep('contacts')} />;
  }

  if (step === 'contacts' && registeredSession) {
    return <ContactSyncScreen launchContext={launchContext} session={registeredSession} onBack={() => setStep('profile')} onCompleted={() => setStep('submitted')} />;
  }

  if (step === 'submitted' && registeredSession) {
    return <SubmissionCompleteScreen launchContext={launchContext} session={registeredSession} onRestart={() => setStep('launch')} />;
  }

  return <BootstrapScreen launchContext={launchContext} loading={loading} hasLaunchSelection={hasLaunchSelection} onPatchLaunchContext={patchLaunchContext} onClearLaunchContext={clearLaunchContext} onContinue={() => setStep('verify')} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppFlow />
      <StatusBar style="dark" />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f5f7fb', gap: 16 },
  loadingText: { fontSize: 16, color: '#42526e' },
});
