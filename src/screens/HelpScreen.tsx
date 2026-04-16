import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mail, MessageCircle, Book, HelpCircle, ChevronRight } from 'lucide-react-native';

export const HelpScreen = () => {
  const navigation = useNavigation();

  const helpOptions = [
    {
      icon: Book,
      title: 'FAQ',
      description: 'Common questions and answers',
      action: () => {},
    },
    {
      icon: MessageCircle,
      title: 'Contact Support',
      description: 'Get help from our team',
      action: () => {
        Linking.openURL('mailto:support@turfapp.com?subject=Help Request');
      },
    },
    {
      icon: Mail,
      title: 'Email Us',
      description: 'support@turfapp.com',
      action: () => {
        Linking.openURL('mailto:support@turfapp.com');
      },
    },
  ];

  const faqItems = [
    {
      question: 'How do I create a game plan?',
      answer: 'Tap the + button at the top, fill in the details, and publish your game plan.',
    },
    {
      question: 'How do join requests work?',
      answer: 'When someone wants to join your plan, you\'ll get a notification. You can approve or reject the request.',
    },
    {
      question: 'How is payment handled?',
      answer: 'Payments are split equally among all participants. You can pay through UPI, card, or other methods.',
    },
    {
      question: 'Can I cancel a game plan?',
      answer: 'Yes, but frequent cancellations affect your reliability score. Cancel only when necessary.',
    },
    {
      question: 'How do ratings work?',
      answer: 'After completing a game, participants can rate each other based on their experience.',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Contact Options */}
        <View style={styles.section}>
          {helpOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <TouchableOpacity
                key={index}
                style={styles.optionCard}
                onPress={option.action}
              >
                <View style={styles.iconCircle}>
                  <Icon size={24} color="#38bdf8" />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {faqItems.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <View style={styles.faqQuestion}>
                <HelpCircle size={20} color="#38bdf8" />
                <Text style={styles.faqQuestionText}>{item.question}</Text>
              </View>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </View>
          ))}
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Turf App v1.0.0</Text>
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
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
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
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  faqSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 20,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  faqQuestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginLeft: 28,
  },
  versionSection: {
    padding: 16,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

