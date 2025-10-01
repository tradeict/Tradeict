import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VideoAdButtonProps {
  style?: any;
  onRewardEarned?: () => void;
}

export default function VideoAdButton({ style, onRewardEarned }: VideoAdButtonProps) {
  const handleWatchAd = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Video Ads',
        'Video ads are available on the mobile app. Download the app to watch ads and earn virtual money!',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Coming Soon!',
        'Video ads will be available soon. Stay tuned for updates!',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handleWatchAd}
    >
      <View style={styles.content}>
        <Ionicons name="play-circle" size={24} color="#fff" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Watch Video</Text>
          <Text style={styles.subtitle}>Earn $1,000</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#34C759',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
});