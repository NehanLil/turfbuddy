import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { GamePlanCard } from '../components';

const sports = [
  { value: 'all', label: 'All', icon: '⚽' },
  { value: 'football', label: 'Football', icon: '⚽' },
  { value: 'cricket', label: 'Cricket', icon: '🏏' },
  { value: 'badminton', label: 'Badminton', icon: '🏸' },
  { value: 'basketball', label: 'Basketball', icon: '🏀' },
  { value: 'tennis', label: 'Tennis', icon: '🎾' },
  { value: 'volleyball', label: 'Volleyball', icon: '🏐' },
  { value: 'table_tennis', label: 'Table Tennis', icon: '🏓' },
];

export const ExploreScreen = () => {
  const [gamePlans, setGamePlans] = useState<any[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadGamePlans();

    // 🔥 Real-time subscription for explore screen
    const channel = supabase
      .channel('explore-game-plans')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_plans',
        },
        (payload) => {
          console.log('🔥 Explore: Game plan changed:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            // Add new plan to list
            const newPlan = payload.new;
            if (newPlan.status === 'open' && new Date(newPlan.date) >= new Date()) {
              setGamePlans(prev => [newPlan, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Update existing plan
            setGamePlans(prev => 
              prev.map(plan => plan.id === payload.new.id ? payload.new : plan)
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted plan
            setGamePlans(prev => prev.filter(plan => plan.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Explore real-time connected!');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterPlans();
  }, [gamePlans, searchQuery, selectedSport, selectedDate]);

  const loadGamePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('game_plans')
        .select(`
          *,
          profiles!fk_game_plans_organizer(display_name)
        `)
        .in('status', ['open'])
        .neq('organizer_id', user?.id)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      setGamePlans(data || []);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load game plans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterPlans = () => {
    let filtered = gamePlans;

    if (selectedSport !== 'all') {
      filtered = filtered.filter((plan) => plan.sport === selectedSport);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (plan) =>
          plan.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plan.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plan.sport?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedDate) {
      filtered = filtered.filter((plan) => plan.date === selectedDate);
    }

    setFilteredPlans(filtered);
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
          Alert.alert(
            'Already Requested',
            "You've already sent a join request for this plan."
          );
        } else {
          throw error;
        }
      } else {
        Alert.alert('Success', 'Join request sent! The organizer will review your request.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGamePlans();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore Games</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search sports, locations..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Sport Filters */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sportFiltersContent}
          >
            {sports.map((sport) => (
              <TouchableOpacity
                key={sport.value}
                style={[
                  styles.sportChip,
                  selectedSport === sport.value && styles.sportChipActive,
                ]}
                onPress={() => setSelectedSport(sport.value)}
              >
                <Text style={styles.sportIcon}>{sport.icon}</Text>
                <Text
                  style={[
                    styles.sportLabel,
                    selectedSport === sport.value && styles.sportLabelActive,
                  ]}
                >
                  {sport.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Date Filters */}
        <View style={styles.dateFilters}>
          <TouchableOpacity
            style={[
              styles.dateFilterChip,
              selectedDate === '' && styles.dateFilterChipActive,
            ]}
            onPress={() => setSelectedDate('')}
          >
            <Text
              style={[
                styles.dateFilterText,
                selectedDate === '' && styles.dateFilterTextActive,
              ]}
            >
              All Dates
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dateFilterChip,
              selectedDate === new Date().toISOString().split('T')[0] &&
                styles.dateFilterChipActive,
            ]}
            onPress={() =>
              setSelectedDate(new Date().toISOString().split('T')[0])
            }
          >
            <Text
              style={[
                styles.dateFilterText,
                selectedDate === new Date().toISOString().split('T')[0] &&
                  styles.dateFilterTextActive,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dateFilterChip,
              selectedDate ===
                new Date(Date.now() + 86400000).toISOString().split('T')[0] &&
                styles.dateFilterChipActive,
            ]}
            onPress={() =>
              setSelectedDate(
                new Date(Date.now() + 86400000).toISOString().split('T')[0]
              )
            }
          >
            <Text
              style={[
                styles.dateFilterText,
                selectedDate ===
                  new Date(Date.now() + 86400000)
                    .toISOString()
                    .split('T')[0] && styles.dateFilterTextActive,
              ]}
            >
              Tomorrow
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {filteredPlans.length}{' '}
            {filteredPlans.length === 1 ? 'game' : 'games'} found
          </Text>
        </View>

        {/* Game Plans */}
        <View style={styles.gameListContainer}>
          {filteredPlans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No games found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your filters or search
              </Text>
            </View>
          ) : (
            filteredPlans.map((plan) => (
              <GamePlanCard
                key={plan.id}
                plan={formatPlanForCard(plan)}
                onJoin={handleJoinPlan}
              />
            ))
          )}
        </View>
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  filterSection: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sportFiltersContent: {
    paddingHorizontal: 16,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sportChipActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  sportIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  sportLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  sportLabelActive: {
    color: '#fff',
  },
  dateFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    backgroundColor: '#fff',
    marginBottom: 2,
  },
  dateFilterChip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  dateFilterChipActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  dateFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  dateFilterTextActive: {
    color: '#fff',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  gameListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 16,
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
  },
});
