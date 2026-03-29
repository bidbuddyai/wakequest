import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/lib/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore, useTheme } from '@/lib/theme';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

export const unstable_settings = {
  initialRouteName: 'onboarding',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const loadThemeMode = useThemeStore((s) => s.loadThemeMode);
  const { theme, themeMode } = useTheme();
  const { setColorScheme } = useNativeWindColorScheme();

  useEffect(() => {
    async function initializeApp() {
      try {
        console.log('🔍 Starting app initialization...');
        
        // Load theme preference
        console.log('🎨 Loading theme...');
        await loadThemeMode();
        console.log('✅ Theme loaded');

        // Check onboarding status
        console.log('📋 Checking onboarding...');
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

        console.log('✅ App initialization complete');
        setIsReady(true);
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('❌ Error during initialization:', error);
        setInitError(error instanceof Error ? error.message : String(error));
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    initializeApp();
  }, []);

  // Update NativeWind color scheme when theme changes
  useEffect(() => {
    console.log('🎨 Setting NativeWind color scheme to:', theme);
    try {
      setColorScheme(theme as 'light' | 'dark');
    } catch (error) {
      console.error('❌ Error setting color scheme:', error);
    }
  }, [theme, setColorScheme]);

  if (!isReady) {
    return null;
  }

  if (initError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E27', padding: 20, justifyContent: 'center' }}>
        <Text style={{ color: '#FF6B35', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
          App Error
        </Text>
        <Text style={{ color: 'white', fontSize: 14 }}>
          {initError}
        </Text>
      </View>
    );
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
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <RootLayoutNav colorScheme={theme} />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
