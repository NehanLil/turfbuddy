import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const DataProtectionScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Protection</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <Text style={styles.date}>Last updated: October 28, 2024</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect information you provide directly to us:{'\n'}
            • Name and contact information{'\n'}
            • Profile information and photos{'\n'}
            • Game plan details{'\n'}
            • Messages and communications{'\n'}
            • Payment information{'\n'}
            • Location data (with your permission)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use your information to:{'\n'}
            • Provide and improve our services{'\n'}
            • Process payments and transactions{'\n'}
            • Send you notifications and updates{'\n'}
            • Ensure safety and security{'\n'}
            • Comply with legal obligations{'\n'}
            • Personalize your experience
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Information Sharing</Text>
          <Text style={styles.paragraph}>
            We share your information with:{'\n'}
            • Other users (profile information, ratings){'\n'}
            • Service providers (payment processors){'\n'}
            • Law enforcement (when required by law){'\n\n'}
            We do NOT sell your personal information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to:{'\n'}
            • Access your personal data{'\n'}
            • Correct inaccurate data{'\n'}
            • Delete your account and data{'\n'}
            • Export your data{'\n'}
            • Opt-out of marketing communications{'\n'}
            • Withdraw consent
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate security measures to protect your data:{'\n'}
            • Encrypted connections (HTTPS){'\n'}
            • Secure data storage{'\n'}
            • Regular security audits{'\n'}
            • Access controls and authentication
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain your data as long as your account is active. After account deletion,
            we may retain certain information for legal and business purposes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            Our service is not intended for users under 13 years of age. We do not
            knowingly collect information from children.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Changes to Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We may update this policy from time to time. We will notify you of significant
            changes via email or app notification.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Contact Us</Text>
          <Text style={styles.paragraph}>
            For privacy questions or data requests:{'\n'}
            Email: privacy@turfapp.com{'\n'}
            Phone: +91 9999999999
          </Text>
        </View>

        <View style={styles.gdprSection}>
          <Text style={styles.gdprTitle}>🇪🇺 GDPR Compliance</Text>
          <Text style={styles.paragraph}>
            We comply with GDPR for EU users. You have additional rights under GDPR
            including data portability and the right to be forgotten.
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
  gdprSection: {
    backgroundColor: '#e0f2fe',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  gdprTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
  },
});

