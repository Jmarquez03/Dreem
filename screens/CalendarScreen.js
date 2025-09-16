import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { loadAllEntries } from '../storage/journalStorage';

export default function CalendarScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState({});

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const allEntries = await loadAllEntries();
    const entriesMap = {};
    allEntries.forEach(entry => {
      entriesMap[entry.dateKey] = entry;
    });
    setEntries(entriesMap);
  };

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <Text style={[styles.arrow, { color: colors.text }]}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: colors.text }]}>
          {format(currentMonth, 'MMMM yyyy')}
        </Text>
        <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <Text style={[styles.arrow, { color: colors.text }]}>{'>'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDaysOfWeek = () => {
    return (
      <View style={styles.daysOfWeekContainer}>
        {daysOfWeek.map((day, index) => (
          <Text key={index} style={[styles.dayOfWeekText, { color: colors.mutedText }]}>
            {day}
          </Text>
        ))}
      </View>
    );
  };

  const renderDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    const firstDayIndex = start.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const emptyCellsBefore = Array.from({ length: firstDayIndex });

    return (
      <View style={styles.calendarGrid}>
        {emptyCellsBefore.map((_, index) => (
          <View key={`empty-before-${index}`} style={styles.dayCell} />
        ))}
        {days.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const hasEntry = entries[dateKey];
          const today = isToday(day);

          return (
            <TouchableOpacity
              key={dateKey}
              style={[
                styles.dayCell,
                today && { borderColor: colors.primary, borderWidth: 1 },
              ]}
              onPress={() => handleDayPress(dateKey, hasEntry)}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: colors.text },
                  hasEntry && { color: colors.purple, fontWeight: 'bold' },
                ]}
              >
                {format(day, 'd')}
              </Text>
              {hasEntry && <View style={[styles.dot, { backgroundColor: colors.purple }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const handleDayPress = (dateKey, hasEntry) => {
    // Create date object properly to avoid timezone issues
    const [year, month, day] = dateKey.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed
    
    if (hasEntry) {
      // Navigate to the existing entry
      navigation.navigate('Journal', { 
        screen: 'Entry', 
        params: { dateKey: dateKey } 
      });
    } else {
      // Show option to create new entry
      Alert.alert(
        'No Entry Found',
        `No dream entry found for ${format(dateObj, 'PPP')}. Would you like to create one?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Create Entry', 
            onPress: () => navigation.navigate('Journal', { 
              screen: 'Entry', 
              params: { dateKey: dateKey } 
            })
          }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Calendar Icon */}
      <View style={[styles.topHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Text style={styles.menuIcon}>📅</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Calendar</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.calendarContainer}>
        <View style={[styles.calendar, { backgroundColor: colors.card }]}>
          {renderHeader()}
          {renderDaysOfWeek()}
          {renderDays()}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
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
  calendarContainer: {
    flex: 1,
    padding: 16,
  },
  calendar: {
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
  },
  arrow: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 10,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayOfWeekText: {
    width: '14.28%',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dot: {
    position: 'absolute',
    bottom: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
