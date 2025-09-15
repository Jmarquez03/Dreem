import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { verifyApiKey } from '../utils/ai';
import { getApiKey as getStoredApiKey, setApiKey as setStoredApiKey } from '../utils/storage';

export default function SettingsScreen() {
  const [apiKey, setApiKeyInput] = useState('');
  const { themePreference, setThemePreference, colors } = useAppTheme();

  useEffect(() => {
    (async () => {
      const v = await getStoredApiKey();
      if (v) setApiKeyInput(v);
    })();
  }, []);

  const onSave = async () => {
    await setStoredApiKey(apiKey);
    Alert.alert('Saved');
  };

  const onTestKey = async () => {
    try {
      await setStoredApiKey(apiKey);
      await verifyApiKey();
      Alert.alert('API Key', 'Your API key is valid and working.');
    } catch (e) {
      Alert.alert('API Key Problem', e?.message || 'Failed to validate the API key.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.toggle, { borderColor: colors.border }, themePreference === 'system' && [styles.toggleActive, { backgroundColor: colors.card }]]}
          onPress={() => setThemePreference('system')}
        >
          <Text style={[styles.toggleText, { color: colors.text }]}>System</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggle, { borderColor: colors.border }, themePreference === 'light' && [styles.toggleActive, { backgroundColor: colors.card }]]}
          onPress={() => setThemePreference('light')}
        >
          <Text style={[styles.toggleText, { color: colors.text }]}>Light</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggle, { borderColor: colors.border }, themePreference === 'dark' && [styles.toggleActive, { backgroundColor: colors.card }]]}
          onPress={() => setThemePreference('dark')}
        >
          <Text style={[styles.toggleText, { color: colors.text }]}>Dark</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[styles.label, { color: colors.text }]}>OpenAI API Key</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text }]}
        value={apiKey}
        onChangeText={setApiKeyInput}
        placeholder="sk-..."
        placeholderTextColor={colors.mutedText}
        secureTextEntry
        autoCapitalize="none"
      />
      <View style={styles.row}>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary, flex: 1 }]} onPress={onSave}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.purple, flex: 1 }]} onPress={onTestKey}>
          <Text style={styles.buttonText}>Test API Key</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.help, { color: colors.mutedText }]}>Your key is stored securely on this device.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggle: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  toggleActive: {},
  toggleText: { fontWeight: '600' },
  divider: { height: 1, marginVertical: 12 },
  label: { fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '600' },
  help: { opacity: 0.7, marginTop: 8 },
});


