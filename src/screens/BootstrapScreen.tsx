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
import { useQuery } from '@tanstack/react-query';
import { fetchAppBootstrap } from '../api/bootstrap';
import { env } from '../config/env';
import { useLaunchContext } from '../launch/useLaunchContext';

export function BootstrapScreen() {
  const [enabled, setEnabled] = useState(false);
  const { launchContext, hasLaunchSelection, loading } = useLaunchContext();

  const bootstrapQuery = useQuery({
    queryKey: ['app-bootstrap', launchContext.qrToken],
    queryFn: () => fetchAppBootstrap(launchContext.qrToken),
    enabled,
    retry: false,
  });

  const handleTest = async () => {
    if (!enabled) {
      setEnabled(true);
      return;
    }

    await bootstrapQuery.refetch();
  };

  const prettyData = bootstrapQuery.data?.data
    ? JSON.stringify(bootstrapQuery.data.data, null, 2)
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Contact iOS</Text>
        <Text style={styles.title}>Launch And Backend Check</Text>
        <Text style={styles.subtitle}>
          We are wiring the invitation-link flow first so iOS follows the same launch behavior as Android.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>API Base URL</Text>
          <Text style={styles.value}>{env.apiBaseUrl}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Launch Status</Text>
          <Text style={styles.value}>{loading ? 'Reading launch context...' : hasLaunchSelection ? 'Invitation detected' : 'No invitation link detected yet'}</Text>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>QR Token</Text>
            <Text style={styles.metaValue}>{launchContext.qrToken || '-'}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Tenant Code</Text>
            <Text style={styles.metaValue}>{launchContext.tenantCode || '-'}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Referral Code</Text>
            <Text style={styles.metaValue}>{launchContext.referralCode || '-'}</Text>
          </View>
        </View>

        <Pressable style={styles.button} onPress={handleTest}>
          <Text style={styles.buttonText}>Test Bootstrap</Text>
        </Pressable>

        {bootstrapQuery.isFetching ? (
          <View style={styles.statusRow}>
            <ActivityIndicator color="#3b5cff" />
            <Text style={styles.statusText}>Checking backend...</Text>
          </View>
        ) : null}

        {bootstrapQuery.isError ? (
          <View style={styles.resultCard}>
            <Text style={styles.errorTitle}>Connection failed</Text>
            <Text style={styles.errorText}>
              {bootstrapQuery.error instanceof Error
                ? bootstrapQuery.error.message
                : 'Unknown error'}
            </Text>
          </View>
        ) : null}

        {bootstrapQuery.data?.data ? (
          <View style={styles.resultCard}>
            <Text style={styles.successTitle}>Resolved tenant bootstrap</Text>
            <Text style={styles.metaValue}>Tenant Name: {bootstrapQuery.data.data.tenantName || '-'}</Text>
            <Text style={styles.metaValue}>Display Name: {bootstrapQuery.data.data.appDisplayName || '-'}</Text>
            <Text style={styles.metaValue}>Latest Version: {bootstrapQuery.data.data.latestVersionName || '-'}</Text>
            <Text style={styles.metaValue}>Force Update: {bootstrapQuery.data.data.forceUpdate ? 'Yes' : 'No'}</Text>
          </View>
        ) : null}

        {prettyData ? (
          <View style={styles.resultCard}>
            <Text style={styles.successTitle}>Raw bootstrap response</Text>
            <Text style={styles.code}>{prettyData}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  container: {
    padding: 24,
    gap: 16,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3b5cff',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1f2a44',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5f6c8d',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e3e8f4',
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6d7894',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2a44',
  },
  metaBlock: {
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7a86a5',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 15,
    lineHeight: 22,
    color: '#23314f',
  },
  button: {
    backgroundColor: '#3b5cff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#4d5b7c',
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e3e8f4',
    gap: 8,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d6f42',
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#b42318',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#7a271a',
  },
  code: {
    fontSize: 13,
    lineHeight: 20,
    color: '#23314f',
    fontFamily: 'monospace',
  },
});
