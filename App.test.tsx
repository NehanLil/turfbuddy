import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TestNavigator } from './src/navigation/AppNavigator.test';

export default function App() {
  return (
    <SafeAreaProvider>
      <TestNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

