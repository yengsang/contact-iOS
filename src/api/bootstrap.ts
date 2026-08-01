import { http } from './http';

export type AppBootstrapData = {
  tenantCode?: string;
  tenantName?: string;
  appDisplayName?: string;
  androidApkUrl?: string;
  latestVersionCode?: number;
  latestVersionName?: string;
  forceUpdate?: boolean;
};

export type AppBootstrapResponse = {
  data?: AppBootstrapData;
  error?: {
    status?: number;
    name?: string;
    message?: string;
  };
};

export async function fetchAppBootstrap(qrToken?: string) {
  const response = await http.get<AppBootstrapResponse>('/api/app-bootstrap', {
    params: qrToken ? { qrToken } : undefined,
  });
  return response.data;
}
