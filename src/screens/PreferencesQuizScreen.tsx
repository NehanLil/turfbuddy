import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { MessageSquare, Music, Cigarette, Heart, CheckCircle } from 'lucide-react-native';

export const questions = [
  {
    id: 'chat_style',
    icon: MessageSquare,
    question: 'How chatty are you during games?',
    options: [
      { value: 'quiet', label: "I'm quiet and focused" },
      { value: 'comfortable', label: "I'm chatty when I feel comfortable" },
      { value: 'social', label: "I'm very social and talkative" },
    ],
  },
  {
    id: 'music_preference',
    icon: Music,
    question: 'Music during games?',
    options: [
      { value: 'no_music', label: "I prefer no music" },
      { value: 'mood', label: "I'll jam depending on the mood" },
      { value: 'always', label: "I love playing with music" },
    ],
  },
  {
    id: 'smoking_preference',
    icon: Cigarette,
    question: 'Smoking breaks?',
    options: [
      { value: 'no', label: "No smoking please" },
      { value: 'outside_ok', label: "Cigarette breaks outside are ok" },
      { value: 'smoker', label: "I'm a smoker" },
    ],
  },
  {
    id: 'sports_preference',
    icon: Heart,
    question: 'Your sports vibe?',
    options: [
      { value: 'casual', label: "Casual and fun" },
      { value: 'competitive', label: "Competitive but friendly" },
      { value: 'serious', label: "Serious athlete" },
    ],
  },
];

// Helper function to get label from value
export const getPreferenceLabel = (questionId: string, value: string): string => {
  const question = questions.find(q => q.id === questionId);
  if (!question) return value;
  
  const option = question.options.find(o => o.value === value);
  return option ? option.label : value;
};

export const PreferencesQuizScreen = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      console.log('Submitting quiz with answers:', answers);

      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user?.id,
            chat_style: answers.chat_style,
            music_preference: answers.music_preference,
            smoking_preference: answers.smoking_preference,
            sports_preference: answers.sports_preference,
            preferences_completed: true,
            quiz_seen: true,
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false,
          }
        );

      if (error) {
        console.error('Error saving preferences:', error);
        throw error;
      }

      console.log('Preferences saved successfully with quiz_seen = true');

      Alert.alert('Great!', 'Your preferences have been saved', [
        { text: 'OK', onPress: () => (navigation as any).replace('MainTabs') },
      ]);
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Quiz?',
      'You can always set your preferences later in your profile',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: async () => {
            try {
              // Mark quiz as seen even if skipped
              const { error } = await supabase
                .from('user_preferences')
                .upsert(
                  {
                    user_id: user?.id,
                    quiz_seen: true,
                  },
                  {
                    onConflict: 'user_id',
                    ignoreDuplicates: false,
                  }
                );
              
              if (error) {
                console.error('Error marking quiz as seen:', error);
              } else {
                console.log('Quiz marked as seen successfully');
              }
            } catch (error) {
              console.error('Error in skip handler:', error);
            }
            
            (navigation as any).replace('MainTabs');
          } 
        },
      ]
    );
  };

  const question = questions[currentQuestion];
  const Icon = question.icon;
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentQuestion + 1} of {questions.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Question */}
        <View style={styles.questionContainer}>
          <View style={styles.iconCircle}>
            <Icon size={40} color="#38bdf8" />
          </View>
          <Text style={styles.questionText}>{question.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {question.options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionCard,
                answers[question.id] === option.value && styles.optionCardSelected,
              ]}
              onPress={() => handleAnswer(question.id, option.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  answers[question.id] === option.value && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
              {answers[question.id] === option.value && (
                <CheckCircle size={24} color="#38bdf8" fill="#38bdf8" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Navigation Buttons */}
        {allAnswered && (
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Complete Setup</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
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
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  content: {
    padding: 24,
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  questionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  optionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCardSelected: {
    borderColor: '#38bdf8',
    backgroundColor: '#e0f2fe',
  },
  optionText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  optionTextSelected: {
    color: '#0369a1',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#38bdf8',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
});

