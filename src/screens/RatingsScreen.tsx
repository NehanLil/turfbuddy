import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Star, User } from 'lucide-react-native';

export const RatingsScreen = () => {
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      // Load ratings
      const { data, error } = await supabase
        .from('user_ratings')
        .select(`
          *,
          rater:profiles!user_ratings_rater_user_id_fkey(display_name, avatar_url),
          plan:game_plans(title, sport)
        `)
        .eq('rated_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRatings(data || []);

      // Calculate average
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(avg);
      }
    } catch (error: any) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        color={i < rating ? '#f59e0b' : '#e5e7eb'}
        fill={i < rating ? '#f59e0b' : 'none'}
      />
    ));
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ratings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.ratingCircle}>
            <Star size={32} color="#f59e0b" fill="#f59e0b" />
            <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
          </View>
          <Text style={styles.ratingText}>
            {ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'}
          </Text>
        </View>

        {/* Ratings List */}
        {ratings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No ratings yet</Text>
            <Text style={styles.emptySubtext}>
              Complete game plans to receive ratings from other players
            </Text>
          </View>
        ) : (
          ratings.map((rating) => (
            <View key={rating.id} style={styles.ratingCard}>
              <View style={styles.ratingHeader}>
                <View style={styles.raterInfo}>
                  <View style={styles.avatar}>
                    <User size={20} color="#94a3b8" />
                  </View>
                  <View>
                    <Text style={styles.raterName}>
                      {rating.rater?.display_name || 'Anonymous'}
                    </Text>
                    <Text style={styles.planName}>
                      {rating.plan?.title || 'Unknown plan'}
                    </Text>
                  </View>
                </View>
                <View style={styles.starsRow}>{renderStars(rating.rating)}</View>
              </View>
              {rating.review && (
                <Text style={styles.reviewText}>{rating.review}</Text>
              )}
              <Text style={styles.ratingDate}>
                {new Date(rating.created_at).toLocaleDateString()}
              </Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 28,
    color: '#111827',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 28,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  ratingCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  raterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  raterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  planName: {
    fontSize: 12,
    color: '#6b7280',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
  },
  ratingDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

