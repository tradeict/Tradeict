import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import AdMobProvider from '../components/AdMobManager';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import mobileAds from 'react-native-google-mobile-ads';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // Initialize AdMob
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('AdMob initialized successfully');
        console.log('Adapter statuses:', adapterStatuses);
      })
      .catch(error => {
        console.error('Failed to initialize AdMob:', error);
      });

    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AdMobProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="landing" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="phone-collection" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>
        </AdMobProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}