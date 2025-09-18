import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Alert, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeProvider';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { getAllChats, createNewChat, addMessageToChat, deleteChat } from '../storage/chatStorage';

export default function ChatScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const [chats, setChats] = useState([]);
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const refresh = async () => {
    const all = await getAllChats();
    setChats(all.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
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

  const handleNewChat = async () => {
    try {
      const newChat = await createNewChat();
      setSelectedChat(newChat);
      closeFab();
    } catch (error) {
      Alert.alert('Error', 'Failed to create new chat');
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    setIsLoading(true);
    setMessageText('');

    try {
      // Add user message
      const updatedChat = await addMessageToChat(selectedChat.id, userMessage);
      setSelectedChat(updatedChat);
      
      // Simulate AI response (you can replace this with actual AI integration)
      setTimeout(async () => {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I received your message: "${userMessage.content}". This is a simulated response. In a real implementation, this would connect to an AI service.`,
          timestamp: new Date().toISOString(),
        };
        
        const finalChat = await addMessageToChat(selectedChat.id, aiMessage);
        setSelectedChat(finalChat);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteChat(chatId);
            if (selectedChat?.id === chatId) {
              setSelectedChat(null);
            }
            refresh();
          }
        }
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  // Check if we should open a new chat from navigation params
  useEffect(() => {
    if (route.params?.openNewChat) {
      handleNewChat();
      // Clear the param to prevent reopening on subsequent visits
      navigation.setParams({ openNewChat: undefined });
    }
  }, [route.params?.openNewChat]);

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.chatItem, { backgroundColor: colors.card }]}
      onPress={() => setSelectedChat(item)}
    >
      <View style={styles.chatItemContent}>
        <Text style={[styles.chatTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.chatPreview, { color: colors.mutedText }]} numberOfLines={1}>
          {item.messages.length > 0 
            ? item.messages[item.messages.length - 1].content
            : 'No messages yet'
          }
        </Text>
        <Text style={[styles.chatDate, { color: colors.mutedText }]}>
          {format(new Date(item.updatedAt), 'MMM d, h:mm a')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteChat(item.id)}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <Text style={[
        styles.messageText,
        { color: item.role === 'user' ? 'white' : colors.text }
      ]}>
        {item.content}
      </Text>
      <Text style={[
        styles.messageTime,
        { color: item.role === 'user' ? 'rgba(255,255,255,0.7)' : colors.mutedText }
      ]}>
        {format(new Date(item.timestamp), 'h:mm a')}
      </Text>
    </View>
  );

  if (selectedChat) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedChat(null)}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {selectedChat.title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Messages */}
        <FlatList
          data={selectedChat.messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          inverted
        />

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.mutedText }]}>
              AI is thinking...
            </Text>
          </View>
        )}

        {/* Message Input */}
        <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.messageInput, { 
              borderColor: colors.border, 
              backgroundColor: colors.inputBackground, 
              color: colors.text 
            }]}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type your message..."
            placeholderTextColor={colors.mutedText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Text style={styles.menuIcon}>💬</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chats</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Chat List */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={styles.chatList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>
              No chats yet. Create your first chat!
            </Text>
          </View>
        }
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
              handleNewChat();
              closeFab();
            }}
          >
            <Text style={styles.fabMenuText}>New Chat</Text>
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
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  chatList: { 
    padding: 16, 
    paddingBottom: 100 
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  chatItemContent: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chatPreview: {
    fontSize: 14,
    marginBottom: 4,
  },
  chatDate: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#ff4444',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
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
