import React, { useState, useEffect, createContext, useContext } from 'react';
import { Alert } from 'react-native';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import axios from 'axios';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface AdMobContextType {
  showRewardedVideo: () => Promise<void>;
  isAdLoaded: boolean;
  isLoading: boolean;
}

const AdMobContext = createContext<AdMobContextType>({
  showRewardedVideo: async () => {},
  isAdLoaded: false,
  isLoading: false,
});

export const useAdMob = () => useContext(AdMobContext);

interface AdMobProviderProps {
  children: React.ReactNode;
}

export function AdMobProvider({ children }: AdMobProviderProps) {
  const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    initializeAds();
    return () => {
      if (rewardedAd) {
        // Clean up listeners
        rewardedAd.removeAllListeners();
      }
    };
  }, []);

  const initializeAds = () => {
    const ad = RewardedAd.createForAdRequest(TestIds.REWARDED, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = ad.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log('Rewarded ad loaded');
        setIsAdLoaded(true);
        setIsLoading(false);
      }
    );

    const unsubscribeEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        console.log('User earned reward:', reward);
        handleRewardEarned();
      }
    );

    const unsubscribeClosed = ad.addAdEventListener(
      RewardedAdEventType.CLOSED,
      () => {
        console.log('Rewarded ad closed');
        setIsAdLoaded(false);
        loadNewAd();
      }
    );

    const unsubscribeFailed = ad.addAdEventListener(
      RewardedAdEventType.FAILED_TO_LOAD,
      (error) => {
        console.error('Rewarded ad failed to load:', error);
        setIsLoading(false);
        setIsAdLoaded(false);
      }
    );

    // Store unsubscribe functions for cleanup
    (ad as any).unsubscribeFunctions = [
      unsubscribeLoaded,
      unsubscribeEarned,
      unsubscribeClosed,
      unsubscribeFailed,
    ];

    setRewardedAd(ad);
    loadAd(ad);
  };

  const loadAd = (ad: RewardedAd) => {
    setIsLoading(true);
    setIsAdLoaded(false);
    ad.load();
  };

  const loadNewAd = () => {
    if (rewardedAd) {
      setTimeout(() => {
        loadAd(rewardedAd);
      }, 1000); // Wait 1 second before loading new ad
    }
  };

  const showRewardedVideo = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isAdLoaded || !rewardedAd || !user) {
        reject(new Error('Ad not ready or user not logged in'));
        return;
      }

      try {
        rewardedAd.show();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleRewardEarned = async () => {
    if (!user) return;

    try {
      const transactionId = `${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await axios.post(`${API_URL}/api/rewards/video-ad`, {
        user_id: user.id,
        ad_unit_id: TestIds.REWARDED,
        transaction_id: transactionId,
      });

      if (response.data) {
        await refreshUser(); // Refresh user balance
        Alert.alert(
          'Reward Earned! 🎉',
          `You earned $${response.data.reward_amount} for watching the video!`,
          [{ text: 'Awesome!', style: 'default' }]
        );
      }
    } catch (error: any) {
      console.error('Error claiming video reward:', error);
      Alert.alert(
        'Reward Error',
        error.response?.data?.detail || 'Failed to claim reward. Please try again.'
      );
    }
  };

  return (
    <AdMobContext.Provider
      value={{
        showRewardedVideo,
        isAdLoaded,
        isLoading,
      }}
    >
      {children}
    </AdMobContext.Provider>
  );
}

export default AdMobProvider;