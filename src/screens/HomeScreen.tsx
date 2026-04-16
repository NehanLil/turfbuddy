import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { GamePlanCard } from '../components';

interface GamePlan {
  id: string;
  sport: string;
  title: string;
  location: string;
  date: string;
  time: string;
  total_cost: number;
  max_players: number;
  current_players: number;
  status: string;
  organizer: string;
  lat?: number;
  lng?: number;
  city?: string;
}

const sports = [
  { value: 'all', label: 'All', icon: '⚽' },
  { value: 'football', label: 'Football', icon: '⚽' },
  { value: 'cricket', label: 'Cricket', icon: '🏏' },
  { value: 'badminton', label: 'Badminton', icon: '🏸' },
  { value: 'basketball', label: 'Basketball', icon: '🏀' },
  { value: 'tennis', label: 'Tennis', icon: '🎾' },
  { value: 'volleyball', label: 'Volleyball', icon: '🏐' },
];

export const HomeScreen = () => {
  const [gamePlans, setGamePlans] = useState<GamePlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<GamePlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadGamePlans();
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
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      const plans: GamePlan[] = (data || []).map((plan: any) => ({
        id: plan.id,
        sport: plan.sport,
        title: plan.title,
        location: plan.location,
        date: plan.date,
        time: plan.time,
        total_cost: plan.total_cost,
        max_players: plan.max_players,
        current_players: plan.current_players || 0,
        status: plan.status,
        organizer: plan.profiles?.display_name || 'Unknown',
        lat: plan.lat,
        lng: plan.lng,
        city: plan.city,
      }));

      setGamePlans(plans);
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
          plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plan.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plan.sport.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedDate) {
      filtered = filtered.filter((plan) => plan.date === selectedDate);
    }

    setFilteredPlans(filtered);
  };

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
            "You've already sent a join request for this plan"
          );
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

  const formatPlanForCard = (plan: GamePlan) => ({
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
    organizer: plan.organizer,
    organizerInitials: plan.organizer
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase(),
    status: plan.status as 'open' | 'full' | 'closed',
  });

  const onRefresh = () => {
    setRefreshing(true);
    loadGamePlans();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Loading game plans...</Text>
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
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <View style={styles.heroGradient}>
            <Text style={styles.heroTitle}>Find Your Game</Text>
            <Text style={styles.heroSubtitle}>
              Connect with players, book turfs, and split costs
            </Text>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search sport or location..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Sport Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sportFilters}
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
                      selectedSport === sport.value &&
                        styles.sportLabelActive,
                    ]}
                  >
                    {sport.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Create Button */}
            {user && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => (navigation as any).navigate('CreatePlan')}
              >
                <Text style={styles.createButtonText}>+ Create Game Plan</Text>
              </TouchableOpacity>
            )}
          </View>
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

        {/* Results Count */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {selectedSport !== 'all'
              ? `${sports.find((s) => s.value === selectedSport)?.label} Games`
              : 'Available Games'}
          </Text>
          <Text style={styles.resultsCount}>
            {filteredPlans.length}{' '}
            {filteredPlans.length === 1 ? 'game' : 'games'} found
          </Text>
        </View>

        {/* Game Plans List */}
        <View style={styles.gameListContainer}>
          {filteredPlans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No game plans found</Text>
              <Text style={styles.emptyText}>
                {searchQuery || selectedSport !== 'all' || selectedDate
                  ? 'Try adjusting your filters or search criteria'
                  : 'No plans available yet. Create the first one!'}
              </Text>
              {user && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => (navigation as any).navigate('CreatePlan')}
                >
                  <Text style={styles.emptyButtonText}>Create Game Plan</Text>
                </TouchableOpacity>
              )}
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
    fontSize: 14,
  },
  heroContainer: {
    backgroundColor: '#fff',
    marginBottom: 2,
  },
  heroGradient: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 20,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  sportFilters: {
    marginBottom: 16,
  },
  sportFiltersContent: {
    paddingRight: 16,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff40',
    borderRadius: 20,
    marginRight: 8,
  },
  sportChipActive: {
    backgroundColor: '#fff',
  },
  sportIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  sportLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
  },
  sportLabelActive: {
    color: '#38bdf8',
  },
  createButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  dateFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    marginBottom: 2,
  },
  dateFilterChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  resultsCount: {
    fontSize: 13,
    color: '#6b7280',
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
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
