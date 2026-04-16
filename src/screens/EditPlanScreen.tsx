import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

const sports = [
  { value: 'football', label: 'Football' },
  { value: 'cricket', label: 'Cricket' },
  { value: 'badminton', label: 'Badminton' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'volleyball', label: 'Volleyball' },
  { value: 'table_tennis', label: 'Table Tennis' },
];

export const EditPlanScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { planId } = route.params as { planId: string };
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sport: '',
    title: '',
    description: '',
    location: '',
    date: '',
    time: '',
    totalCost: '',
    maxPlayers: '',
  });

  useEffect(() => {
    loadPlan();
  }, [planId]);

  const loadPlan = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        (navigation as any).navigate('Auth');
        return;
      }

      const { data, error } = await supabase
        .from('game_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) throw error;

      if (data.organizer_id !== session.user.id) {
        Alert.alert('Unauthorized', 'You can only edit your own plans');
        navigation.goBack();
        return;
      }

      setFormData({
        sport: data.sport,
        title: data.title,
        description: data.description || '',
        location: data.location,
        date: data.date,
        time: data.time,
        totalCost: data.total_cost.toString(),
        maxPlayers: data.max_players.toString(),
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('game_plans')
        .update({
          sport: formData.sport as any,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          date: formData.date,
          time: formData.time,
          total_cost: parseInt(formData.totalCost),
          max_players: parseInt(formData.maxPlayers),
        })
        .eq('id', planId);

      if (error) throw error;

      Alert.alert('Success', 'Your game plan has been updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Edit Game Plan</Text>
          <Text style={styles.headerSubtitle}>Update your game plan details</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          {/* Sport */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Sport *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sportsList}
            >
              {sports.map((sport) => (
                <TouchableOpacity
                  key={sport.value}
                  style={[
                    styles.sportChip,
                    formData.sport === sport.value && styles.sportChipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, sport: sport.value })}
                >
                  <Text
                    style={[
                      styles.sportChipText,
                      formData.sport === sport.value && styles.sportChipTextActive,
                    ]}
                  >
                    {sport.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Evening Football Match"
              placeholderTextColor="#9ca3af"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any additional details..."
              placeholderTextColor="#9ca3af"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Location */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Andheri Sports Complex"
              placeholderTextColor="#9ca3af"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
          </View>

          {/* Date */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
            />
          </View>

          {/* Time */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Time *</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM"
              placeholderTextColor="#9ca3af"
              value={formData.time}
              onChangeText={(text) => setFormData({ ...formData, time: text })}
            />
          </View>

          {/* Total Cost */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Total Cost (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2000"
              placeholderTextColor="#9ca3af"
              value={formData.totalCost}
              onChangeText={(text) => setFormData({ ...formData, totalCost: text })}
              keyboardType="numeric"
            />
          </View>

          {/* Max Players */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Maximum Players *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 10"
              placeholderTextColor="#9ca3af"
              value={formData.maxPlayers}
              onChangeText={(text) => setFormData({ ...formData, maxPlayers: text })}
              keyboardType="numeric"
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.updateButtonText}>Update Plan</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backButtonText: {
    fontSize: 24,
    color: '#111827',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sportsList: {
    paddingVertical: 4,
  },
  sportChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sportChipActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  sportChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  sportChipTextActive: {
    color: '#fff',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  updateButton: {
    backgroundColor: '#38bdf8',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});

