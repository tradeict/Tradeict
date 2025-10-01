import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // Initialize AdMob only on mobile platforms
    if (Platform.OS !== 'web') {
      try {
        import('react-native-google-mobile-ads').then((mobileAds) => {
          mobileAds.default()
            .initialize()
            .then(adapterStatuses => {
              console.log('AdMob initialized successfully');
              console.log('Adapter statuses:', adapterStatuses);
            })
            .catch(error => {
              console.error('Failed to initialize AdMob:', error);
            });
        }).catch(error => {
          console.log('AdMob not available on this platform:', error);
        });
      } catch (error) {
        console.log('AdMob initialization error:', error);
      }
    }

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
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="landing" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="phone-collection" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}