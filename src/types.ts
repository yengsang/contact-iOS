export type LaunchContext = {
  qrToken: string;
  tenantCode: string;
  referralCode: string;
  sourceUrl: string;
};

export const emptyLaunchContext: LaunchContext = {
  qrToken: '',
  tenantCode: '',
  referralCode: '',
  sourceUrl: '',
};
