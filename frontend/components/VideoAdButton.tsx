import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdMob } from './AdMobManager';

interface VideoAdButtonProps {
  style?: any;
  onRewardEarned?: () => void;
}

export default function VideoAdButton({ style, onRewardEarned }: VideoAdButtonProps) {
  const { showRewardedVideo, isAdLoaded, isLoading } = useAdMob();

  const handleWatchAd = async () => {
    try {
      await showRewardedVideo();
      onRewardEarned?.();
    } catch (error: any) {
      Alert.alert(
        'Ad Not Ready',
        'Please wait for the ad to load and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style, (!isAdLoaded || isLoading) && styles.disabled]}
      onPress={handleWatchAd}
      disabled={!isAdLoaded || isLoading}
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="play-circle" size={24} color="#fff" />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isLoading ? 'Loading Ad...' : 'Watch Video'}
          </Text>
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
  disabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
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