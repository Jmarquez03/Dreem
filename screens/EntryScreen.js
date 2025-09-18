import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeProvider';
import { useRoute, useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { format } from 'date-fns';
import { getMoonPhaseForDate } from '../utils/moon';
import { loadEntry, removeEntry, saveEntry, loadDraft, saveDraft, removeDraft } from '../storage/journalStorage';
import { getAiInterpretation } from '../utils/ai';
import { toDateKey } from '../utils/date';
import { useEntryContext } from '../contexts/EntryContext';

export default function EntryScreen() {
  const { colors } = useAppTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { updateEntryState, clearEntryState } = useEntryContext();
  const [text, setText] = useState('');
  const dateKey = route.params?.dateKey || toDateKey(new Date());
  const dateObj = useMemo(() => {
    // Parse dateKey properly to avoid timezone issues
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  }, [dateKey]);
  const moon = useMemo(() => getMoonPhaseForDate(dateObj), [dateObj]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiVisible, setAiVisible] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [activeTab, setActiveTab] = useState('entry'); // 'entry' | 'luna'
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [originalAiResult, setOriginalAiResult] = useState('');
  const [isFocused, setIsFocused] = useState(true);
  const isScreenFocused = useIsFocused();
  const updateEntryStateRef = useRef(updateEntryState);

  useEffect(() => {
    (async () => {
      const existing = await loadEntry(dateKey);
      const draft = await loadDraft(dateKey);
      
      if (existing) {
        setText(existing.text || '');
        setAiResult(existing.aiAnalysis || '');
        setOriginalText(existing.text || '');
        setOriginalAiResult(existing.aiAnalysis || '');
      } else if (draft) {
        // Load draft if no saved entry exists
        setText(draft.text || '');
        setAiResult(draft.aiResult || '');
        setOriginalText(draft.text || '');
        setOriginalAiResult(draft.aiResult || '');
      } else {
        setText('');
        setAiResult('');
        setOriginalText('');
        setOriginalAiResult('');
      }
      setActiveTab('entry');
      setHasUnsavedChanges(false);
    })();
  }, [dateKey]);

  // Handle navigation back with unsaved changes
  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (!hasUnsavedChanges || (!text.trim() && !aiResult.trim())) {
          return;
        }

        // Check if navigating to a different drawer screen (not going back to JournalList)
        const targetRoute = e.data.action?.payload?.name;
        const isNavigatingToOtherDrawerScreen = targetRoute && 
          (targetRoute === 'Calendar' || targetRoute === 'Settings');

        // Prevent default behavior of leaving the screen
        e.preventDefault();

        // Show confirmation dialog with different messages based on navigation type
        const isGoingBack = !isNavigatingToOtherDrawerScreen;
        const message = isGoingBack 
          ? 'You have unsaved changes. Would you like to save as a draft?'
          : 'You are currently editing an entry. Would you like to save as a draft before switching screens?';

        Alert.alert(
          'Save as Draft?',
          message,
          [
            { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Save Draft', 
              onPress: async () => {
                await saveDraft(dateKey, text, aiResult);
                navigation.dispatch(e.data.action);
              }
            }
          ]
        );
      });

      return unsubscribe;
    }, [hasUnsavedChanges, text, aiResult, dateKey, navigation])
  );

  // Track changes to detect unsaved changes
  useEffect(() => {
    const hasChanges = text !== originalText || aiResult !== originalAiResult;
    setHasUnsavedChanges(hasChanges);
  }, [text, aiResult, originalText, originalAiResult]);

  // Update ref when updateEntryState changes
  useEffect(() => {
    updateEntryStateRef.current = updateEntryState;
  }, [updateEntryState]);

  // Update context when changes occur (separate effect to avoid infinite loop)
  useEffect(() => {
    const hasChanges = text !== originalText || aiResult !== originalAiResult;
    updateEntryStateRef.current(hasChanges, {
      dateKey,
      text,
      aiResult,
      hasUnsavedChanges: hasChanges
    });
  }, [text, aiResult, dateKey]);

  // Track focus state
  useEffect(() => {
    setIsFocused(isScreenFocused);
  }, [isScreenFocused]);

  // Cleanup context when component unmounts
  useEffect(() => {
    return () => {
      clearEntryState();
    };
  }, [clearEntryState]);

  const onSave = async () => {
    await saveEntry({ dateKey, dateIso: new Date(dateKey).toISOString(), text, moonPhase: moon.phase, moonPhaseEmoji: moon.emoji, aiAnalysis: aiResult });
    // Remove draft when saving as final entry
    await removeDraft(dateKey);
    setOriginalText(text);
    setOriginalAiResult(aiResult);
    setHasUnsavedChanges(false);
    clearEntryState();
    Alert.alert('Saved');
  };

  const onDelete = async () => {
    await removeEntry(dateKey);
    await removeDraft(dateKey); // Also remove any draft
    clearEntryState();
    Alert.alert('Deleted');
    navigation.navigate('JournalList');
  };

  const onAskAi = async () => {
    if (!text.trim()) {
      Alert.alert('Please write your dream first.');
      return;
    }
    if (aiResult && aiResult.trim()) {
      setAiVisible(true);
      return;
    }
    try {
      setLoadingAi(true);
      const answer = await getAiInterpretation(text, dateObj, moon.phase);
      setAiResult(answer);
      setAiVisible(true);
      await saveEntry({ dateKey, aiAnalysis: answer });
      setOriginalAiResult(answer);
      setHasUnsavedChanges(text !== originalText || answer !== originalAiResult);
      setActiveTab('luna');
    } catch (e) {
      Alert.alert('AI Error', e?.message || 'Failed to get interpretation');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Journal Icon */}
      <View style={[styles.topHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Text style={styles.menuIcon}>📖</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]}>{format(dateObj, 'PPP')}</Text>
          <Text style={[styles.moon, { color: colors.mutedText }]}>{moon.emoji} {moon.phase}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <View style={[styles.tabs, { borderColor: colors.border }]}> 
        <TouchableOpacity
          style={[styles.tab, activeTab === 'entry' && [styles.tabActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('entry')}
        >
          <Text style={[styles.tabText, { color: colors.text }]}>Entry</Text>
        </TouchableOpacity>
        {aiResult ? (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'luna' && [styles.tabActive, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('luna')}
          >
            <Text style={[styles.tabText, { color: colors.text }]}>Luna</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {activeTab === 'entry' ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text }]}
            value={text}
            onChangeText={setText}
            placeholder="Describe your dream in as much detail as you wish..."
            placeholderTextColor={colors.mutedText}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.resultText, { color: colors.text }]}>{aiResult}</Text>
        </ScrollView>
      )}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={onSave}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.purple }]} onPress={onAskAi} disabled={loadingAi}>
          <Text style={styles.buttonText}>{loadingAi ? 'Asking…' : 'Ask Luna'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.danger }]} onPress={onDelete}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={aiVisible} animationType="slide" transparent onRequestClose={() => setAiVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}> 
            <Text style={[styles.modalTitle, { color: colors.text }]}>Luna’s Analysis</Text>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={[styles.resultText, { color: colors.text }]}>{aiResult}</Text>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => setAiVisible(false)}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerSpacer: {
    width: 40, // Same width as menu button for balance
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  moon: { opacity: 0.8 },
  scroll: { padding: 16 },
  input: { minHeight: 220, borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  actions: { flexDirection: 'row', gap: 8, padding: 16 },
  button: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: '600' },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, marginHorizontal: 16, marginTop: 8 },
  tab: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: {},
  tabText: { fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '700', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  modalScroll: { paddingHorizontal: 16, paddingBottom: 16 },
  resultText: { lineHeight: 20 },
  modalActions: { padding: 16 },
});


