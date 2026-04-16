import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { AuthProvider } from './src/hooks/useAuth';
import { AppNavigator } from './src/navigation/AppNavigator';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error?.message}</Text>
          <Text style={styles.errorStack}>{this.state.error?.stack}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  console.log('App component rendering...');
  
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorStack: {
    fontSize: 10,
    color: '#7f1d1d',
    fontFamily: 'monospace',
  },
});
