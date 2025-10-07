import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function SimpleAdmin() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Simple Admin Route Working!');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="shield-checkmark" size={80} color="#007AFF" />
        <Text style={styles.title}>{message}</Text>
        <Text style={styles.subtitle}>If you can see this, the admin route is working correctly.</Text>
        <Text style={styles.info}>Original admin panel will be restored once routing is fixed.</Text>
        
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => setMessage('Admin route is responding to interactions!')}
        >
          <Text style={styles.testButtonText}>Test Interaction</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});