export type MissionType = 'none' | 'math' | 'shake' | 'photo' | 'barcode' | 'memory' | 'walk' | 'object-find' | 'sing' | 'riddle';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Alarm {
  id: string;
  time: string; // HH:mm format
  enabled: boolean;
  label: string;
  repeatDays: number[]; // 0-6 (Sun-Sat)
  missionType: MissionType;
  missionDifficulty: DifficultyLevel;
  sound: string; // sound key from ALARM_SOUNDS
  soundName: string;
  vibrate: boolean;
  snoozeEnabled: boolean;
  snoozeDuration: number; // minutes
  volume: number; // 0-1
  gradualVolume: boolean;
  weatherInfo: boolean;
  createdAt: number;
  reminderEnabled: boolean; // Premium: send reminders 1hr and 10min before
  followUpEnabled: boolean; // Premium: check if still awake after dismissal
  followUpDelay: number; // minutes after dismissal (1, 3, 5, 10)
}

export interface AlarmHistory {
  id: string;
  alarmId: string;
  ringTime: number;
  dismissTime?: number;
  snoozedCount: number;
  missionCompleted: boolean;
  missionType: MissionType;
}

export interface AlarmSettings {
  defaultMissionType: MissionType;
  defaultDifficulty: DifficultyLevel;
  defaultSnooze: number;
  preventUninstall: boolean;
  volumeButtonsDisabled: boolean;
  screenFlash: boolean;
  gradualVolumeIncrease: boolean;
  alarmDuration: number; // minutes before auto-dismiss
}
