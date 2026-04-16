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
import { GamePlanCard } from '../components';

export const DashboardScreen = () => {
  const [nearbyPlans, setNearbyPlans] = useState<any[]>([]);
  const [soonPlans, setSoonPlans] = useState<any[]>([]);
  const [fillingFastPlans, setFillingFastPlans] = useState<any[]>([]);
  const [upcomingPlans, setUpcomingPlans] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadPersonalizedFeed();
    } else {
      loadGuestFeed();
    }

    // 🔥 Real-time subscription for game plan updates
    const channel = supabase
      .channel('dashboard-game-plans')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'game_plans',
        },
        (payload) => {
          console.log('🔥 Game plan change detected:', payload.eventType);
          // Reload feed when plans change
          if (user) {
            loadPersonalizedFeed();
          } else {
            loadGuestFeed();
          }
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
          console.log('🔥 Participant change detected:', payload.eventType);
          // Reload when someone joins/leaves
          if (user) {
            loadPersonalizedFeed();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Dashboard real-time connected!');
        }
      });

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadPersonalizedFeed = async () => {
    try {
      // Load all open plans (excluding user's own plans)
      const { data: allPlans, error } = await supabase
        .from('game_plans')
        .select(`
          *,
          profiles!fk_game_plans_organizer(display_name)
        `)
        .eq('status', 'open')
        .neq('organizer_id', user?.id)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      const plans = allPlans || [];

      // 1. Nearby Plans (first 3)
      setNearbyPlans(plans.slice(0, 3));

      // 2. Starting Soon (within 3 hours)
      const now = new Date();
      const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      const soon = plans.filter((p) => {
        const planDateTime = new Date(`${p.date}T${p.time}`);
        return planDateTime >= now && planDateTime <= threeHoursLater;
      });
      setSoonPlans(soon.slice(0, 3));

      // 3. Filling Fast (80%+ full)
      const fillingFast = plans.filter((p) => {
        const fillPercentage = (p.current_players / p.max_players) * 100;
        return fillPercentage >= 80;
      });
      setFillingFastPlans(fillingFast.slice(0, 3));

      // 4. User's Upcoming Plans
      const { data: userPlans } = await supabase
        .from('plan_participants')
        .select(`
          *,
          game_plans(
            *,
            profiles!fk_game_plans_organizer(display_name)
          )
        `)
        .eq('user_id', user?.id)
        .order('joined_at', { ascending: false });

      const upcoming = (userPlans || [])
        .map((p) => p.game_plans)
        .filter((p) => p && new Date(p.date) >= new Date())
        .slice(0, 2);
      setUpcomingPlans(upcoming);

      // 5. Notifications (pending join requests)
      const { data: requests } = await supabase
        .from('join_requests')
        .select(`
          *,
          game_plans(title, sport),
          profiles!fk_join_requests_user(display_name)
        `)
        .eq('status', 'pending')
        .in(
          'plan_id',
          plans.filter((p) => p.organizer_id === user?.id).map((p) => p.id)
        )
        .order('created_at', { ascending: false })
        .limit(3);

      setNotifications(requests || []);
    } catch (error: any) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadGuestFeed = async () => {
    try {
      const { data: plans, error } = await supabase
        .from('game_plans')
        .select(`
          *,
          profiles!fk_game_plans_organizer(display_name)
        `)
        .eq('status', 'open')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('current_players', { ascending: false })
        .limit(4);

      if (error) throw error;
      setNearbyPlans(plans || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const handleJoinPlan = async (planId: string) => {
    if (!user) {
      (navigation as any).navigate('Auth');
      return;
    }

    try {
      const { error } = await supabase.from('join_requests').insert({
        plan_id: planId,
        user_id: user.id,
      });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Already Requested', "You've already sent a join request");
        } else {
          throw error;
        }
      } else {
        Alert.alert(
          'Success',
          'Join request sent! The organizer will review your request.'
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (user) {
      loadPersonalizedFeed();
    } else {
      loadGuestFeed();
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  // Guest View
  if (!user) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to TurfBuddy! 🏃</Text>
          <Text style={styles.welcomeText}>
            Find players, book turfs, and split costs effortlessly
          </Text>
          <View style={styles.welcomeButtons}>
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => (navigation as any).navigate('Auth')}
            >
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => (navigation as any).navigate('Explore')}
            >
              <Text style={styles.browseButtonText}>Browse Games</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Popular Games */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Popular Games</Text>
          {nearbyPlans.map((plan) => (
            <GamePlanCard
              key={plan.id}
              plan={formatPlanForCard(plan)}
              onJoin={handleJoinPlan}
            />
          ))}
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksCard}>
          <Text style={styles.howItWorksTitle}>How It Works</Text>
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Find a Game</Text>
              <Text style={styles.stepText}>Browse games near you</Text>
            </View>
          </View>
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Request to Join</Text>
              <Text style={styles.stepText}>Organizer approves your request</Text>
            </View>
          </View>
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Split the Cost</Text>
              <Text style={styles.stepText}>Pay your share and play!</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Logged-in User View
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.scrollContent}
    >
      {/* Nearby Games */}
      {nearbyPlans.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionIcon}>📍</Text>
              <Text style={styles.sectionTitle}>Near You</Text>
            </View>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('Explore')}
            >
              <Text style={styles.seeAllText}>See all →</Text>
            </TouchableOpacity>
          </View>
          {nearbyPlans.map((plan) => (
            <GamePlanCard
              key={plan.id}
              plan={formatPlanForCard(plan)}
              onJoin={handleJoinPlan}
            />
          ))}
        </View>
      )}

      {/* Starting Soon */}
      {soonPlans.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionIcon}>🕐</Text>
              <Text style={styles.sectionTitle}>Starting Soon</Text>
            </View>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('Explore')}
            >
              <Text style={styles.seeAllText}>See all →</Text>
            </TouchableOpacity>
          </View>
          {soonPlans.map((plan) => (
            <GamePlanCard
              key={plan.id}
              plan={formatPlanForCard(plan)}
              onJoin={handleJoinPlan}
            />
          ))}
        </View>
      )}

      {/* Filling Fast */}
      {fillingFastPlans.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionIcon}>🔥</Text>
              <Text style={styles.sectionTitle}>Filling Fast</Text>
            </View>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('Explore')}
            >
              <Text style={styles.seeAllText}>See all →</Text>
            </TouchableOpacity>
          </View>
          {fillingFastPlans.map((plan) => (
            <GamePlanCard
              key={plan.id}
              plan={formatPlanForCard(plan)}
              onJoin={handleJoinPlan}
            />
          ))}
        </View>
      )}

      {/* Your Upcoming */}
      {upcomingPlans.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionIcon}>📅</Text>
              <Text style={styles.sectionTitle}>Your Upcoming</Text>
            </View>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('MyPlans')}
            >
              <Text style={styles.seeAllText}>See all →</Text>
            </TouchableOpacity>
          </View>
          {upcomingPlans.map((plan) => (
            <GamePlanCard
              key={plan.id}
              plan={formatPlanForCard(plan)}
              showJoinButton={false}
            />
          ))}
        </View>
      )}

      {/* Activity/Notifications */}
      {notifications.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionIcon}>🔔</Text>
              <Text style={styles.sectionTitle}>Activity</Text>
            </View>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('MyPlans')}
            >
              <Text style={styles.seeAllText}>See all →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.notificationsCard}>
            {notifications.map((notif) => (
              <View key={notif.id} style={styles.notificationItem}>
                <View style={styles.notificationLeft}>
                  <Text style={styles.notificationIcon}>👥</Text>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationText}>
                      {notif.profiles?.display_name} wants to join
                    </Text>
                    <Text style={styles.notificationSubtext}>
                      {notif.game_plans?.title}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={() => (navigation as any).navigate('MyPlans')}
                >
                  <Text style={styles.reviewButtonText}>Review</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Empty State */}
      {nearbyPlans.length === 0 &&
        soonPlans.length === 0 &&
        fillingFastPlans.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No games found nearby</Text>
            <Text style={styles.emptyText}>
              Be the first to create a game in your area!
            </Text>
            <View style={styles.emptyButtons}>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => (navigation as any).navigate('CreatePlan')}
              >
                <Text style={styles.createButtonText}>Create Game</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => (navigation as any).navigate('Explore')}
              >
                <Text style={styles.exploreButtonText}>Explore All Games</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 13,
    color: '#38bdf8',
    fontWeight: '500',
  },
  welcomeCard: {
    backgroundColor: '#38bdf820',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  welcomeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  signUpButton: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  browseButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  browseButtonText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
  },
  howItWorksCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  stepText: {
    fontSize: 13,
    color: '#6b7280',
  },
  notificationsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  notificationSubtext: {
    fontSize: 11,
    color: '#6b7280',
  },
  reviewButton: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
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
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  createButton: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  exploreButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exploreButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
});

