import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const TermsScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <Text style={styles.date}>Last updated: October 28, 2024</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using Turf App, you accept and agree to be bound by the terms and
            provision of this agreement.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. User Accounts</Text>
          <Text style={styles.paragraph}>
            You are responsible for maintaining the confidentiality of your account and password.
            You agree to accept responsibility for all activities that occur under your account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Game Plans</Text>
          <Text style={styles.paragraph}>
            • You are responsible for the accuracy of game plan information you create{'\n'}
            • Participants must honor commitments and arrive on time{'\n'}
            • Cancellations must be made at least 24 hours in advance{'\n'}
            • Repeated cancellations may result in account restrictions
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Payments</Text>
          <Text style={styles.paragraph}>
            • All payments are split equally among participants{'\n'}
            • Refunds are subject to the cancellation policy{'\n'}
            • Payment disputes must be resolved within 7 days{'\n'}
            • The platform facilitates payments but is not responsible for disputes
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. User Conduct</Text>
          <Text style={styles.paragraph}>
            Users must not:{'\n'}
            • Harass, abuse, or harm other users{'\n'}
            • Post false or misleading information{'\n'}
            • Use the platform for illegal activities{'\n'}
            • Spam or send unsolicited messages
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Liability</Text>
          <Text style={styles.paragraph}>
            Turf App is not liable for any injuries, damages, or losses incurred during
            game plans. Users participate at their own risk.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these terms at any time. Continued use of the
            platform constitutes acceptance of modified terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Contact</Text>
          <Text style={styles.paragraph}>
            For questions about these terms, contact us at: legal@turfapp.com
          </Text>
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
    backgroundColor: '#fff',
  },
  contentPadding: {
    padding: 20,
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
});

