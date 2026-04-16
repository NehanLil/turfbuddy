import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const AuthScreen = () => {
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      Alert.alert(
        'Check your email',
        "We've sent you a confirmation link to complete your registration."
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      Alert.alert('Success', "You've been signed in successfully.");
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSendOTP = async () => {
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      setOtpSent(true);
      Alert.alert('OTP Sent!', 'Check your phone for the verification code.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerifyOTP = async () => {
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      Alert.alert('Success', "You've been signed in successfully.");
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo/Title */}
        <View style={styles.header}>
          <Text style={styles.logo}>TurfBuddy</Text>
          <Text style={styles.subtitle}>Join the sports community</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.description}>
            {isSignUp
              ? 'Join the TurfBuddy community'
              : 'Sign in to continue'}
          </Text>

          {/* Auth Mode Toggle */}
          <View style={styles.authModeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                authMode === 'email' && styles.modeButtonActive,
              ]}
              onPress={() => {
                setAuthMode('email');
                setOtpSent(false);
              }}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  authMode === 'email' && styles.modeButtonTextActive,
                ]}
              >
                📧 Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                authMode === 'phone' && styles.modeButtonActive,
              ]}
              onPress={() => {
                setAuthMode('phone');
                setOtpSent(false);
              }}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  authMode === 'phone' && styles.modeButtonTextActive,
                ]}
              >
                📱 Phone
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email Auth */}
          {authMode === 'email' && (
            <View style={styles.formContainer}>
              {isSignUp && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9ca3af"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder={
                    isSignUp
                      ? 'Create a password (min 6 characters)'
                      : 'Enter your password'
                  }
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={isSignUp ? handleSignUp : handleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Phone Auth */}
          {authMode === 'phone' && !otpSent && (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor="#9ca3af"
                  value={phone}
                  onChangeText={(text) => setPhone(text.replace(/\D/g, ''))}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <Text style={styles.helperText}>
                  We'll send you a 6-digit OTP
                </Text>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handlePhoneSendOTP}
                disabled={loading || phone.length !== 10}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* OTP Verification */}
          {authMode === 'phone' && otpSent && (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Enter OTP</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#9ca3af"
                  value={otp}
                  onChangeText={(text) => setOtp(text.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Text style={styles.helperText}>Sent to +91{phone}</Text>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handlePhoneVerifyOTP}
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => {
                  setOtpSent(false);
                  setOtp('');
                }}
              >
                <Text style={styles.changeButtonText}>Change Number</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Toggle Sign In / Sign Up */}
          {authMode === 'email' && (
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isSignUp
                  ? 'Already have an account?'
                  : "Don't have an account?"}{' '}
              </Text>
              <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                <Text style={styles.toggleLink}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  authModeToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  formContainer: {
    gap: 16,
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
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
  },
  submitButton: {
    backgroundColor: '#38bdf8',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  changeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  changeButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  toggleText: {
    fontSize: 14,
    color: '#6b7280',
  },
  toggleLink: {
    fontSize: 14,
    color: '#38bdf8',
    fontWeight: '500',
  },
});
