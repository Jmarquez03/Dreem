import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeProvider';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { loadAllEntries } from '../storage/journalStorage';
import { toDateKey } from '../utils/date';

export default function JournalListScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const [entries, setEntries] = useState([]);

  const refresh = async () => {
    const all = await loadAllEntries();
    setEntries(all.sort((a, b) => new Date(b.dateIso || b.dateKey) - new Date(a.dateIso || a.dateKey)));
  };

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Entry', { dateKey: item.dateKey })}
    >
      <Text style={styles.date}>{format(new Date(item.dateIso || item.dateKey), 'PPP')}</Text>
      <Text style={styles.moon}>{item.moonPhaseEmoji} {item.moonPhase}</Text>
      <Text style={styles.preview} numberOfLines={2}>{item.text || 'No content yet'}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Journal Icon */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Text style={styles.menuIcon}>📖</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Journal</Text>
        <View style={styles.headerSpacer} />
      </View>

      <TouchableOpacity
        style={[styles.newButton, { backgroundColor: colors.purple }]}
        onPress={() => navigation.navigate('Entry', { dateKey: toDateKey(new Date()) })}
      >
        <Text style={styles.newButtonText}>New Entry</Text>
      </TouchableOpacity>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.dateKey}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Entry', { dateKey: item.dateKey })}
          >
            <Text style={[styles.date, { color: colors.text }]}>
              {item.dateIso 
                ? format(new Date(item.dateIso), 'PPP')
                : (() => {
                    const [year, month, day] = item.dateKey.split('-').map(Number);
                    return format(new Date(year, month - 1, day), 'PPP');
                  })()
              }
            </Text>
            <Text style={[styles.moon, { color: colors.mutedText }]}>{item.moonPhaseEmoji} {item.moonPhase}</Text>
            <Text style={[styles.preview, { color: colors.text }]} numberOfLines={2}>{item.text || 'No content yet'}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  headerSpacer: {
    flex: 1,
  },
  list: { padding: 16 },
  newButton: { padding: 12, margin: 16, borderRadius: 8, alignItems: 'center' },
  newButtonText: { color: 'white', fontWeight: '600' },
  card: { padding: 12, borderRadius: 8, marginBottom: 12 },
  date: { fontWeight: '700', marginBottom: 4 },
  moon: { opacity: 0.8, marginBottom: 8 },
  preview: {},
});


