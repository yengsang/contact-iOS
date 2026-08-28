import * as Application from 'expo-application';
import * as Device from 'expo-device';

export type DeviceInfoPayload = {
  manufacturer: string;
  brand: string;
  model: string;
  deviceName: string;
  iosVersion: string;
  iosSdkInt: number;
  appVersion: string;
};

export function getDeviceInfoPayload(): DeviceInfoPayload {
  return {
    manufacturer: Device.manufacturer ?? 'Apple',
    brand: Device.brand ?? 'Apple',
    model: Device.modelName ?? Device.modelId ?? 'Unknown iPhone',
    deviceName: Device.deviceName ?? Device.designName ?? 'Unknown device',
    iosVersion: Device.osVersion ?? 'Unknown',
    iosSdkInt: typeof Device.platformApiLevel === 'number' ? Device.platformApiLevel : 0,
    appVersion: Application.nativeApplicationVersion ?? '1.0.0',
  };
}

export async function getDeviceId(): Promise<string> {
  const iosVendorId = await Application.getIosIdForVendorAsync();
  return iosVendorId?.trim() || Application.applicationId || 'ios-device';
}
