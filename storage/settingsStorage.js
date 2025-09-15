import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'DREEM_THEME_PREF_V1';

export async function getThemePreference() {
  try {
    const v = await AsyncStorage.getItem(THEME_KEY);
    if (!v) return 'system';
    if (v === 'light' || v === 'dark' || v === 'system') return v;
    return 'system';
  } catch {
    return 'system';
  }
}

export async function setThemePreference(pref) {
  await AsyncStorage.setItem(THEME_KEY, pref);
}


