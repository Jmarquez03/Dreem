import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'DREEM_ENTRIES_V1';

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


