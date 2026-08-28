import { http } from './http';
import { DeviceInfoPayload } from '../device/deviceInfo';

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

export type UpdateUserProfileParams = {
  qrToken: string;
  referralCode?: string;
  userId: number;
  profileUserId: string;
  userEmail: string;
  userFullName: string;
  userPhone: string;
  paynowIdType: string;
  paynowIdValue: string;
  paynowName: string;
  gender: string;
  birthday: string;
  occupation: string;
  deviceId: string;
  deviceInfo: DeviceInfoPayload;
};

export async function updateUserProfile(params: UpdateUserProfileParams) {
  await http.put(
    `/api/app-users/${params.userId}`,
    {
      data: {
        email: params.userEmail,
        full_name: params.userFullName,
        user_id: params.profileUserId,
        phone: params.userPhone,
        phoneVerified: true,
        gender: params.gender,
        birthday: params.birthday,
        occupation: params.occupation,
        paynow_id_type: params.paynowIdType,
        paynow_id_value: params.paynowIdValue,
        paynow_name: params.paynowName,
        device_id: params.deviceId,
        device_manufacturer: params.deviceInfo.manufacturer,
        device_brand: params.deviceInfo.brand,
        device_model: params.deviceInfo.model,
        device_name: params.deviceInfo.deviceName,
        android_version: params.deviceInfo.iosVersion,
        android_sdk_int: params.deviceInfo.iosSdkInt,
        app_version: params.deviceInfo.appVersion,
      },
    },
    {
      headers: buildHeaders(params.qrToken, params.referralCode ?? ''),
    },
  );
}

export type UploadProfileImageParams = {
  qrToken: string;
  referralCode?: string;
  userId: number;
  imageUri: string;
  fileName: string;
  mimeType: string;
};

export async function uploadUserProfileImage(params: UploadProfileImageParams) {
  const formData = new FormData();
  formData.append('file', {
    uri: params.imageUri,
    name: params.fileName,
    type: params.mimeType,
  } as unknown as Blob);

  const response = await http.post<{
    data?: {
      attributes?: {
        image_url?: string;
      };
    };
  }>(
    `/api/app-users/${params.userId}/profile-image`,
    formData,
    {
      headers: {
        ...buildHeaders(params.qrToken, params.referralCode ?? ''),
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data?.data?.attributes?.image_url?.trim() || '';
}
