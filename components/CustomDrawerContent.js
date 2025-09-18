import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { useEntryContext } from '../contexts/EntryContext';
import { saveDraft } from '../storage/journalStorage';

export default function CustomDrawerContent({ navigation }) {
  const { colors } = useAppTheme();
  const { hasUnsavedChanges, currentEntryData, clearEntryState } = useEntryContext();

  const handleNavigation = async (screenName) => {
    if (screenName === 'Journal') {
      // Always go to JournalList when clicking Journal
      navigation.navigate('Journal', { screen: 'JournalList' });
    } else {
      // For other screens, check if there are unsaved changes in EntryScreen
      if (hasUnsavedChanges && currentEntryData && (currentEntryData.text?.trim() || currentEntryData.aiResult?.trim())) {
        Alert.alert(
          'Save as Draft?',
          'You are currently editing an entry. Would you like to save as a draft before switching screens?',
          [
            { text: 'Discard', style: 'destructive', onPress: () => {
              clearEntryState();
              navigation.navigate(screenName);
            }},
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Save Draft', 
              onPress: async () => {
                await saveDraft(currentEntryData.dateKey, currentEntryData.text, currentEntryData.aiResult);
                clearEntryState();
                navigation.navigate(screenName);
              }
            }
          ]
        );
      } else {
        navigation.navigate(screenName);
      }
    }
  };

  const menuItems = [
    {
      name: 'Journal',
      icon: '📖',
      screen: 'Journal',
    },
    {
      name: 'Calendar',
      icon: '📅',
      screen: 'Calendar',
    },
    {
      name: 'Chats',
      icon: '💬',
      screen: 'Chats',
    },
    {
      name: 'Settings',
      icon: '⚙️',
      screen: 'Settings',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>🌙 Dreem</Text>
      </View>
      
      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => handleNavigation(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  menu: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
  },
});