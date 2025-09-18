import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeProvider';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { loadAllEntries, getAllDrafts } from '../storage/journalStorage';
import { toDateKey } from '../utils/date';

export default function JournalListScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const [entries, setEntries] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  
  // Animation values
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const refresh = async () => {
    const all = await loadAllEntries();
    const allDrafts = await getAllDrafts();
    setEntries(all.sort((a, b) => new Date(b.dateIso || b.dateKey) - new Date(a.dateIso || a.dateKey)));
    setDrafts(allDrafts);
  };

  const toggleFab = () => {
    const toValue = isFabExpanded ? 0 : 1;
    setIsFabExpanded(!isFabExpanded);

    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: toValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: toValue,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeFab = () => {
    if (isFabExpanded) {
      toggleFab();
    }
  };

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  // Combine entries and drafts, prioritizing saved entries
  const combinedItems = useMemo(() => {
    const entryMap = new Map();
    
    // Add all entries first
    entries.forEach(entry => {
      entryMap.set(entry.dateKey, { ...entry, isDraft: false });
    });
    
    // Add drafts only if no entry exists for that date
    drafts.forEach(draft => {
      if (!entryMap.has(draft.dateKey)) {
        entryMap.set(draft.dateKey, { 
          ...draft, 
          isDraft: true,
          dateIso: draft.savedAt,
          moonPhase: '',
          moonPhaseEmoji: '📝'
        });
      }
    });
    
    return Array.from(entryMap.values()).sort((a, b) => 
      new Date(b.dateIso || b.dateKey) - new Date(a.dateIso || a.dateKey)
    );
  }, [entries, drafts]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => navigation.navigate('Entry', { dateKey: item.dateKey })}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.date, { color: colors.text }]}>
          {item.dateIso 
            ? format(new Date(item.dateIso), 'PPP')
            : (() => {
                const [year, month, day] = item.dateKey.split('-').map(Number);
                return format(new Date(year, month - 1, day), 'PPP');
              })()
          }
        </Text>
        {item.isDraft && (
          <View style={[styles.draftBadge, { backgroundColor: colors.purple }]}>
            <Text style={styles.draftText}>Draft</Text>
          </View>
        )}
      </View>
      <Text style={[styles.moon, { color: colors.mutedText }]}>
        {item.moonPhaseEmoji} {item.moonPhase || (item.isDraft ? 'Draft' : '')}
      </Text>
      <Text style={[styles.preview, { color: colors.text }]} numberOfLines={2}>
        {item.text || 'No content yet'}
      </Text>
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

      <FlatList
        data={combinedItems}
        keyExtractor={(item) => item.dateKey}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      {/* Expandable FAB */}
      <View style={styles.fabContainer}>
        {/* Backdrop to close FAB when tapping outside */}
        {isFabExpanded && (
          <TouchableOpacity 
            style={styles.fabBackdrop} 
            activeOpacity={1} 
            onPress={closeFab}
          />
        )}
        
        {/* Menu Options */}
        <Animated.View 
          style={[
            styles.fabMenu,
            {
              opacity: opacityAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -40]
                })}
              ]
            }
          ]}
        >
          <TouchableOpacity
            style={[styles.fabMenuItem, { backgroundColor: colors.purple }]}
            onPress={() => {
              navigation.navigate('Entry', { dateKey: toDateKey(new Date()) });
              closeFab();
            }}
          >
            <Text style={styles.fabMenuText}>New Entry</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.fabMenuItem, { backgroundColor: colors.primary }]}
            onPress={() => {
              // TODO: Navigate to Chat screen when implemented
              console.log('Chat pressed');
              closeFab();
            }}
          >
            <Text style={styles.fabMenuText}>Chat</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Main FAB Button */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.purple }]}
          onPress={toggleFab}
        >
          <Animated.Text
            style={[
              styles.fabIcon,
              {
                transform: [{
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg']
                  })
                }]
              }
            ]}
          >
            +
          </Animated.Text>
        </TouchableOpacity>
      </View>
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
  list: { padding: 16, paddingBottom: 100 }, // Add bottom padding for FAB
  card: { padding: 12, borderRadius: 8, marginBottom: 12 },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  date: { fontWeight: '700', flex: 1 },
  moon: { opacity: 0.8, marginBottom: 8 },
  preview: {},
  draftBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  draftText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // FAB Styles
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  fabBackdrop: {
    position: 'absolute',
    top: -Dimensions.get('window').height,
    left: -Dimensions.get('window').width,
    width: Dimensions.get('window').width * 2,
    height: Dimensions.get('window').height * 2,
    backgroundColor: 'transparent',
  },
  fabMenu: {
    position: 'absolute',
    bottom: 55,
    right: 0,
    alignItems: 'flex-end',
  },
  fabMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 4,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabMenuText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    width: 24,
    height: 24,
  },
});


