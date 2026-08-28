import { http } from './http';
import { DeviceInfoPayload } from '../device/deviceInfo';

export type PhoneOtpSendResult = {
  phone: string;
  status: string;
};

export type PhoneOtpVerifyResult = {
  phone: string;
  phoneVerified: boolean;
};

export type RegisteredUserResult = {
  userId: number;
  phone: string;
};

function buildHeaders(qrToken: string, referralCode: string) {
  const headers: Record<string, string> = {};

  if (qrToken.trim()) {
    headers['x-tenant-qr-token'] = qrToken.trim();
  }

  if (referralCode.trim()) {
    headers['x-referral-code'] = referralCode.trim();
  }

  return headers;
}

export async function sendPhoneOtp(params: {
  qrToken: string;
  phone: string;
  referralCode?: string;
}) {
  const response = await http.post<{ data: PhoneOtpSendResult }>(
    '/api/phone-verification/send-otp',
    {
      phone: params.phone,
      ...(params.referralCode?.trim() ? { referralCode: params.referralCode.trim() } : {}),
    },
    {
      headers: buildHeaders(params.qrToken, params.referralCode ?? ''),
    },
  );

  return response.data.data;
}

export async function verifyPhoneOtp(params: {
  qrToken: string;
  phone: string;
  code: string;
  referralCode?: string;
}) {
  const response = await http.post<{ data: PhoneOtpVerifyResult }>(
    '/api/phone-verification/verify-otp',
    {
      phone: params.phone,
      code: params.code,
      ...(params.referralCode?.trim() ? { referralCode: params.referralCode.trim() } : {}),
    },
    {
      headers: buildHeaders(params.qrToken, params.referralCode ?? ''),
    },
  );

  return response.data.data;
}

export async function registerVerifiedUser(params: {
  qrToken: string;
  phone: string;
  referralCode?: string;
  deviceId: string;
  deviceInfo: DeviceInfoPayload;
}) {
  const response = await http.post<{
    data: {
      id: number;
      attributes: {
        phone: string;
      };
    };
  }>(
    '/api/phone-verification/register-user',
    {
      phone: params.phone,
      deviceId: params.deviceId,
      device_manufacturer: params.deviceInfo.manufacturer,
      device_brand: params.deviceInfo.brand,
      device_model: params.deviceInfo.model,
      device_name: params.deviceInfo.deviceName,
      android_version: params.deviceInfo.iosVersion,
      android_sdk_int: params.deviceInfo.iosSdkInt,
      app_version: params.deviceInfo.appVersion,
      ...(params.referralCode?.trim() ? { referralCode: params.referralCode.trim() } : {}),
    },
    {
      headers: buildHeaders(params.qrToken, params.referralCode ?? ''),
    },
  );

  return {
    userId: response.data.data.id,
    phone: response.data.data.attributes.phone,
  } satisfies RegisteredUserResult;
}
