import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'DREEM_ENTRIES_V1';
const DRAFTS_KEY = 'DREEM_DRAFTS_V1';

async function loadAll() {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export async function loadAllEntries() {
  return loadAll();
}

export async function loadEntry(dateKey) {
  const all = await loadAll();
  return all.find((e) => e.dateKey === dateKey);
}

export async function saveEntry(entry) {
  const all = await loadAll();
  const idx = all.findIndex((e) => e.dateKey === entry.dateKey);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...entry };
  } else {
    all.push(entry);
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}

export async function removeEntry(dateKey) {
  const all = await loadAll();
  const next = all.filter((e) => e.dateKey !== dateKey);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

// Draft functions
async function loadAllDrafts() {
  const raw = await AsyncStorage.getItem(DRAFTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export async function saveDraft(dateKey, text, aiResult = '') {
  const all = await loadAllDrafts();
  const draft = { dateKey, text, aiResult, savedAt: new Date().toISOString() };
  const idx = all.findIndex((d) => d.dateKey === dateKey);
  if (idx >= 0) {
    all[idx] = draft;
  } else {
    all.push(draft);
  }
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(all));
}

export async function loadDraft(dateKey) {
  const all = await loadAllDrafts();
  return all.find((d) => d.dateKey === dateKey);
}

export async function removeDraft(dateKey) {
  const all = await loadAllDrafts();
  const next = all.filter((d) => d.dateKey !== dateKey);
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
}

export async function getAllDrafts() {
  return loadAllDrafts();
}


