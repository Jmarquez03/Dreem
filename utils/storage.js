import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_KEY = 'OPENAI_API_KEY';

// Platform-aware storage functions
export async function setApiKey(key) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(API_KEY, key);
  } else {
    await SecureStore.setItemAsync(API_KEY, key);
  }
}

export async function getApiKey() {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem(API_KEY);
  } else {
    return await SecureStore.getItemAsync(API_KEY);
  }
}
