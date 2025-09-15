import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider as RNNavigationThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { getThemePreference, setThemePreference as persistThemePreference } from '../storage/settingsStorage';

const AppThemeContext = createContext({
  themePreference: 'system',
  setThemePreference: () => {},
  colorScheme: 'light',
  navTheme: DefaultTheme,
  colors: {
    background: '#ffffff',
    text: '#111827',
    mutedText: '#4b5563',
    border: '#e5e7eb',
    card: '#f3f4f6',
    primary: '#2563eb',
    purple: '#7c3aed',
    danger: '#ef4444',
    inputBackground: '#ffffff',
  },
});

export function useAppTheme() {
  return useContext(AppThemeContext);
}

export default function ThemeProvider({ children }) {
  const deviceScheme = useColorScheme(); // 'light' | 'dark' | null
  const [themePreference, setThemePreference] = useState('system'); // 'system' | 'light' | 'dark'

  useEffect(() => {
    (async () => {
      const pref = await getThemePreference();
      if (pref) setThemePreference(pref);
    })();
  }, []);

  useEffect(() => {
    persistThemePreference(themePreference).catch(() => {});
  }, [themePreference]);

  const colorScheme = useMemo(() => {
    if (themePreference === 'light' || themePreference === 'dark') return themePreference;
    return deviceScheme || 'light';
  }, [deviceScheme, themePreference]);

  const navTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  const colors = useMemo(() => {
    const isDark = colorScheme === 'dark';
    return {
      background: navTheme.colors.background,
      text: navTheme.colors.text,
      mutedText: isDark ? '#d1d5db' : '#4b5563',
      border: navTheme.colors.border,
      card: isDark ? '#111827' : '#f3f4f6',
      primary: '#2563eb',
      purple: '#7c3aed',
      danger: '#ef4444',
      inputBackground: isDark ? '#0b1220' : '#ffffff',
    };
  }, [navTheme, colorScheme]);

  return (
    <AppThemeContext.Provider value={{ themePreference, setThemePreference, colorScheme, navTheme, colors }}>
      <RNNavigationThemeProvider value={navTheme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        {children}
      </RNNavigationThemeProvider>
    </AppThemeContext.Provider>
  );
}


