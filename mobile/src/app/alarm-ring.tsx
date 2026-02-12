import { View, Text, Pressable, AppState, BackHandler } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { useAlarmStore } from '@/lib/alarm-store';
import { formatAlarmTime, scheduleSnooze, scheduleFollowUpNotification, ALARM_SOUNDS } from '@/lib/alarm-utils';
import { LinearGradient } from 'expo-linear-gradient';
import { MathMission } from '@/components/MathMission';
import { ShakeMission } from '@/components/ShakeMission';
import { MemoryMission } from '@/components/MemoryMission';
import { PhotoMission } from '@/components/PhotoMission';
import { BarcodeMission } from '@/components/BarcodeMission';
import { ObjectFindMission } from '@/components/ObjectFindMission';
import { SingMission } from '@/components/SingMission';
import { RiddleMission } from '@/components/RiddleMission';
import { WalkMission } from '@/components/WalkMission';
import { X, Cloud, Droplets, Wind } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import dayjs from 'dayjs';
import { getCurrentWeather, getWeatherEmoji, WeatherData } from '@/lib/weather-service';
import { speakAlarmGreeting, speakMissionInstructions, speakEncouragement } from '@/lib/tts-service';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useKeepAwake } from 'expo-keep-awake';
import { usePremium } from '@/lib/usePremium';

export default function AlarmRingScreen() {
  const router = useRouter();
  const { alarmId } = useLocalSearchParams<{ alarmId: string }>();

  const alarms = useAlarmStore((s) => s.alarms);
  const addHistory = useAlarmStore((s) => s.addHistory);
  const setActiveAlarm = useAlarmStore((s) => s.setActiveAlarm);
  const settings = useAlarmStore((s) => s.settings);
  const { isPremium } = usePremium();

  const alarm = alarms.find((a) => a.id === alarmId);
  const [snoozedCount, setSnoozedCount] = useState<number>(0);
  const [missionStarted, setMissionStarted] = useState<boolean>(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(settings.alarmDuration * 60); // in seconds
  const [currentVolume, setCurrentVolume] = useState<number>(0.3); // Start at 30% for gradual increase
  const ringTime = useRef(Date.now());

  const sound = useRef<Audio.Sound | null>(null);
  const voiceSound = useRef<Audio.Sound | null>(null);

  // Keep screen awake while alarm is ringing
  useKeepAwake();

  const handleAutoDismiss = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    sound.current?.stopAsync();

    if (alarm) {
      addHistory({
        alarmId: alarm.id,
        ringTime: ringTime.current,
        dismissTime: Date.now(),
        snoozedCount,
        missionCompleted: false,
        missionType: alarm.missionType,
      });
    }

    router.back();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-dismiss timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      // Time's up - auto dismiss
      handleAutoDismiss();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  useEffect(() => {
    setActiveAlarm(alarmId || null);
    playAlarmSound();
    loadWeatherAndSpeak();

    // Disable hardware back button if prevent uninstall is enabled
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (settings.preventUninstall && !missionStarted) {
        // Must complete mission to dismiss
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return true; // Prevent back
      }
      return false; // Allow back
    });

    // Handle volume buttons - intercept them if setting is enabled
    let volumeListener: any = null;
    if (settings.volumeButtonsDisabled) {
      // Note: React Native doesn't have direct volume button APIs
      // This is a placeholder - in production you'd use a native module
      // For now, we'll just show a message if user tries to use volume
      console.log('Volume buttons disabled for this alarm');
    }

    return () => {
      sound.current?.unloadAsync();
      voiceSound.current?.unloadAsync();
      setActiveAlarm(null);
      backHandler.remove();
    };
  }, []);

  const loadWeatherAndSpeak = async () => {
    // Load weather
    const weatherData = await getCurrentWeather();
    setWeather(weatherData);
    setLoadingWeather(false);

    // Wait a moment for alarm to play, then speak greeting
    setTimeout(async () => {
      if (alarm) {
        voiceSound.current = await speakAlarmGreeting(
          alarm.label || 'there',
          formatAlarmTime(alarm.time),
          weatherData ? { temp: weatherData.temp, description: weatherData.description } : undefined
        );
      }
    }, 2000);
  };

  const playAlarmSound = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // Get alarm sound URL
      const soundUrl = ALARM_SOUNDS[alarm?.sound as keyof typeof ALARM_SOUNDS] || ALARM_SOUNDS.classic;

      const { sound: alarmSound } = await Audio.Sound.createAsync(
        { uri: soundUrl },
        {
          isLooping: true,
          volume: settings.gradualVolumeIncrease ? currentVolume : (alarm?.volume || 0.8)
        }
      );

      sound.current = alarmSound;
      await alarmSound.playAsync();

      // Gradual volume increase
      if (settings.gradualVolumeIncrease) {
        const targetVolume = alarm?.volume || 0.8;
        const increaseInterval = setInterval(async () => {
          setCurrentVolume((prev) => {
            const newVolume = Math.min(prev + 0.1, targetVolume);
            sound.current?.setVolumeAsync(newVolume);
            if (newVolume >= targetVolume) {
              clearInterval(increaseInterval);
            }
            return newVolume;
          });
        }, 3000); // Increase every 3 seconds
      }
    } catch (error) {
      console.error('Failed to play alarm sound:', error);
      // Continue anyway - visual alarm still works
    }
  };

  const handleMissionComplete = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    sound.current?.stopAsync();

    // Speak encouragement
    voiceSound.current = await speakEncouragement();

    if (alarm) {
      addHistory({
        alarmId: alarm.id,
        ringTime: ringTime.current,
        dismissTime: Date.now(),
        snoozedCount,
        missionCompleted: true,
        missionType: alarm.missionType,
      });

      // Schedule follow-up notification if enabled and premium
      if (isPremium && alarm.followUpEnabled) {
        await scheduleFollowUpNotification(alarm.id, alarm.followUpDelay);
      }
    }

    setTimeout(() => {
      router.back();
    }, 2000);
  };

  const handleSnooze = async () => {
    if (!alarm?.snoozeEnabled) return;

    // Free users have snooze limit of 3
    const SNOOZE_LIMIT_FREE = 3;
    if (!isPremium && snoozedCount >= SNOOZE_LIMIT_FREE) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sound.current?.stopAsync();
    setSnoozedCount(snoozedCount + 1);

    // Schedule snooze notification
    await scheduleSnooze(alarm.id, alarm.snoozeDuration);

    router.back();
  };

  const handleDismiss = async () => {
    // If prevent uninstall is enabled, require mission completion
    if (settings.preventUninstall) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Show a toast or alert that mission must be completed
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    sound.current?.stopAsync();

    if (alarm) {
      addHistory({
        alarmId: alarm.id,
        ringTime: ringTime.current,
        dismissTime: Date.now(),
        snoozedCount,
        missionCompleted: false,
        missionType: alarm.missionType,
      });

      // Schedule follow-up notification if enabled and premium
      if (isPremium && alarm.followUpEnabled) {
        await scheduleFollowUpNotification(alarm.id, alarm.followUpDelay);
      }
    }

    router.back();
  };

  if (!alarm) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white text-xl">Alarm not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <LinearGradient
        colors={
          missionStarted
            ? ['#1E40AF', '#7C3AED']
            : settings.screenFlash && Math.floor(Date.now() / 500) % 2 === 0
            ? ['#DC2626', '#991B1B']
            : ['#1F2937', '#111827']
        }
        style={{ flex: 1 }}
      >
        {!missionStarted ? (
          // Alarm Info Screen
          <View className="flex-1 items-center justify-center px-6">
            {/* Timer Countdown */}
            <View className="absolute top-12 right-6 bg-white/20 backdrop-blur-lg rounded-full px-4 py-2">
              <Text className="text-white text-sm font-semibold">
                {formatTime(timeRemaining)}
              </Text>
            </View>

            <Text className="text-white/60 text-lg mb-2">Alarm</Text>
            <Text className="text-white text-7xl font-bold mb-4">
              {formatAlarmTime(alarm.time)}
            </Text>
            {alarm.label && (
              <Text className="text-white text-2xl mb-4">{alarm.label}</Text>
            )}
            <Text className="text-white/80 text-base mb-8">
              {dayjs().format('dddd, MMMM D')}
            </Text>

            {/* Weather Display */}
            {weather && (
              <Animated.View
                entering={FadeIn.delay(300)}
                className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4 mb-8 border border-white/20"
              >
                <View className="flex-row items-center">
                  <Text className="text-5xl mr-3">{getWeatherEmoji(weather.icon)}</Text>
                  <View>
                    <Text className="text-white text-3xl font-bold">
                      {weather.temp}°C
                    </Text>
                    <Text className="text-white/80 text-sm capitalize">
                      {weather.description}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center mt-3 space-x-4">
                  <View className="flex-row items-center">
                    <Droplets size={16} color="rgba(255,255,255,0.6)" />
                    <Text className="text-white/60 text-xs ml-1">
                      {weather.humidity}%
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Wind size={16} color="rgba(255,255,255,0.6)" />
                    <Text className="text-white/60 text-xs ml-1">
                      {weather.windSpeed} m/s
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {alarm.missionType !== 'none' ? (
              <Pressable
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  voiceSound.current = await speakMissionInstructions(alarm.missionType);
                  setMissionStarted(true);
                }}
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.95 : 1 }]
                })}
                className="bg-white px-12 py-5 rounded-full mb-4"
              >
                <Text className="text-gray-900 text-xl font-bold">Start Mission</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleDismiss}
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                  opacity: settings.preventUninstall ? 0.5 : 1
                })}
                className="bg-white px-12 py-5 rounded-full mb-4"
                disabled={settings.preventUninstall}
              >
                <Text className="text-gray-900 text-xl font-bold">
                  {settings.preventUninstall ? 'Complete Mission Required' : 'Dismiss'}
                </Text>
              </Pressable>
            )}

            {settings.preventUninstall && alarm.missionType === 'none' && (
              <Text className="text-yellow-300 text-sm text-center mb-4 px-6">
                Prevent Uninstall is enabled. Add a mission to this alarm to dismiss it.
              </Text>
            )}

            {settings.volumeButtonsDisabled && (
              <Text className="text-white/60 text-xs text-center mb-4">
                Volume buttons disabled
              </Text>
            )}

            {alarm.snoozeEnabled && (
              <>
                <Pressable
                  onPress={handleSnooze}
                  disabled={!isPremium && snoozedCount >= 3}
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    opacity: (!isPremium && snoozedCount >= 3) ? 0.5 : (pressed ? 0.8 : 1)
                  })}
                  className={`px-12 py-4 rounded-full ${
                    !isPremium && snoozedCount >= 3
                      ? 'bg-white/10'
                      : 'bg-white/20'
                  }`}
                >
                  <Text className="text-white text-lg font-semibold">
                    Snooze {alarm.snoozeDuration} min
                  </Text>
                </Pressable>
                {!isPremium && (
                  <Text className="text-white/60 text-xs mt-2">
                    Free: {3 - snoozedCount} snooze{(3 - snoozedCount) !== 1 ? 's' : ''} remaining
                  </Text>
                )}
              </>
            )}

            {snoozedCount > 0 && (
              <Text className="text-white/60 text-sm mt-6">
                Snoozed {snoozedCount} time{snoozedCount > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        ) : (
          // Mission Screen
          <View className="flex-1">
            {/* Emergency Dismiss (top right) - only if prevent uninstall is OFF */}
            {!settings.preventUninstall && (
              <Pressable
                onPress={handleDismiss}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.5 : 1
                })}
                className="absolute top-12 right-6 z-10 bg-white/20 p-3 rounded-full"
              >
                <X size={24} color="white" />
              </Pressable>
            )}

            {settings.preventUninstall && (
              <View className="absolute top-12 left-6 right-6 z-10 bg-red-500/90 backdrop-blur-lg rounded-2xl px-4 py-3">
                <Text className="text-white text-sm text-center font-semibold">
                  Complete mission to dismiss - Prevent Uninstall is ON
                </Text>
              </View>
            )}

            {alarm.missionType === 'math' && (
              <MathMission difficulty={alarm.missionDifficulty} onComplete={handleMissionComplete} />
            )}
            {alarm.missionType === 'shake' && (
              <ShakeMission difficulty={alarm.missionDifficulty} onComplete={handleMissionComplete} />
            )}
            {alarm.missionType === 'memory' && (
              <MemoryMission difficulty={alarm.missionDifficulty} onComplete={handleMissionComplete} />
            )}
            {alarm.missionType === 'photo' && <PhotoMission onComplete={handleMissionComplete} />}
            {alarm.missionType === 'barcode' && <BarcodeMission onComplete={handleMissionComplete} />}
            {alarm.missionType === 'object-find' && <ObjectFindMission onComplete={handleMissionComplete} />}
            {alarm.missionType === 'sing' && <SingMission onComplete={handleMissionComplete} />}
            {alarm.missionType === 'riddle' && (
              <RiddleMission difficulty={alarm.missionDifficulty} onComplete={handleMissionComplete} />
            )}
            {alarm.missionType === 'walk' && (
              <WalkMission difficulty={alarm.missionDifficulty} onComplete={handleMissionComplete} />
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}
