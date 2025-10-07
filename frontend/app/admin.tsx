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

export default function SimpleAdmin() {
  console.log('Admin route rendered!'); // Debug log
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="shield-checkmark" size={80} color="#007AFF" />
        <Text style={styles.title}>🎉 ADMIN ROUTE WORKING! 🎉</Text>
        <Text style={styles.subtitle}>The web routing issue has been resolved!</Text>
        <Text style={styles.info}>URL-based navigation is now functioning correctly.</Text>
        
        <View style={styles.credentialsBox}>
          <Text style={styles.credentialsTitle}>Admin Login Credentials:</Text>
          <Text style={styles.credential}>bimal.vishvakarma@gmail.com / Admin@123</Text>
          <Text style={styles.credential}>admin@tradingsim.com / admin123</Text>
        </View>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#34C759',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  info: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  credentialsBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    alignItems: 'center',
  },
  credentialsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  credential: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});