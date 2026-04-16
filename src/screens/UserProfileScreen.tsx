import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { getPreferenceLabel } from './PreferencesQuizScreen';
import { User, Star, CheckCircle, MessageCircle, Heart, Receipt } from 'lucide-react-native';

export const UserProfileScreen = () => {
  const [profile, setProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { userId } = route.params as { userId: string };

  useEffect(() => {
    console.log('UserProfileScreen mounted with userId:', userId);
    
    if (!userId) {
      Alert.alert('Error', 'No user ID provided');
      navigation.goBack();
      return;
    }
    
    loadUserProfile();
    loadUserPreferences();
    loadUserRatings();
    checkIfSaved();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      console.log('Loading profile for userId:', userId);
      
      // Try to load by id first
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // If not found by id, try by user_id
      if (!data && !error) {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        throw error;
      }

      if (!data) {
        Alert.alert('Error', 'Profile not found');
        navigation.goBack();
        return;
      }

      console.log('Profile loaded:', data);
      setProfile(data);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile: ' + error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      console.log('Loading preferences for userId:', userId);
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
      }

      console.log('Preferences loaded:', data);
      setPreferences(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadUserRatings = async () => {
    try {
      const { data } = await supabase
        .from('user_ratings')
        .select(`
          *,
          rater:profiles!user_ratings_rater_id_fkey(display_name, avatar_url)
        `)
        .eq('rated_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      setRatings(data || []);
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const checkIfSaved = async () => {
    try {
      const { data } = await supabase
        .from('saved_players')
        .select('id')
        .eq('user_id', user?.id)
        .eq('saved_user_id', userId)
        .maybeSingle();

      setIsSaved(!!data);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const toggleSavePlayer = async () => {
    try {
      if (isSaved) {
        // Remove from saved
        await supabase
          .from('saved_players')
          .delete()
          .eq('user_id', user?.id)
          .eq('saved_user_id', userId);
        setIsSaved(false);
        Alert.alert('Removed', 'Player removed from saved list');
      } else {
        // Add to saved
        await supabase
          .from('saved_players')
          .insert({
            user_id: user?.id,
            saved_user_id: userId,
          });
        setIsSaved(true);
        Alert.alert('Saved', 'Player added to your saved list');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSendMessage = () => {
    (navigation as any).navigate('DMChat', { userId, userName: profile?.display_name });
  };

  const calculateReliability = (role: 'organizer' | 'participant') => {
    if (!profile) return 'No history yet';
    
    const totalPlans = role === 'organizer' 
      ? profile.total_plans_organized || 0 
      : profile.total_plans_participated || 0;
    
    const cancelled = role === 'organizer'
      ? profile.plans_cancelled_as_organizer || 0
      : profile.plans_cancelled_as_participant || 0;

    if (totalPlans === 0) return 'No history yet';
    
    const cancelRate = (cancelled / totalPlans) * 100;
    
    if (cancelRate === 0) return 'Never cancels bookings';
    if (cancelRate < 10) return 'Rarely cancels bookings';
    if (cancelRate < 25) return 'Sometimes cancels bookings';
    return 'Frequently cancels bookings';
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
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={toggleSavePlayer}>
          <Heart size={24} color={isSaved ? '#f43f5e' : '#6b7280'} fill={isSaved ? '#f43f5e' : 'none'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={60} color="#94a3b8" />
              </View>
            )}
            {(profile?.phone_verified || profile?.email_verified) && (
              <View style={styles.verifiedBadge}>
                <CheckCircle size={24} color="#38bdf8" fill="#ffffff" />
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{profile?.display_name || 'User'}</Text>
          <View style={styles.ratingContainer}>
            <Star size={20} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.ratingText}>
              {profile?.average_rating?.toFixed(1) || '0.0'} • {profile?.total_ratings || 0} ratings
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.messageButton} onPress={handleSendMessage}>
            <MessageCircle size={20} color="#fff" />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Bio */}
        {profile?.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}

        {/* Reliability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game plan reliability</Text>
          <View style={styles.reliabilityItem}>
            <Receipt size={20} color="#6b7280" />
            <Text style={styles.reliabilityText}>
              {calculateReliability('organizer')} as an organizer
            </Text>
          </View>
          <View style={styles.reliabilityItem}>
            <Receipt size={20} color="#6b7280" />
            <Text style={styles.reliabilityText}>
              {calculateReliability('participant')} as a participant
            </Text>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          {preferences?.bio && (
            <Text style={styles.bioText}>{preferences.bio}</Text>
          )}
          
          {preferences?.chat_style ? (
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Chat style:</Text>
              <Text style={styles.preferenceValue}>
                {getPreferenceLabel('chat_style', preferences.chat_style)}
              </Text>
            </View>
          ) : null}
          
          {preferences?.music_preference ? (
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Music:</Text>
              <Text style={styles.preferenceValue}>
                {getPreferenceLabel('music_preference', preferences.music_preference)}
              </Text>
            </View>
          ) : null}
          
          {preferences?.smoking_preference ? (
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Smoking:</Text>
              <Text style={styles.preferenceValue}>
                {getPreferenceLabel('smoking_preference', preferences.smoking_preference)}
              </Text>
            </View>
          ) : null}
          
          {preferences?.sports_preference ? (
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Sports vibe:</Text>
              <Text style={styles.preferenceValue}>
                {getPreferenceLabel('sports_preference', preferences.sports_preference)}
              </Text>
            </View>
          ) : null}
          
          {!preferences?.bio && !preferences?.chat_style && !preferences?.music_preference && !preferences?.smoking_preference && !preferences?.sports_preference && (
            <Text style={styles.noInfoText}>No info yet</Text>
          )}
        </View>

        {/* Recent Ratings */}
        {ratings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Ratings</Text>
            {ratings.map((rating: any) => (
              <View key={rating.id} style={styles.ratingCard}>
                <View style={styles.ratingHeader}>
                  <View style={styles.ratingStars}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        color="#fbbf24"
                        fill={i < rating.rating ? '#fbbf24' : 'none'}
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingDate}>
                    {new Date(rating.created_at).toLocaleDateString()}
                  </Text>
                </View>
                {rating.review && (
                  <Text style={styles.reviewText}>{rating.review}</Text>
                )}
                <Text style={styles.raterName}>
                  - {rating.rater?.display_name || 'Anonymous'}
                </Text>
              </View>
            ))}
          </View>
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
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#38bdf8',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  noInfoText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  reliabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  reliabilityText: {
    fontSize: 14,
    color: '#6b7280',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  preferenceValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  ratingCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  reviewText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  raterName: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});

