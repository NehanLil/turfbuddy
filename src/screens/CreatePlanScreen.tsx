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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { CustomDateTimePicker, LocationPicker } from '../components';

const sports = [
  { value: 'football', label: 'Football' },
  { value: 'cricket', label: 'Cricket' },
  { value: 'badminton', label: 'Badminton' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'volleyball', label: 'Volleyball' },
  { value: 'table_tennis', label: 'Table Tennis' },
];

export const CreatePlanScreen = ({ route }: any) => {
  // Accept groupId from navigation params if present
  const groupId = route?.params?.groupId || null;
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sport: '',
    title: '',
    description: '',
    location: '',
    lat: '',
    lng: '',
    city: '',
    date: '',
    time: '',
    totalCost: '',
    maxPlayers: '',
  });
  const navigation = useNavigation();
  const totalSteps = 3;

  useEffect(() => {
    checkAuth();
    if (groupId) {
      checkAdmin();
    }
  }, [groupId]);

  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !groupId) return;
    const { data: memberRows } = await supabase
      .from('group_members')
      .select('user_id, is_admin')
      .eq('group_id', groupId)
      .eq('user_id', session.user.id)
      .maybeSingle();
    setIsAdmin(!!memberRows?.is_admin);
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      (navigation as any).navigate('Auth');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.sport && formData.title);
      case 2:
        return !!(formData.location && formData.date && formData.time);
      case 3:
        return !!(formData.totalCost && formData.maxPlayers);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    } else {
      Alert.alert('Missing Information', 'Please fill in all required fields');
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (groupId && !isAdmin) {
      Alert.alert('Permission Denied', 'Only group admins can create plans for this group.');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        (navigation as any).navigate('Auth');
        return;
      }

      // Insert game plan, link to group if present
      const { data: planData, error } = await supabase.from('game_plans').insert({
        organizer_id: session.user.id,
        sport: formData.sport as any,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
        city: formData.city || null,
        country_code: 'IN',
        date: formData.date,
        time: formData.time,
        total_cost: parseInt(formData.totalCost),
        max_players: parseInt(formData.maxPlayers),
        group_id: groupId || null,
        public: groupId ? false : true,
      }).select().single();

      if (error) throw error;

      // Add organizer as a participant
      if (planData?.id) {
        await supabase.from('plan_participants').insert({
          plan_id: planData.id,
          user_id: session.user.id,
          has_paid: false,
        });
      }

      // If group, invite all members and post message in group chat
      if (groupId && planData?.id) {
        // Get all group members
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId);
        // Add all members as plan_participants except organizer
        if (members) {
          for (const m of members) {
            if (m.user_id !== session.user.id) {
              await supabase.from('plan_participants').insert({
                plan_id: planData.id,
                user_id: m.user_id,
              });
            }
          }
        }
        // Post message in group chat (not in a new group, but in the existing group)
        await supabase.from('group_messages').insert({
          group_id: groupId,
          user_id: session.user.id,
          content: `New game plan created: ${formData.title} on ${formData.date} at ${formData.location}. All group members are invited!`,
        });
      }

      Alert.alert(
        'Success!',
        groupId
          ? 'Game plan created for group. All members invited and notified.'
          : 'Your game plan has been created and is now visible to other players.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            {/* Sport Selection */}
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
                    onPress={() => handleInputChange('sport', sport.value)}
                  >
                    <Text
                      style={[
                        styles.sportChipText,
                        formData.sport === sport.value &&
                          styles.sportChipTextActive,
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
                onChangeText={(text) => handleInputChange('title', text)}
              />
            </View>

            {/* Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any additional details..."
                placeholderTextColor="#9ca3af"
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            {/* Location */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Andheri Sports Complex"
                placeholderTextColor="#9ca3af"
                value={formData.location}
                onChangeText={(text) => handleInputChange('location', text)}
              />
            </View>

            {/* Location Picker */}
            <LocationPicker
              value={
                formData.lat && formData.lng
                  ? { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) }
                  : null
              }
              onPick={({ lat, lng, city }) => {
                setFormData((prev) => ({
                  ...prev,
                  lat: String(lat),
                  lng: String(lng),
                  city: city || prev.city,
                }));
              }}
            />

            {/* Date & Time Picker */}
            <CustomDateTimePicker
              date={formData.date}
              time={formData.time}
              onDateChange={(date) => handleInputChange('date', date)}
              onTimeChange={(time) => handleInputChange('time', time)}
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            {/* Total Cost */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Total Cost (₹) *</Text>
              <View style={styles.inputWithIcon}>
                <Text style={styles.inputIconText}>₹</Text>
                <TextInput
                  style={[styles.input, styles.inputWithPadding]}
                  placeholder="e.g., 2000"
                  placeholderTextColor="#9ca3af"
                  value={formData.totalCost}
                  onChangeText={(text) => handleInputChange('totalCost', text)}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.helperText}>Total venue/equipment cost</Text>
            </View>

            {/* Max Players */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Maximum Players *</Text>
              <View style={styles.inputWithIcon}>
                <Text style={styles.inputIconText}>👥</Text>
                <TextInput
                  style={[styles.input, styles.inputWithPadding]}
                  placeholder="e.g., 10"
                  placeholderTextColor="#9ca3af"
                  value={formData.maxPlayers}
                  onChangeText={(text) => handleInputChange('maxPlayers', text)}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.helperText}>Including yourself</Text>
            </View>

            {/* Cost Preview */}
            {formData.totalCost && formData.maxPlayers && (
              <View style={styles.costPreview}>
                <Text style={styles.costPreviewLabel}>Cost per person</Text>
                <Text style={styles.costPreviewAmount}>
                  ₹
                  {Math.ceil(
                    parseInt(formData.totalCost) / parseInt(formData.maxPlayers)
                  )}
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Basic Info';
      case 2:
        return 'Location & Time';
      case 3:
        return 'Players & Cost';
      default:
        return '';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return 'What are you playing?';
      case 2:
        return 'Where and when?';
      case 3:
        return "How many players and what's the cost?";
      default:
        return '';
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Create Game Plan</Text>
            <Text style={styles.headerSubtitle}>
              Step {currentStep} of {totalSteps}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(currentStep / totalSteps) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.progressSteps}>
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                style={[
                  styles.progressStep,
                  step === currentStep && styles.progressStepActive,
                  step < currentStep && styles.progressStepCompleted,
                ]}
              >
                {step < currentStep ? (
                  <Text style={styles.progressStepTextCompleted}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.progressStepText,
                      step === currentStep && styles.progressStepTextActive,
                    ]}
                  >
                    {step}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.stepTitle}>{getStepTitle()}</Text>
          <Text style={styles.stepDescription}>{getStepDescription()}</Text>

          {renderStepContent()}

          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.backNavButton}
                onPress={handleBack}
              >
                <Text style={styles.backNavButtonText}>← Back</Text>
              </TouchableOpacity>
            )}
            {currentStep < totalSteps ? (
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  currentStep === 1 && styles.nextButtonFull,
                ]}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>Next →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  currentStep === 1 && styles.nextButtonFull,
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Game Plan</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
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
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: {
    backgroundColor: '#38bdf8',
  },
  progressStepCompleted: {
    backgroundColor: '#10b981',
  },
  progressStepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  progressStepTextActive: {
    color: '#fff',
  },
  progressStepTextCompleted: {
    fontSize: 14,
    color: '#fff',
  },
  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 20,
  },
  stepContent: {
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
  helperText: {
    fontSize: 11,
    color: '#6b7280',
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
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputIconText: {
    fontSize: 16,
    paddingLeft: 12,
    color: '#6b7280',
  },
  inputWithPadding: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  costPreview: {
    padding: 16,
    backgroundColor: '#38bdf820',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38bdf830',
    alignItems: 'center',
  },
  costPreviewLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  costPreviewAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backNavButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  backNavButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#38bdf8',
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
