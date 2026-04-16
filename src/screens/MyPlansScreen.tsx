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
  useWindowDimensions,
} from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { GamePlanCard } from '../components';

export const MyPlansScreen = () => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'created', title: 'Created' },
    { key: 'joined', title: 'Joined' },
    { key: 'requests', title: 'Requests' },
  ]);
  const layout = useWindowDimensions();
  const [createdPlans, setCreatedPlans] = useState<any[]>([]);
  const [joinedPlans, setJoinedPlans] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadPlans();

    // 🔥 Real-time subscriptions for My Plans
    const channel = supabase
      .channel('my-plans-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_plans',
        },
        (payload) => {
          console.log('🔥 My Plans: Game plan changed:', payload.eventType);
          loadPlans();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plan_participants',
        },
        (payload) => {
          console.log('🔥 My Plans: Participant changed:', payload.eventType);
          loadPlans();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'join_requests',
        },
        (payload) => {
          console.log('🔥 My Plans: Join request changed:', payload.eventType);
          loadPlans();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ My Plans real-time connected!');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPlans = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        (navigation as any).navigate('Auth');
        return;
      }

      // Load created plans
      const { data: created, error: createdError } = await supabase
        .from('game_plans')
        .select(`
          *,
          profiles!fk_game_plans_organizer(display_name)
        `)
        .eq('organizer_id', session.user.id)
        .order('date', { ascending: true });

      if (createdError) throw createdError;

      // Load joined plans
      const { data: joined, error: joinedError } = await supabase
        .from('plan_participants')
        .select(`
          *,
          game_plans(
            *,
            profiles!fk_game_plans_organizer(display_name)
          )
        `)
        .eq('user_id', session.user.id);

      if (joinedError) throw joinedError;

      // Load join requests
      const planIdsICreated = (created || []).map((p: any) => p.id);

      let requestsToMyPlans: any[] = [];
      if (planIdsICreated.length > 0) {
        const { data: req1, error: req1Err } = await supabase
          .from('join_requests')
          .select(`
            *,
            game_plans(
              *,
              profiles!fk_game_plans_organizer(display_name)
            ),
            profiles!fk_join_requests_user(display_name)
          `)
          .in('plan_id', planIdsICreated);
        if (req1Err) throw req1Err;
        requestsToMyPlans = req1 || [];
      }

      const { data: requestsISent, error: req2Err } = await supabase
        .from('join_requests')
        .select(`
          *,
          game_plans(
            *,
            profiles!fk_game_plans_organizer(display_name)
          ),
          profiles!fk_join_requests_user(display_name)
        `)
        .eq('user_id', session.user.id);
      if (req2Err) throw req2Err;

      const combined = [...requestsToMyPlans, ...(requestsISent || [])];
      const uniqueById = Array.from(
        new Map(combined.map((r) => [r.id, r])).values()
      );

      setCreatedPlans(created || []);
      setJoinedPlans(joined?.map((p) => p.game_plans) || []);
      setJoinRequests(uniqueById);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApproveRequest = async (
    requestId: string,
    planId: string,
    userId: string
  ) => {
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

      Alert.alert('Success', 'Request approved! Player has been added to the game plan.');
      loadPlans();
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
      loadPlans();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const formatPlanForCard = (plan: any) => ({
    id: plan.id,
    sport:
      plan.sport
        ?.replace('_', ' ')
        ?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || plan.sport,
    location: plan.location,
    date: new Date(plan.date).toLocaleDateString(),
    time: plan.time?.slice(0, 5),
    totalCost: plan.total_cost,
    maxPlayers: plan.max_players,
    currentPlayers: plan.current_players,
    organizer: plan.profiles?.display_name || 'Unknown',
    organizerInitials: plan.profiles?.display_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase() || 'U',
    status: plan.status as 'open' | 'full' | 'closed',
  });

  const onRefresh = () => {
    setRefreshing(true);
    loadPlans();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Loading your plans...</Text>
      </View>
    );
  }

  const pendingRequests = joinRequests.filter((r) => r.status === 'pending');

  // Render scenes for TabView
  const renderCreatedRoute = () => (
    <ScrollView
      style={styles.scene}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {createdPlans.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No plans created yet</Text>
          <Text style={styles.emptyText}>
            Start by creating your first game plan and invite others to join!
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => (navigation as any).navigate('CreatePlan')}
          >
            <Text style={styles.createButtonText}>
              + Create Your First Plan
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        createdPlans.map((plan) => (
          <GamePlanCard
            key={plan.id}
            plan={formatPlanForCard(plan)}
            showJoinButton={false}
          />
        ))
      )}
    </ScrollView>
  );

  const renderJoinedRoute = () => (
    <ScrollView
      style={styles.scene}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {joinedPlans.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No joined plans yet</Text>
          <Text style={styles.emptyText}>
            Browse available game plans and request to join activities you're interested in!
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => (navigation as any).navigate('Explore')}
          >
            <Text style={styles.browseButtonText}>Browse Game Plans</Text>
          </TouchableOpacity>
        </View>
      ) : (
        joinedPlans.map((plan) => (
          <GamePlanCard
            key={plan.id}
            plan={formatPlanForCard(plan)}
            showJoinButton={false}
          />
        ))
      )}
    </ScrollView>
  );

  const renderRequestsRoute = () => (
    <ScrollView
      style={styles.scene}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {pendingRequests.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>✓</Text>
          <Text style={styles.emptyTitle}>No pending requests</Text>
          <Text style={styles.emptyText}>
            All join requests have been processed or there are no new requests.
          </Text>
        </View>
      ) : (
        pendingRequests.map((request) => (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestTitle}>
                  {request.game_plans.sport
                    ?.replace('_', ' ')
                    ?.replace(/\b\w/g, (l: string) => l.toUpperCase())}{' '}
                  at {request.game_plans.location}
                </Text>
                <Text style={styles.requestSubtitle}>
                  Join request from {request.profiles.display_name}
                </Text>
              </View>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            </View>
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() =>
                  handleApproveRequest(
                    request.id,
                    request.plan_id,
                    request.user_id
                  )
                }
              >
                <Text style={styles.approveButtonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleRejectRequest(request.id)}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderScene = ({ route }: any) => {
    switch (route.key) {
      case 'created':
        return renderCreatedRoute();
      case 'joined':
        return renderJoinedRoute();
      case 'requests':
        return renderRequestsRoute();
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
      activeColor="#38bdf8"
      inactiveColor="#9ca3af"
      renderLabel={({ route, focused }) => (
        <View style={styles.tabLabelContainer}>
          <Text style={[
            styles.tabLabel,
            focused ? styles.tabLabelActive : styles.tabLabelInactive
          ]}>
            {route.title}
          </Text>
          <Text style={styles.tabCount}>
            {route.key === 'created' ? createdPlans.length :
             route.key === 'joined' ? joinedPlans.length :
             pendingRequests.length}
          </Text>
        </View>
      )}
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Plans</Text>
      </View>

      {/* Swipeable Tabs */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        swipeEnabled={true}
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
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
  tabLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'none',
  },
  tabLabelActive: {
    color: '#38bdf8',
  },
  tabLabelInactive: {
    color: '#9ca3af',
  },
  tabCount: {
    fontSize: 11,
    color: '#9ca3af',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  scene: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
    marginRight: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  requestSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f59e0b',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
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
    fontSize: 13,
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
    fontSize: 13,
    fontWeight: '600',
  },
});
