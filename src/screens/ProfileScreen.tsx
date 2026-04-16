import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { getPreferenceLabel } from './PreferencesQuizScreen';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  CreditCard, 
  HelpCircle,
  FileText,
  Shield,
  LogOut,
  XCircle,
  ChevronRight,
  Star,
  Users,
  Bell,
  Wallet,
  Receipt,
  Car,
  Plus,
  CheckCircle,
  Edit,
  MessageSquare,
  Music,
  Cigarette,
  Heart
} from 'lucide-react-native';

export const ProfileScreen = () => {
  const [activeTab, setActiveTab] = useState<'about' | 'account'>('about');
  const [profile, setProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadProfile();
      loadPreferences();
    }
  }, [user]);

  useEffect(() => {
    // Reload profile and preferences when screen is focused
    const unsubscribe = (navigation as any).addListener('focus', () => {
      if (user) {
        loadProfile();
        loadPreferences();
      }
    });
    return unsubscribe;
  }, [navigation, user]);

  const loadProfile = async () => {
    try {
      if (!user) return;

      // Try to load profile by user_id first, then by id
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // If not found by user_id, try by id
      if (!data && !error) {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Profile doesn't exist, create one
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            user_id: user.id,
            display_name: user.email?.split('@')[0] || 'User',
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          // If creation fails, set default profile
          setProfile({
            id: user.id,
            user_id: user.id,
            display_name: user.email?.split('@')[0] || 'User',
          });
        } else {
          setProfile(newProfile);
        }
      } else {
        setProfile(data);
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      // Set default profile if load fails
      setProfile({
        id: user?.id,
        user_id: user?.id,
        display_name: user?.email?.split('@')[0] || 'User',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
      }

      setPreferences(data);
    } catch (error: any) {
      console.error('Error loading preferences:', error);
    }
  };

  // Only 4 fields: profile pic, display name, phone number, mini bio
  // Only 4 fields: profile pic, display name, phone number, mini bio
  const profileTasks = [
    {
      key: 'avatar_url',
      label: 'Add a profile picture',
      done: !!profile?.avatar_url,
    },
    {
      key: 'display_name',
      label: 'Set your display name',
      done: !!profile?.display_name,
    },
    {
      key: 'phone',
      label: 'Add your phone number',
      done: !!profile?.phone,
    },
    {
      key: 'bio',
      label: 'Write a mini bio',
      done: !!profile?.bio || !!preferences?.bio,
    },
  ];

  const completed = profileTasks.filter(t => t.done).length;
  const total = profileTasks.length;
  const incompleteTasks = profileTasks.filter(t => !t.done);
  const completion = { completed, total, percentage: (completed / total) * 100 };

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

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            (navigation as any).navigate('Auth');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Close Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete user account
              const { error } = await supabase.auth.admin.deleteUser(user?.id || '');
              if (error) throw error;
              
              Alert.alert('Success', 'Account deleted successfully');
              (navigation as any).navigate('Auth');
            } catch (error: any) {
              Alert.alert('Error', 'Please contact support to delete your account');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  // Use new completion logic

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'about' && styles.tabActive]}
          onPress={() => setActiveTab('about')}
        >
          <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
            About you
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'account' && styles.tabActive]}
          onPress={() => setActiveTab('account')}
        >
          <Text style={[styles.tabText, activeTab === 'account' && styles.tabTextActive]}>
            Account
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'about' ? (
          // ABOUT YOU TAB
          <>
            {/* Profile Header */}
            <TouchableOpacity 
              style={styles.profileHeader}
              onPress={() => (navigation as any).navigate('EditProfile')}
            >
              <View style={styles.avatarContainer}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={40} color="#94a3b8" />
                  </View>
                )}
                {(profile?.phone_verified || profile?.email_verified) && (
                  <View style={styles.verifiedBadge}>
                    <CheckCircle size={24} color="#38bdf8" fill="#ffffff" />
                  </View>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {profile?.display_name || 'User'}
                </Text>
                <Text style={styles.profileLevel}>
                  ⭐ {profile?.average_rating?.toFixed(1) || '0.0'} • {profile?.total_ratings || 0} ratings
                </Text>
              </View>
              <ChevronRight size={24} color="#94a3b8" />
            </TouchableOpacity>

            {/* Show completion card only if not all tasks are done */}
            {completion.completed < completion.total ? (
              <View style={styles.completionCard}>
                <Text style={styles.completionTitle}>Complete your profile</Text>
                <Text style={styles.completionSubtitle}>
                  {completion.completed} out of {completion.total} complete
                </Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${completion.percentage}%` }]} />
                </View>
                {/* Show only incomplete tasks */}
                <View style={{ marginTop: 12, marginBottom: 8 }}>
                  {incompleteTasks.map(task => (
                    <TouchableOpacity
                      key={task.key}
                      style={styles.aboutItem}
                      onPress={() => (navigation as any).navigate('EditProfile')}
                    >
                      <Plus size={20} color="#38bdf8" />
                      <Text style={styles.aboutItemTextBlue}>{task.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => (navigation as any).navigate('EditProfile')}
                >
                  <Text style={styles.editButtonText}>Edit profile</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.completionCard}
                onPress={() => (navigation as any).navigate('EditProfile')}
              >
                <Text style={styles.editButtonText}>Edit profile</Text>
              </TouchableOpacity>
            )}

            {/* Verified Profile */}
            {(profile?.phone_verified || profile?.email_verified) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>You have a Verified Profile</Text>
                
                {profile?.email_verified && (
                  <View style={styles.verificationItem}>
                    <CheckCircle size={20} color="#38bdf8" />
                    <Text style={styles.verificationText}>{user?.email || 'Email'}</Text>
                  </View>
                )}
                
                {profile?.phone_verified && (
                  <View style={styles.verificationItem}>
                    <CheckCircle size={20} color="#38bdf8" />
                    <Text style={styles.verificationText}>
                      {profile?.phone || 'Phone'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Reliability */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your game plan reliability</Text>
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

            {/* About You */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About you</Text>
              
              {!preferences?.bio ? (
                <TouchableOpacity 
                  style={styles.aboutItem}
                  onPress={() => (navigation as any).navigate('EditProfile')}
                >
                  <Plus size={20} color="#38bdf8" />
                  <Text style={styles.aboutItemTextBlue}>Add a mini bio</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.aboutItem}>
                  <Text style={styles.aboutItemText}>{preferences.bio}</Text>
                </View>
              )}
              
              {preferences?.chat_style ? (
                <View style={styles.aboutItem}>
                  <MessageSquare size={20} color="#6b7280" />
                  <Text style={styles.aboutItemText}>
                    {getPreferenceLabel('chat_style', preferences.chat_style)}
                  </Text>
                </View>
              ) : null}
              
              {preferences?.music_preference ? (
                <View style={styles.aboutItem}>
                  <Music size={20} color="#6b7280" />
                  <Text style={styles.aboutItemText}>
                    {getPreferenceLabel('music_preference', preferences.music_preference)}
                  </Text>
                </View>
              ) : null}

              {preferences?.smoking_preference ? (
                <View style={styles.aboutItem}>
                  <Cigarette size={20} color="#6b7280" />
                  <Text style={styles.aboutItemText}>
                    {getPreferenceLabel('smoking_preference', preferences.smoking_preference)}
                  </Text>
                </View>
              ) : null}
              
              {preferences?.sports_preference ? (
                <View style={styles.aboutItem}>
                  <Heart size={20} color="#6b7280" />
                  <Text style={styles.aboutItemText}>
                    {getPreferenceLabel('sports_preference', preferences.sports_preference)}
                  </Text>
                </View>
              ) : null}
              
              {!preferences?.chat_style && !preferences?.music_preference && !preferences?.smoking_preference && !preferences?.sports_preference && (
                <TouchableOpacity 
                  style={styles.aboutItem}
                  onPress={() => (navigation as any).navigate('PreferencesQuiz')}
                >
                  <Plus size={20} color="#38bdf8" />
                  <Text style={styles.aboutItemTextBlue}>Set your preferences</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.editPreferencesButton}
                onPress={() => (navigation as any).navigate('PreferencesQuiz')}
              >
                <Text style={styles.editPreferencesText}>Edit game preferences</Text>
              </TouchableOpacity>
            </View>

          </>
        ) : (
          // ACCOUNT TAB
          <>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => (navigation as any).navigate('MyPlans')}
            >
              <Receipt size={24} color="#6b7280" />
              <Text style={styles.settingText}>My Plans</Text>
              <ChevronRight size={24} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => (navigation as any).navigate('Ratings')}
            >
              <Star size={24} color="#6b7280" />
              <Text style={styles.settingText}>Ratings</Text>
              <ChevronRight size={24} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => (navigation as any).navigate('SavedPlayers')}
            >
              <Users size={24} color="#6b7280" />
              <Text style={styles.settingText}>Saved players</Text>
              <ChevronRight size={24} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => (navigation as any).navigate('CommunicationPreferences')}
            >
              <Bell size={24} color="#6b7280" />
              <Text style={styles.settingText}>Communication preferences</Text>
              <ChevronRight size={24} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => (navigation as any).navigate('PasswordChange')}
            >
              <Lock size={24} color="#6b7280" />
              <Text style={styles.settingText}>Password</Text>
              <ChevronRight size={24} color="#94a3b8" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => (navigation as any).navigate('Help')}
            >
              <HelpCircle size={24} color="#6b7280" />
              <Text style={styles.settingText}>Help</Text>
              <ChevronRight size={24} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => (navigation as any).navigate('Terms')}
            >
              <FileText size={24} color="#6b7280" />
              <Text style={styles.settingText}>Terms and Conditions</Text>
              <ChevronRight size={24} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => (navigation as any).navigate('DataProtection')}
            >
              <Shield size={24} color="#6b7280" />
              <Text style={styles.settingText}>Data protection</Text>
              <ChevronRight size={24} color="#94a3b8" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
              <LogOut size={24} color="#38bdf8" />
              <Text style={[styles.settingText, styles.settingTextBlue]}>Log out</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
              <XCircle size={24} color="#38bdf8" />
              <Text style={[styles.settingText, styles.settingTextBlue]}>
                Close my account
              </Text>
            </TouchableOpacity>
          </>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0f5257',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#0f5257',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  profileLevel: {
    fontSize: 14,
    color: '#6b7280',
  },
  completionCard: {
    backgroundColor: '#e0f2fe',
    padding: 16,
    marginBottom: 8,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f5257',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 13,
    color: '#0f5257',
    marginBottom: 12,
  },
  completionProgress: {
    marginBottom: 16,
  },
  completionText: {
    fontSize: 12,
    color: '#0f5257',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#bae6fd',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  addButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  addButtonText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    paddingVertical: 10,
    marginBottom: 8,
  },
  editButtonText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '500',
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
    marginBottom: 16,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verificationText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 12,
  },
  reliabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reliabilityText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 12,
    flex: 1,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aboutItemText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  aboutItemTextBlue: {
    fontSize: 14,
    color: '#38bdf8',
    marginLeft: 12,
    flex: 1,
  },
  editPreferencesButton: {
    marginTop: 8,
  },
  editPreferencesText: {
    fontSize: 14,
    color: '#38bdf8',
    fontWeight: '500',
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addVehicleText: {
    fontSize: 14,
    color: '#38bdf8',
    marginLeft: 12,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#0f5257',
    marginLeft: 16,
  },
  settingTextBlue: {
    color: '#38bdf8',
  },
  divider: {
    height: 8,
    backgroundColor: '#f5f5f5',
  },
});
