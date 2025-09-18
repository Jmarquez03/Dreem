import AsyncStorage from '@react-native-async-storage/async-storage';

const CHATS_KEY = 'DREEM_CHATS_V1';

async function loadAllChats() {
  const raw = await AsyncStorage.getItem(CHATS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export async function getAllChats() {
  return loadAllChats();
}

export async function getChat(chatId) {
  const all = await loadAllChats();
  return all.find((chat) => chat.id === chatId);
}

export async function saveChat(chat) {
  const all = await loadAllChats();
  const idx = all.findIndex((c) => c.id === chat.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...chat };
  } else {
    all.push(chat);
  }
  await AsyncStorage.setItem(CHATS_KEY, JSON.stringify(all));
}

export async function createNewChat() {
  const newChat = {
    id: Date.now().toString(),
    title: 'New Chat',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveChat(newChat);
  return newChat;
}

export async function addMessageToChat(chatId, message) {
  const chat = await getChat(chatId);
  if (!chat) return null;
  
  const updatedChat = {
    ...chat,
    messages: [...chat.messages, message],
    updatedAt: new Date().toISOString(),
  };
  
  // Update title if it's still "New Chat" and this is the first user message
  if (updatedChat.title === 'New Chat' && message.role === 'user') {
    updatedChat.title = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
  }
  
  await saveChat(updatedChat);
  return updatedChat;
}

export async function deleteChat(chatId) {
  const all = await loadAllChats();
  const next = all.filter((c) => c.id !== chatId);
  await AsyncStorage.setItem(CHATS_KEY, JSON.stringify(next));
}
