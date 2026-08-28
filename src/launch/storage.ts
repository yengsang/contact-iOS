import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { emptyLaunchContext, LaunchContext } from '../types';

const STORAGE_KEY = 'contact_ios_launch_context';

function normalize(value: string | null | undefined) {
  return value?.trim() ?? '';
}

export function parseLaunchUrl(url: string | null | undefined): LaunchContext {
  if (!url) {
    return emptyLaunchContext;
  }

  const parsed = Linking.parse(url);
  const qrToken = typeof parsed.queryParams?.qrToken === 'string' ? normalize(parsed.queryParams.qrToken) : '';
  const tenantCode = typeof parsed.queryParams?.tenantCode === 'string' ? normalize(parsed.queryParams.tenantCode) : '';
  const referralCode = typeof parsed.queryParams?.referralCode === 'string' ? normalize(parsed.queryParams.referralCode) : '';

  return {
    qrToken,
    tenantCode,
    referralCode,
    tenantName: '',
    sourceUrl: url,
  };
}

export function mergeLaunchContext(
  current: LaunchContext,
  incoming: Partial<LaunchContext>,
): LaunchContext {
  return {
    qrToken: normalize(incoming.qrToken) || current.qrToken,
    tenantCode: normalize(incoming.tenantCode) || current.tenantCode,
    referralCode: normalize(incoming.referralCode) || current.referralCode,
    tenantName: normalize(incoming.tenantName) || current.tenantName,
    sourceUrl: normalize(incoming.sourceUrl) || current.sourceUrl,
  };
}

export async function readStoredLaunchContext(): Promise<LaunchContext> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return emptyLaunchContext;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LaunchContext>;
    return mergeLaunchContext(emptyLaunchContext, parsed);
  } catch {
    return emptyLaunchContext;
  }
}

export async function writeStoredLaunchContext(context: LaunchContext) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(context));
}

export async function clearStoredLaunchContext() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
