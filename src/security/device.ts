import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { v4 as uuidv4 } from 'uuid';

const generateFallbackUuid = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return (
    s4() + s4() + '-' + s4() + '-4' + s4().substr(0, 3) + '-' +
    ((Math.floor(Math.random() * 4) + 8).toString(16)) + s4().substr(0, 3) + '-' +
    s4() + s4() + s4()
  );
};

export const getDevice = async () => {
  let id = await AsyncStorage.getItem('device_id');

  if (!id) {
    try {
      id = uuidv4();
    } catch (error) {
      console.warn('[device] uuidv4 failed, using fallback id generator:', error);
      id = generateFallbackUuid();
    }
    await AsyncStorage.setItem('device_id', id);
  }

  return {
    id,
    name: Device.deviceName || 'web-device',
    model: Device.modelName || 'browser',
    platform: Device.osName || 'web',
  };
};