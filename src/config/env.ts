import Constants from 'expo-constants';

type ExpoExtra = {
  apiBaseUrl?: string;
  otpEnabled?: boolean;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

export const env = {
  apiBaseUrl: extra.apiBaseUrl?.trim() || 'https://api.findocly.com',
  otpEnabled: Boolean(extra.otpEnabled),
};
