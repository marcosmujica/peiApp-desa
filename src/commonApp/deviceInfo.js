import * as Device from 'expo-device';

export const getDeviceInfo = async () => {
    return (JSON.stringify (Device));
  };
