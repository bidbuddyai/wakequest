import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/lib/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore, useTheme } from '@/lib/theme';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'onboarding',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const loadThemeMode = useThemeStore((s) => s.loadThemeMode);
  const { theme, themeMode } = useTheme();
  const { setColorScheme } = useNativeWindColorScheme();

  useEffect(() => {
    async function checkOnboarding() {
      try {
        console.log('🔍 Checking onboarding status...');
        // Load theme preference
        await loadThemeMode();
        console.log('✅ Theme loaded');

        const completed = await AsyncStorage.getItem('onboarding_completed');
        console.log('📋 Onboarding completed:', completed);
        console.log('📍 Current segments:', segments);

        // If onboarding not completed and not on onboarding screen, redirect
        if (!completed && segments[0] !== 'onboarding') {
          console.log('🔄 Redirecting to onboarding...');
          router.replace('/onboarding');
        } else if (completed && segments[0] === 'onboarding') {
          console.log('🔄 Redirecting to tabs...');
          router.replace('/(tabs)');
        }

        console.log('✅ Setting ready to true');
        setIsReady(true);
        await SplashScreen.hideAsync();
        console.log('✅ Splash screen hidden');
      } catch (error) {
        console.error('❌ Error checking onboarding:', error);
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    checkOnboarding();
  }, []);

  // Update NativeWind color scheme when theme changes
  useEffect(() => {
    console.log('🎨 Setting NativeWind color scheme to:', theme);
    setColorScheme(theme as 'light' | 'dark');
  }, [theme, setColorScheme]);

  if (!isReady) {
    return null;
  }

  console.log('🎨 Current theme:', theme, 'ThemeMode:', themeMode);

  return (
    <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-alarm" options={{ presentation: 'card' }} />
        <Stack.Screen name="alarm-ring" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="voice-assistant" options={{ presentation: 'card' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="follow-up-check" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}



export default function RootLayout() {
  const { theme } = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
          <RootLayoutNav colorScheme={theme} />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}