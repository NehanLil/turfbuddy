import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Bell, Mail, MessageSquare, Megaphone } from 'lucide-react-native';

export const CommunicationPreferencesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    marketing_emails: true,
  });
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('email_notifications, push_notifications, sms_notifications, marketing_emails')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (data) {
        setPreferences({
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          sms_notifications: data.sms_notifications ?? false,
          marketing_emails: data.marketing_emails ?? true,
        });
      }
    } catch (error: any) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user?.id,
            ...preferences,
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false,
          }
        );

      if (error) throw error;

      Alert.alert('Success', 'Preferences saved successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Choose how you want to be notified about game plans, messages, and updates.
        </Text>

        {/* Email Notifications */}
        <View style={styles.preferenceCard}>
          <View style={styles.preferenceHeader}>
            <View style={styles.iconCircle}>
              <Mail size={24} color="#38bdf8" />
            </View>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>Email Notifications</Text>
              <Text style={styles.preferenceDescription}>
                Get notified about game plan updates, join requests, and messages
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.email_notifications}
            onValueChange={() => handleToggle('email_notifications')}
            trackColor={{ false: '#e5e7eb', true: '#38bdf8' }}
            thumbColor="#fff"
          />
        </View>

        {/* Push Notifications */}
        <View style={styles.preferenceCard}>
          <View style={styles.preferenceHeader}>
            <View style={styles.iconCircle}>
              <Bell size={24} color="#38bdf8" />
            </View>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>Push Notifications</Text>
              <Text style={styles.preferenceDescription}>
                Instant notifications on your device
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.push_notifications}
            onValueChange={() => handleToggle('push_notifications')}
            trackColor={{ false: '#e5e7eb', true: '#38bdf8' }}
            thumbColor="#fff"
          />
        </View>

        {/* SMS Notifications */}
        <View style={styles.preferenceCard}>
          <View style={styles.preferenceHeader}>
            <View style={styles.iconCircle}>
              <MessageSquare size={24} color="#38bdf8" />
            </View>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>SMS Notifications</Text>
              <Text style={styles.preferenceDescription}>
                Text messages for important updates
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.sms_notifications}
            onValueChange={() => handleToggle('sms_notifications')}
            trackColor={{ false: '#e5e7eb', true: '#38bdf8' }}
            thumbColor="#fff"
          />
        </View>

        {/* Marketing Emails */}
        <View style={styles.preferenceCard}>
          <View style={styles.preferenceHeader}>
            <View style={styles.iconCircle}>
              <Megaphone size={24} color="#38bdf8" />
            </View>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>Marketing Emails</Text>
              <Text style={styles.preferenceDescription}>
                Tips, special offers, and news about Turf
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.marketing_emails}
            onValueChange={() => handleToggle('marketing_emails')}
            trackColor={{ false: '#e5e7eb', true: '#38bdf8' }}
            thumbColor="#fff"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>
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
  description: {
    fontSize: 14,
    color: '#6b7280',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  preferenceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#38bdf8',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 16,
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

