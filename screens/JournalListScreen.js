import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            <Text style={[styles.date, { color: colors.text }]}>{format(new Date(item.dateIso || item.dateKey), 'PPP')}</Text>
            <Text style={[styles.moon, { color: colors.mutedText }]}>{item.moonPhaseEmoji} {item.moonPhase}</Text>
            <Text style={[styles.preview, { color: colors.text }]} numberOfLines={2}>{item.text || 'No content yet'}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
  newButton: { padding: 12, margin: 16, borderRadius: 8, alignItems: 'center' },
  newButtonText: { color: 'white', fontWeight: '600' },
  card: { padding: 12, borderRadius: 8, marginBottom: 12 },
  date: { fontWeight: '700', marginBottom: 4 },
  moon: { opacity: 0.8, marginBottom: 8 },
  preview: {},
});


