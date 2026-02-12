import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeStore {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  loadThemeMode: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  themeMode: 'light',

  setThemeMode: async (mode: ThemeMode) => {
    set({ themeMode: mode });
    await AsyncStorage.setItem('theme_mode', mode);
  },

  loadThemeMode: async () => {
    const stored = await AsyncStorage.getItem('theme_mode');
    if (stored) {
      set({ themeMode: stored as ThemeMode });
    } else {
      // Default to light mode if no preference stored
      set({ themeMode: 'light' });
    }
  },
}));

export function useTheme() {
  const deviceColorScheme = useDeviceColorScheme();
  const themeMode = useThemeStore((s) => s.themeMode);

  const actualTheme = themeMode === 'auto' ? deviceColorScheme : themeMode;

  return {
    theme: actualTheme,
    isDark: actualTheme === 'dark',
    themeMode,
  };
}

export const colors = {
  light: {
    background: '#F8FAFC',
    secondaryBackground: '#FFFFFF',
    cardBackground: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    primary: '#EF4444',
    primaryGradientStart: '#F97316',
    primaryGradientEnd: '#EF4444',
    accent: '#10B981',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    muted: '#F1F5F9',
  },
  dark: {
    background: '#0A0E27',
    secondaryBackground: '#151B3D',
    cardBackground: '#151B3D',
    border: '#1E2749',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    primary: '#F97316',
    primaryGradientStart: '#F97316',
    primaryGradientEnd: '#EF4444',
    accent: '#10B981',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    muted: '#1E2749',
  },
};
