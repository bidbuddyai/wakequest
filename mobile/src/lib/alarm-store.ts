import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm, AlarmHistory, AlarmSettings } from './types';
import * as Notifications from 'expo-notifications';

interface AlarmStore {
  alarms: Alarm[];
  history: AlarmHistory[];
  settings: AlarmSettings;
  activeAlarmId: string | null;

  // Alarm actions
  addAlarm: (alarm: Omit<Alarm, 'id' | 'createdAt'>) => void;
  updateAlarm: (id: string, updates: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;

  // Active alarm
  setActiveAlarm: (id: string | null) => void;
  addHistory: (history: Omit<AlarmHistory, 'id'>) => void;

  // Settings
  updateSettings: (settings: Partial<AlarmSettings>) => void;

  // Persistence
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const defaultSettings: AlarmSettings = {
  defaultMissionType: 'none',
  defaultDifficulty: 'medium',
  defaultSnooze: 5,
  preventUninstall: false,
  volumeButtonsDisabled: false,
  screenFlash: true,
  gradualVolumeIncrease: false,
  alarmDuration: 10,
};

export const useAlarmStore = create<AlarmStore>((set, get) => ({
  alarms: [],
  history: [],
  settings: defaultSettings,
  activeAlarmId: null,

  addAlarm: (alarm) => {
    const newAlarm: Alarm = {
      ...alarm,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    set((state) => ({ alarms: [...state.alarms, newAlarm] }));
    get().saveToStorage();
  },

  updateAlarm: (id, updates) => {
    set((state) => ({
      alarms: state.alarms.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
    get().saveToStorage();
  },

  deleteAlarm: (id) => {
    set((state) => ({
      alarms: state.alarms.filter((a) => a.id !== id),
    }));
    get().saveToStorage();
  },

  toggleAlarm: (id) => {
    set((state) => ({
      alarms: state.alarms.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled } : a
      ),
    }));
    get().saveToStorage();
  },

  setActiveAlarm: (id) => {
    set({ activeAlarmId: id });
  },

  addHistory: (history) => {
    const newHistory: AlarmHistory = {
      ...history,
      id: Date.now().toString(),
    };
    set((state) => ({
      history: [newHistory, ...state.history].slice(0, 100), // Keep last 100
    }));
    get().saveToStorage();
  },

  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));
    get().saveToStorage();
  },

  loadFromStorage: async () => {
    try {
      const [alarmsData, historyData, settingsData] = await Promise.all([
        AsyncStorage.getItem('alarms'),
        AsyncStorage.getItem('alarm_history'),
        AsyncStorage.getItem('alarm_settings'),
      ]);

      set({
        alarms: alarmsData ? JSON.parse(alarmsData) : [],
        history: historyData ? JSON.parse(historyData) : [],
        settings: settingsData ? JSON.parse(settingsData) : defaultSettings,
      });
    } catch (error) {
      console.error('Failed to load alarm data:', error);
    }
  },

  saveToStorage: async () => {
    try {
      const { alarms, history, settings } = get();
      await Promise.all([
        AsyncStorage.setItem('alarms', JSON.stringify(alarms)),
        AsyncStorage.setItem('alarm_history', JSON.stringify(history)),
        AsyncStorage.setItem('alarm_settings', JSON.stringify(settings)),
      ]);
    } catch (error) {
      console.error('Failed to save alarm data:', error);
    }
  },
}));

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
