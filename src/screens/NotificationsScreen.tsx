import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle, XCircle, Clock, UserPlus } from 'lucide-react-native';

export const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      (navigation as any).navigate('Auth');
      return;
    }
    loadNotifications();

    // 🔥 Real-time notifications
    const channel = supabase
      .channel('notifications-screen')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'join_requests',
        },
        () => {
          console.log('🔔 Notification changed');
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      // Get user's plans
      const { data: myPlans } = await supabase
        .from('game_plans')
        .select('id, title, sport, date, time')
        .eq('organizer_id', user.id);

      const planIds = (myPlans || []).map((p) => p.id);

      // Get pending requests to user's plans
      let incomingRequests: any[] = [];
      if (planIds.length > 0) {
        const { data: requests } = await supabase
          .from('join_requests')
          .select(`
            *,
            profiles!fk_join_requests_user(display_name, avatar_url),
            game_plans(title, sport, date, time)
          `)
          .in('plan_id', planIds)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        incomingRequests = (requests || []).map((r) => ({
          ...r,
          type: 'incoming',
          icon: 'UserPlus',
          title: `Join Request`,
          message: `${r.profiles.display_name} wants to join "${r.game_plans.title}"`,
        }));
      }

      // Get user's sent requests that were approved/rejected
      const { data: statusUpdates } = await supabase
        .from('join_requests')
        .select(`
          *,
          game_plans(title, sport, date, time, organizer_id)
        `)
        .eq('user_id', user.id)
        .in('status', ['approved', 'rejected'])
        .order('updated_at', { ascending: false })
        .limit(20);

      const statusNotifications = (statusUpdates || []).map((r) => ({
        ...r,
        type: r.status === 'approved' ? 'approved' : 'rejected',
        icon: r.status === 'approved' ? 'CheckCircle' : 'XCircle',
        title: r.status === 'approved' ? 'Request Approved! 🎉' : 'Request Rejected',
        message:
          r.status === 'approved'
            ? `You can now join "${r.game_plans.title}"`
            : `Your request to join "${r.game_plans.title}" was rejected`,
      }));

      // Combine and sort
      const allNotifications = [...incomingRequests, ...statusNotifications].sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime()
      );

      setNotifications(allNotifications);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApproveRequest = async (requestId: string, planId: string, userId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('join_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      const { error: insertError } = await supabase
        .from('plan_participants')
        .insert({ plan_id: planId, user_id: userId });

      if (insertError) throw insertError;

      Alert.alert('Success', 'Request approved! Player added to the game plan.');
      loadNotifications();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('join_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      Alert.alert('Success', 'Request rejected.');
      loadNotifications();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleNotificationPress = (notification: any) => {
    if (notification.type === 'incoming') {
      // Go to plan details
      (navigation as any).navigate('PlanDetails', { planId: notification.plan_id });
    } else if (notification.type === 'approved') {
      // Go to plan details
      (navigation as any).navigate('PlanDetails', { planId: notification.plan_id });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? 'Yesterday' : `${diffInDays}d ago`;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
              You're all caught up! Join requests and updates will appear here.
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <View key={notification.id} style={styles.notificationCard}>
              <TouchableOpacity
                style={styles.notificationContent}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.iconContainer}>
                  {notification.icon === 'UserPlus' && (
                    <UserPlus size={24} color="#38bdf8" />
                  )}
                  {notification.icon === 'CheckCircle' && (
                    <CheckCircle size={24} color="#10b981" />
                  )}
                  {notification.icon === 'XCircle' && (
                    <XCircle size={24} color="#ef4444" />
                  )}
                </View>

                <View style={styles.notificationInfo}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {formatTime(notification.updated_at || notification.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Action Buttons for Incoming Requests */}
              {notification.type === 'incoming' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() =>
                      handleApproveRequest(
                        notification.id,
                        notification.plan_id,
                        notification.user_id
                      )
                    }
                  >
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleRejectRequest(notification.id)}
                  >
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 28,
    color: '#111827',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#38bdf8',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
});


