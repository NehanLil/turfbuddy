import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TabView, TabBar } from 'react-native-tab-view';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { User, MessageCircle, Users, PlusCircle } from 'lucide-react-native';

// DMs Tab Component
const DMsTab = ({ user, navigation }: any) => {
  const [dms, setDms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDMs();

    // Real-time subscriptions
    const channel = supabase
      .channel('dm-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'direct_messages' },
        () => loadDMs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadDMs = async () => {
    try {
      // Get all conversations
      const { data: conversations, error } = await supabase
        .from('dm_conversations')
        .select(`
          *,
          user1:profiles!dm_conversations_user1_id_fkey(user_id, display_name, avatar_url),
          user2:profiles!dm_conversations_user2_id_fkey(user_id, display_name, avatar_url),
          last_message:direct_messages(content, created_at, sender_id)
        `)
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const formattedDMs = (conversations || []).map((conv: any) => {
        const otherUser =
          conv.user1.user_id === user?.id ? conv.user2 : conv.user1;
        
        return {
          id: conv.id,
          otherUserId: otherUser.user_id,
          otherUserName: otherUser.display_name || 'User',
          otherUserAvatar: otherUser.avatar_url,
          lastMessage: conv.last_message?.content || 'Start a conversation',
          lastMessageTime: conv.last_message_at,
          unread: false, // TODO: implement unread count
        };
      })
        .filter((dm) => dm.otherUserId !== user?.id);

      setDms(formattedDMs);
    } catch (error: any) {
      console.error('Error loading DMs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  const filteredDMs = dms.filter((dm) =>
    dm.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <View style={styles.tabContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MessageCircle size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages"
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Find People Button */}
      <TouchableOpacity
        style={styles.findPeopleButton}
        onPress={() => (navigation as any).navigate('Explore')}
      >
        <PlusCircle size={20} color="#38bdf8" />
        <Text style={styles.findPeopleText}>Find people to message</Text>
      </TouchableOpacity>

      {/* DMs List */}
      <ScrollView style={styles.list}>
        {filteredDMs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageCircle size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No direct messages yet</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No conversations match your search' : 'Tap "Find people to message" above to start chatting'}
            </Text>
          </View>
        ) : (
          filteredDMs.map((dm) => (
            <TouchableOpacity
              key={dm.id}
              style={styles.dmItem}
              onPress={() =>
                (navigation as any).navigate('DMChat', {
                  userId: dm.otherUserId,
                  userName: dm.otherUserName,
                })
              }
              onLongPress={() => {
                Alert.alert(
                  'Delete Chat',
                  'Are you sure you want to delete this chat? This will remove all messages for you.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          // Delete DM conversation and messages for this user
                          await supabase
                            .from('dm_conversations')
                            .delete()
                            .eq('id', dm.id);
                          await supabase
                            .from('direct_messages')
                            .delete()
                            .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`);
                          loadDMs();
                        } catch (error: any) {
                          Alert.alert('Error', 'Failed to delete chat.');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <View style={styles.dmAvatar}>
                {dm.otherUserAvatar ? (
                  <Image source={{ uri: dm.otherUserAvatar }} style={styles.avatarImage} />
                ) : (
                  <User size={24} color="#94a3b8" />
                )}
              </View>
              <View style={styles.dmInfo}>
                <View style={styles.dmHeader}>
                  <Text style={styles.dmName}>{dm.otherUserName}</Text>
                  <Text style={styles.dmTime}>{formatTime(dm.lastMessageTime)}</Text>
                </View>
                <Text style={styles.dmLastMessage} numberOfLines={1}>
                  {dm.lastMessage}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

// Groups Tab Component
const GroupsTab = ({ user, navigation }: any) => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChats();

    // Real-time subscription
    const channel = supabase
      .channel('messages-list-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => loadChats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_plans' },
        () => loadChats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadChats = async () => {
    if (!user) return;

    try {
      // Get plans where user is organizer
      const { data: organizerPlans, error: orgError } = await supabase
        .from('game_plans')
        .select(`
          id,
          title,
          sport,
          location,
          date,
          organizer_id,
          profiles!fk_game_plans_organizer(display_name, avatar_url)
        `)
        .eq('organizer_id', user.id);

      if (orgError) throw orgError;

      // Get plans where user is participant
      const { data: participantData, error: partError } = await supabase
        .from('plan_participants')
        .select(`
          plan_id,
          game_plans!inner(
            id,
            title,
            sport,
            location,
            date,
            organizer_id,
            profiles!fk_game_plans_organizer(display_name, avatar_url)
          )
        `)
        .eq('user_id', user.id);

      if (partError) throw partError;

      // Combine both lists
      const participantPlans = participantData?.map((p: any) => p.game_plans) || [];
      const allPlans = [...(organizerPlans || []), ...participantPlans];

      // Remove duplicates
      const uniquePlans = allPlans.filter(
        (plan, index, self) => plan && self.findIndex((p) => p?.id === plan?.id) === index
      );

      // For each plan, get the last message
      const chatsWithMessages = await Promise.all(
        uniquePlans.map(async (plan) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('plan_id', plan.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('plan_id', plan.id);

          return {
            id: plan.id,
            title: plan.title,
            sport: plan.sport,
            location: plan.location,
            date: plan.date,
            organizer_name: plan.profiles?.display_name || 'Unknown',
            organizer_avatar: plan.profiles?.avatar_url || '',
            last_message: lastMessage?.content || null,
            last_message_time: lastMessage?.created_at || null,
            message_count: count || 0,
          };
        })
      );

      // Sort by last message time
      chatsWithMessages.sort((a, b) => {
        if (!a.last_message_time) return 1;
        if (!b.last_message_time) return -1;
        return (
          new Date(b.last_message_time).getTime() -
          new Date(a.last_message_time).getTime()
        );
      });

      setChats(chatsWithMessages);
    } catch (error: any) {
      console.error('Load chats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  const filteredChats = chats.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <View style={styles.tabContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Users size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups"
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Groups List */}
      <ScrollView style={styles.list}>
        {filteredChats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No group chats yet</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'No groups match your search'
                : 'Join a game plan to start chatting with your team'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => (navigation as any).navigate('Explore')}
              >
                <Text style={styles.browseButtonText}>Browse game plans</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredChats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={styles.groupItem}
              onPress={() => {
                if (chat.group_id) {
                  (navigation as any).navigate('GroupInfo', { groupId: chat.group_id });
                } else {
                  (navigation as any).navigate('ChatView', { planId: chat.id });
                }
              }}
              onLongPress={() => {
                Alert.alert(
                  'Leave Group',
                  'Are you sure you want to leave this group? You will no longer receive messages or invites.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Leave',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          // Remove user from group_members
                          await supabase
                            .from('group_members')
                            .delete()
                            .eq('group_id', chat.group_id || chat.id)
                            .eq('user_id', user?.id);
                          loadChats();
                        } catch (error: any) {
                          Alert.alert('Error', 'Failed to leave group.');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <View style={styles.groupAvatar}>
                <Users size={24} color="#fff" />
              </View>
              <View style={styles.groupInfo}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle} numberOfLines={1}>
                    {chat.title}
                  </Text>
                  {chat.last_message_time && (
                    <Text style={styles.groupTime}>
                      {formatTime(chat.last_message_time)}
                    </Text>
                  )}
                </View>
                <View style={styles.messageRow}>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {chat.last_message || 'Tap to start chatting'}
                  </Text>
                  <View style={styles.sportBadge}>
                    <Text style={styles.sportBadgeText}>
                      {chat.sport.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

// Main Messages Screen with Tabs
export const MessagesScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'dms', title: 'Direct' },
    { key: 'groups', title: 'Groups' },
  ]);

  const renderScene = ({ route }: any) => {
    switch (route.key) {
      case 'dms':
        return <DMsTab user={user} navigation={navigation} />;
      case 'groups':
        return <GroupsTab user={user} navigation={navigation} />;
      default:
        return null;
    }
  };

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      activeColor="#111827"
      inactiveColor="#6b7280"
    />
  );

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
      />
    </View>
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
  },
  tabContainer: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabIndicator: {
    backgroundColor: '#38bdf8',
    height: 3,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'none',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  list: {
    flex: 1,
  },
  // DM Item Styles
  dmItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dmAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  dmInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  dmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dmName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  dmTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 8,
  },
  dmLastMessage: {
    fontSize: 14,
    color: '#6b7280',
  },
  // Group Item Styles
  groupItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  groupAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  groupTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  sportBadge: {
    backgroundColor: '#38bdf820',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sportBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#38bdf8',
    textTransform: 'capitalize',
  },
  // Empty States
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  findPeopleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 8,
  },
  findPeopleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38bdf8',
  },
});
