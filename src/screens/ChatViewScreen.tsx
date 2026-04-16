import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { PlusCircle, X } from 'lucide-react-native';

export const ChatViewScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { planId } = route.params as { planId: string };
  const { user } = useAuth();

  const [plan, setPlan] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!user) {
      (navigation as any).navigate('Auth');
      return;
    }
    if (planId) {
      loadPlanAndMessages();
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [planId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadPlanAndMessages = async () => {
    try {
      // Load plan details
      const { data: planData, error: planError } = await supabase
        .from('game_plans')
        .select(`
          *,
          profiles!fk_game_plans_organizer(display_name, avatar_url)
        `)
        .eq('id', planId)
        .single();

      if (planError) throw planError;
      setPlan(planData);

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!fk_messages_user(display_name, avatar_url)
        `)
        .eq('plan_id', planId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`plan-${planId}-messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `plan_id=eq.${planId}`,
        },
        async (payload) => {
          // Fetch the full message with profile data
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              profiles!fk_messages_user(display_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => {
              const exists = prev.some((msg) => msg.id === data.id);
              if (exists) return prev;
              return [...prev, data];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        plan_id: planId,
        user_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwnMessage = item.user_id === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.messageContainerOwn : styles.messageContainerOther,
        ]}
      >
        {!isOwnMessage && (
          <TouchableOpacity
            style={styles.messageAvatar}
            onPress={() => (navigation as any).navigate('UserProfile', { userId: item.user_id })}
          >
            <Text style={styles.messageAvatarText}>
              {getInitials(item.profiles?.display_name || 'U')}
            </Text>
          </TouchableOpacity>
        )}

        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.messageBubbleOwn : styles.messageBubbleOther,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.messageTextOwn : styles.messageTextOther,
            ]}
          >
            {item.content}
          </Text>
          <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Chat not found</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Back to Messages</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {getInitials(plan.profiles?.display_name || 'U')}
          </Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {plan.title}
          </Text>
          <View style={styles.headerBadges}>
            <View style={styles.sportBadge}>
              <Text style={styles.sportBadgeText}>{plan.sport.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.playerCount}>
              {plan.current_players}/{plan.max_players} players
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => (navigation as any).navigate('PlanDetails', { planId })}
        >
          <Text style={styles.infoButtonText}>ℹ️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
        >
          <PlusCircle size={24} color="#38bdf8" />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuModal}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                // If this chat is for a group, pass groupId
                if (plan?.group_id) {
                  (navigation as any).navigate('CreatePlan', { groupId: plan.group_id });
                } else {
                  (navigation as any).navigate('CreatePlan', { groupId: null });
                }
              }}
            >
              <PlusCircle size={20} color="#38bdf8" />
              <Text style={styles.menuItemText}>Create New Game Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowMenu(false)}
            >
              <X size={20} color="#6b7280" />
              <Text style={[styles.menuItemText, { color: '#6b7280' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyMessagesText}>
              No messages yet. Start the conversation!
            </Text>
          </View>
        }
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor="#9ca3af"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={sending || !newMessage.trim()}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  backButtonText: {
    fontSize: 24,
    color: '#111827',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sportBadge: {
    backgroundColor: '#38bdf820',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sportBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#38bdf8',
    textTransform: 'capitalize',
  },
  playerCount: {
    fontSize: 11,
    color: '#6b7280',
  },
  infoButton: {
    padding: 8,
  },
  infoButtonText: {
    fontSize: 20,
  },
  menuButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    width: '80%',
    maxWidth: 300,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  messagesList: {
    padding: 16,
  },
  emptyMessages: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyMessagesText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    maxWidth: '75%',
    alignItems: 'flex-end',
  },
  messageContainerOwn: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageContainerOther: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  messageAvatarText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  messageBubbleOwn: {
    backgroundColor: '#38bdf8',
  },
  messageBubbleOther: {
    backgroundColor: '#e5e7eb',
  },
  messageTime: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: '#fff',
  },
  messageTextOther: {
    color: '#111827',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#111827',
  },
  sendButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

