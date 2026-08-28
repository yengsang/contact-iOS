import { useEffect } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchAppBootstrap } from '../api/bootstrap';
import { env } from '../config/env';
import { LaunchContext } from '../types';

type BootstrapScreenProps = {
  launchContext: LaunchContext;
  loading: boolean;
  hasLaunchSelection: boolean;
  onPatchLaunchContext: (patch: Partial<LaunchContext>) => Promise<LaunchContext>;
  onClearLaunchContext: () => Promise<void>;
  onContinue: () => void;
};

function resolveReferralCode(data?: {
  referralCode?: string;
  tenantName?: string;
  appDisplayName?: string;
  tenantCode?: string;
}) {
  return data?.referralCode?.trim()
    || data?.tenantName?.trim()
    || data?.appDisplayName?.trim()
    || data?.tenantCode?.trim()
    || '';
}

export function BootstrapScreen({
  launchContext,
  loading,
  hasLaunchSelection,
  onPatchLaunchContext,
  onClearLaunchContext,
  onContinue,
}: BootstrapScreenProps) {
  const bootstrapQuery = useQuery({
    queryKey: ['app-bootstrap', launchContext.qrToken],
    queryFn: () => fetchAppBootstrap(launchContext.qrToken),
    enabled: !loading,
    retry: false,
  });

  const latestData = bootstrapQuery.data?.data;
  const resolvedTenantName = launchContext.tenantName || latestData?.tenantName || latestData?.appDisplayName || '-';
  const readyForVerification = Boolean(launchContext.referralCode || launchContext.qrToken);

  useEffect(() => {
    if (!latestData) {
      return;
    }

    const nextTenantCode = latestData.tenantCode?.trim() || launchContext.tenantCode;
    const nextTenantName = latestData.tenantName?.trim()
      || latestData.appDisplayName?.trim()
      || launchContext.tenantName;
    const nextReferralCode = launchContext.referralCode || resolveReferralCode(latestData);

    const needsPatch =
      nextTenantCode !== launchContext.tenantCode
      || nextTenantName !== launchContext.tenantName
      || nextReferralCode !== launchContext.referralCode;

    if (!needsPatch) {
      return;
    }

    void onPatchLaunchContext({
      tenantCode: nextTenantCode,
      tenantName: nextTenantName,
      referralCode: nextReferralCode,
    });
  }, [latestData, launchContext, onPatchLaunchContext]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Reward Claim</Text>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>
          Opening the invitation link prepares your referral details so you can continue with phone verification and complete your submission.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Invitation Status</Text>
          <Text style={styles.value}>
            {loading ? 'Reading saved invitation details...' : hasLaunchSelection ? 'Invitation detected successfully' : 'No invitation link detected yet'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Referral Details</Text>
          <Text style={styles.metaValue}>Tenant Code: {launchContext.tenantCode || '-'}</Text>
          <Text style={styles.metaValue}>Tenant Name: {resolvedTenantName}</Text>
          <Text style={styles.metaValue}>Referral Code: {launchContext.referralCode || '-'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>App Status</Text>
          <Text style={styles.metaValue}>Latest Version: {latestData?.latestVersionName || '-'}</Text>
          <Text style={styles.metaValue}>Force Update: {latestData?.forceUpdate ? 'Yes' : 'No'}</Text>
          <Text style={styles.metaValue}>Display Name: {latestData?.appDisplayName || '-'}</Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.secondaryButton} onPress={() => { void onClearLaunchContext(); }}>
            <Text style={styles.secondaryButtonText}>Clear Invitation</Text>
          </Pressable>
          <Pressable style={[styles.button, !readyForVerification && styles.buttonDisabled]} disabled={!readyForVerification} onPress={onContinue}>
            <Text style={styles.buttonText}>Continue</Text>
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
  value: { fontSize: 16, fontWeight: '600', color: '#1f2a44' },
  metaValue: { fontSize: 15, lineHeight: 22, color: '#23314f' },
  actionRow: { gap: 12 },
  button: { backgroundColor: '#3b5cff', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#aeb9dd' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { backgroundColor: '#eef2ff', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#304bba', fontSize: 15, fontWeight: '700' },
});
