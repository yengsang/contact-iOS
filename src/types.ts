export type LaunchContext = {
  qrToken: string;
  tenantCode: string;
  referralCode: string;
  tenantName: string;
  sourceUrl: string;
};

export const emptyLaunchContext: LaunchContext = {
  qrToken: '',
  tenantCode: '',
  referralCode: '',
  tenantName: '',
  sourceUrl: '',
};
