import React, { useState, useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import {
  AuthScreen,
  HomeScreen,
  DashboardScreen,
  ExploreScreen,
  CreatePlanScreen,
  PlanDetailsScreen,
  EditPlanScreen,
  MyPlansScreen,
  ProfileScreen,
  MessagesScreen,
  ChatViewScreen,
  NotificationsScreen,
  EditProfileScreen,
  RatingsScreen,
  SavedPlayersScreen,
  PasswordChangeScreen,
  HelpScreen,
  TermsScreen,
  DataProtectionScreen,
  PreferencesQuizScreen,
  CommunicationPreferencesScreen,
  UserProfileScreen,
  DMChatScreen,
  GroupInfoScreen,
} from '../screens';
import { ActivityIndicator, View, Text, TouchableOpacity, useWindowDimensions, StyleSheet } from 'react-native';
import { Home, Search, PlusSquare, MessageCircle, User, Bell } from 'lucide-react-native';
import PagerView from 'react-native-pager-view';
import { supabase } from '../lib/supabase';

const Stack = createNativeStackNavigator();

function MainTabs({ navigation }: any) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const layout = useWindowDimensions();
  const { user } = useAuth();

  const tabs = [
    { key: 'home', component: DashboardScreen, icon: Home, label: 'Home' },
    { key: 'explore', component: ExploreScreen, icon: Search, label: 'Explore' },
    { key: 'messages', component: MessagesScreen, icon: MessageCircle, label: 'Messages' },
    { key: 'profile', component: ProfileScreen, icon: User, label: 'Profile' },
  ];

  // Load notification count
  useEffect(() => {
    if (user) {
      loadNotificationCount();
      
      // 🔥 Real-time notifications
      const channel = supabase
        .channel('notifications-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'join_requests',
          },
          () => {
            console.log('🔔 Notification update detected');
            loadNotificationCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadNotificationCount = async () => {
    if (!user) return;

    try {
      // Count pending join requests to user's plans
      const { data: myPlans } = await supabase
        .from('game_plans')
        .select('id')
        .eq('organizer_id', user.id);

      const planIds = (myPlans || []).map((p) => p.id);

      let count = 0;

      if (planIds.length > 0) {
        const { count: requestsCount } = await supabase
          .from('join_requests')
          .select('*', { count: 'exact', head: true })
          .in('plan_id', planIds)
          .eq('status', 'pending');

        count += requestsCount || 0;
      }

      // Count approved/rejected requests for user's sent requests
      const { count: statusCount } = await supabase
        .from('join_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['approved', 'rejected'])
        .eq('viewed', false);

      count += statusCount || 0;

      setNotificationCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleTabPress = (index: number) => {
    if (index === activeIndex) return;
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
  };

  const handlePageSelected = (e: any) => {
    setActiveIndex(e.nativeEvent.position);
  };

  const handleCreatePress = () => {
    navigation.navigate('CreatePlan');
  };

  const handleNotificationsPress = () => {
    navigation.navigate('Notifications');
  };

  return (
    <View style={styles.container}>
      {/* Top Header with Create and Notifications */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleCreatePress}
        >
          <PlusSquare size={28} color="#0f172a" strokeWidth={2} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {tabs[activeIndex]?.label || 'Turf'}
        </Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleNotificationsPress}
        >
          <Bell size={28} color="#0f172a" strokeWidth={2} />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Swipeable Content */}
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {tabs.map((tab, index) => (
          <View key={tab.key} style={styles.page}>
            <tab.component />
          </View>
        ))}
      </PagerView>

      {/* Bottom Tab Bar (without + button) */}
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeIndex === index;
          
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => handleTabPress(index)}
            >
              <Icon
                size={28}
                color={isActive ? '#0f172a' : '#94a3b8'}
                strokeWidth={isActive ? 3 : 1.5}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerButton: {
    padding: 8,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: 8,
    paddingTop: 8,
    height: 56,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
});

export function AppNavigator() {
  const { user, loading } = useAuth();
  const [preferencesCompleted, setPreferencesCompleted] = useState<boolean>(false);
  const [checkingPreferences, setCheckingPreferences] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (user) {
      setCheckingPreferences(true);
      setIsReady(false);
      checkPreferencesCompleted();
    } else {
      setCheckingPreferences(false);
      setPreferencesCompleted(false);
      setIsReady(true);
    }
  }, [user]);

  const checkPreferencesCompleted = async () => {
    try {
      console.log('Starting preferences check...');
      
      // Wait a bit to ensure database is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('quiz_seen')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking preferences:', error);
      }

      // If data exists and quiz_seen is true, then completed = true
      // If data doesn't exist or quiz_seen is false/null, then completed = false
      const hasSeenQuiz = data?.quiz_seen === true;
      
      console.log('Quiz check result:', { data, hasSeenQuiz, userId: user?.id });
      
      setPreferencesCompleted(hasSeenQuiz);
      
      // Wait a bit more before showing the app
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setIsReady(true);
    } catch (error) {
      console.error('Error checking preferences:', error);
      setPreferencesCompleted(false);
      setIsReady(true);
    } finally {
      setCheckingPreferences(false);
    }
  };

  if (loading || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ marginTop: 12, color: '#6b7280' }}>Loading...</Text>
      </View>
    );
  }

  console.log('🚀 Rendering Navigator:', { 
    user: !!user, 
    preferencesCompleted, 
    shouldShowQuiz: !preferencesCompleted,
    isReady
  });

  return (
    <NavigationContainer key={`nav-${preferencesCompleted}`}>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
      >
        {user ? (
          <>
            {/* First screen order matters - the first one is the default */}
            {preferencesCompleted ? (
              <>
                <Stack.Screen 
                  name="MainTabs" 
                  component={MainTabs}
                  options={{ animationEnabled: false }}
                />
                <Stack.Screen name="PreferencesQuiz" component={PreferencesQuizScreen} />
              </>
            ) : (
              <>
                <Stack.Screen 
                  name="PreferencesQuiz" 
                  component={PreferencesQuizScreen}
                  options={{ animationEnabled: false }}
                />
                <Stack.Screen name="MainTabs" component={MainTabs} />
              </>
            )}
        <Stack.Screen name="CreatePlan" component={CreatePlanScreen} />
        <Stack.Screen name="GroupInfo" component={GroupInfoScreen} />
            <Stack.Screen name="Explore" component={ExploreScreen} />
            <Stack.Screen name="PlanDetails" component={PlanDetailsScreen} />
            <Stack.Screen name="EditPlan" component={EditPlanScreen} />
            <Stack.Screen name="MyPlans" component={MyPlansScreen} />
            <Stack.Screen name="ChatView" component={ChatViewScreen} />
            <Stack.Screen name="DMChat" component={DMChatScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Ratings" component={RatingsScreen} />
            <Stack.Screen name="SavedPlayers" component={SavedPlayersScreen} />
            <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
            <Stack.Screen name="CommunicationPreferences" component={CommunicationPreferencesScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="DataProtection" component={DataProtectionScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

