import { View, Text, Pressable, ScrollView, Switch, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAlarmStore } from '@/lib/alarm-store';
import { DAYS_OF_WEEK, MISSION_NAMES, SOUND_OPTIONS } from '@/lib/alarm-utils';
import { MissionType, DifficultyLevel } from '@/lib/types';
import { X, Check, Crown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { usePremium } from '@/lib/usePremium';

export default function EditAlarmScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const alarms = useAlarmStore((s) => s.alarms);
  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const updateAlarm = useAlarmStore((s) => s.updateAlarm);
  const settings = useAlarmStore((s) => s.settings);
  const { isPremium } = usePremium();

  const existingAlarm = id ? alarms.find((a) => a.id === id) : null;

  const [time, setTime] = useState<Date>(
    existingAlarm
      ? new Date(`2000-01-01 ${existingAlarm.time}`)
      : new Date()
  );
  const [label, setLabel] = useState<string>(existingAlarm?.label || '');
  const [repeatDays, setRepeatDays] = useState<number[]>(existingAlarm?.repeatDays || []);
  const [missionType, setMissionType] = useState<MissionType>(
    existingAlarm?.missionType || settings.defaultMissionType
  );
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    existingAlarm?.missionDifficulty || settings.defaultDifficulty
  );
  const [soundName, setSoundName] = useState<string>(existingAlarm?.soundName || 'classic');
  const [vibrate, setVibrate] = useState<boolean>(existingAlarm?.vibrate ?? true);
  const [snoozeEnabled, setSnoozeEnabled] = useState<boolean>(
    existingAlarm?.snoozeEnabled ?? true
  );
  const [snoozeDuration, setSnoozeDuration] = useState<number>(
    existingAlarm?.snoozeDuration || settings.defaultSnooze
  );
  const [volume, setVolume] = useState<number>(existingAlarm?.volume || 0.8);
  const [gradualVolume, setGradualVolume] = useState<boolean>(
    existingAlarm?.gradualVolume ?? false
  );
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(
    existingAlarm?.reminderEnabled ?? false
  );
  const [followUpEnabled, setFollowUpEnabled] = useState<boolean>(
    existingAlarm?.followUpEnabled ?? false
  );
  const [followUpDelay, setFollowUpDelay] = useState<number>(
    existingAlarm?.followUpDelay ?? 3
  );

  const toggleDay = async (day: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (repeatDays.includes(day)) {
      setRepeatDays(repeatDays.filter((d) => d !== day));
    } else {
      setRepeatDays([...repeatDays, day].sort());
    }
  };

  const handleSave = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    const alarmData = {
      time: timeString,
      enabled: true,
      label,
      repeatDays,
      missionType,
      missionDifficulty: difficulty,
      sound: soundName,
      soundName,
      vibrate,
      snoozeEnabled,
      snoozeDuration,
      volume,
      gradualVolume,
      weatherInfo: false,
      reminderEnabled,
      followUpEnabled,
      followUpDelay,
    };

    if (id) {
      updateAlarm(id, alarmData);
    } else {
      addAlarm(alarmData);
    }

    router.back();
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: id ? 'Edit Alarm' : 'New Alarm',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="active:opacity-50">
              <X size={24} color="#6B7280" />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleSave} className="active:opacity-50">
              <Check size={24} color="#3B82F6" />
            </Pressable>
          ),
        }}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Time Picker */}
        <View className="bg-white dark:bg-gray-800 py-6 items-center border-b border-gray-200 dark:border-gray-700">
          <DateTimePicker
            value={time}
            mode="time"
            display="spinner"
            onChange={(event, selectedTime) => {
              if (selectedTime) setTime(selectedTime);
            }}
            textColor="#111827"
            style={{ height: 120 }}
          />
        </View>

        {/* Label */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mt-4 mx-4 rounded-2xl">
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">Label</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Alarm name (optional)"
            placeholderTextColor="#9CA3AF"
            className="text-gray-900 dark:text-white text-base"
          />
        </View>

        {/* Repeat Days */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mt-4 mx-4 rounded-2xl">
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-3">Repeat</Text>
          <View className="flex-row justify-between">
            {DAYS_OF_WEEK.map((day, index) => (
              <Pressable
                key={index}
                onPress={() => toggleDay(index)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.95 : 1 }]
                })}
                className={`w-11 h-11 rounded-full items-center justify-center ${
                  repeatDays.includes(index)
                    ? 'bg-blue-500'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    repeatDays.includes(index)
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {day[0]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Mission Type */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mt-4 mx-4 rounded-2xl">
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-3">
            Mission to Dismiss
          </Text>
          <View className="flex-row flex-wrap -mx-1">
            {(Object.keys(MISSION_NAMES) as MissionType[]).map((type) => {
              const isLocked = type !== 'none' && !isPremium;

              return (
                <Pressable
                  key={type}
                  onPress={async () => {
                    if (isLocked) {
                      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      router.push('/paywall');
                      return;
                    }
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMissionType(type);
                  }}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }]
                  })}
                  className={`m-1 px-4 py-2 rounded-full ${
                    missionType === type
                      ? 'bg-blue-500'
                      : isLocked
                      ? 'bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <View className="flex-row items-center">
                    <Text
                      className={`text-sm ${
                        missionType === type
                          ? 'text-white font-medium'
                          : isLocked
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {MISSION_NAMES[type]}
                    </Text>
                    {isLocked && (
                      <Crown size={14} color="#EA580C" style={{ marginLeft: 4 }} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Difficulty */}
        {missionType !== 'none' && (
          <View className="bg-white dark:bg-gray-800 px-4 py-4 mt-4 mx-4 rounded-2xl">
            <Text className="text-gray-600 dark:text-gray-400 text-sm mb-3">Difficulty</Text>
            <View className="flex-row space-x-2">
              {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => (
                <Pressable
                  key={level}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDifficulty(level);
                  }}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }]
                  })}
                  className={`flex-1 py-3 rounded-xl ${
                    difficulty === level
                      ? 'bg-blue-500'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <Text
                    className={`text-center text-sm capitalize ${
                      difficulty === level
                        ? 'text-white font-medium'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Sound */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mt-4 mx-4 rounded-2xl">
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-3">Alarm Sound</Text>
          <View className="space-y-2">
            {SOUND_OPTIONS.filter(sound => isPremium || !sound.premium).map((sound) => (
              <Pressable
                key={sound.value}
                onPress={async () => {
                  if (sound.premium && !isPremium) {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    router.push('/paywall');
                    return;
                  }
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSoundName(sound.value);
                }}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                })}
                className={`py-3 px-4 rounded-xl mb-2 ${
                  soundName === sound.value
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-700'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-base ${
                      soundName === sound.value
                        ? 'text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {sound.label}
                  </Text>
                  {sound.premium && !isPremium && (
                    <Crown size={14} color="#FF6B35" />
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Options */}
        <View className="bg-white dark:bg-gray-800 px-4 py-2 mt-4 mx-4 rounded-2xl">
          <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <Text className="text-gray-900 dark:text-white text-base">Vibrate</Text>
            <Switch
              value={vibrate}
              onValueChange={async (value) => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setVibrate(value);
              }}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <Text className="text-gray-900 dark:text-white text-base">Snooze</Text>
            <Switch
              value={snoozeEnabled}
              onValueChange={async (value) => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSnoozeEnabled(value);
              }}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {isPremium && (
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-gray-900 dark:text-white text-base">Gradual Volume</Text>
              <Switch
                value={gradualVolume}
                onValueChange={async (value) => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setGradualVolume(value);
                }}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            </View>
          )}
        </View>

        {/* Premium Features */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mt-4 mx-4 rounded-2xl">
          <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className={`text-base ${isPremium ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                  Reminder Notifications
                </Text>
                {!isPremium && (
                  <Crown size={14} color="#FF6B35" style={{ marginLeft: 6 }} />
                )}
              </View>
              <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                Get alerts 1hr & 10min before {!isPremium && '(Premium)'}
              </Text>
            </View>
            <Switch
              value={reminderEnabled && isPremium}
              onValueChange={async (value) => {
                if (!isPremium) {
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  router.push('/paywall');
                } else {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setReminderEnabled(value);
                }
              }}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
              disabled={!isPremium}
            />
          </View>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className={`text-base ${isPremium ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                  Follow-Up Check
                </Text>
                {!isPremium && (
                  <Crown size={14} color="#FF6B35" style={{ marginLeft: 6 }} />
                )}
              </View>
              <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                Verify you're still awake after dismissal {!isPremium && '(Premium)'}
              </Text>
            </View>
            <Switch
              value={followUpEnabled && isPremium}
              onValueChange={async (value) => {
                if (!isPremium) {
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  router.push('/paywall');
                } else {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFollowUpEnabled(value);
                }
              }}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
              disabled={!isPremium}
            />
          </View>

          {followUpEnabled && isPremium && (
            <View className="py-3 border-t border-gray-100 dark:border-gray-700">
              <Text className="text-gray-600 dark:text-gray-400 text-sm mb-3">Follow-Up Delay</Text>
              <View className="flex-row flex-wrap gap-2">
                {[1, 3, 5, 10].map((delay) => (
                  <Pressable
                    key={delay}
                    onPress={async () => {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFollowUpDelay(delay);
                    }}
                    className={`px-4 py-2 rounded-lg ${
                      followUpDelay === delay
                        ? 'bg-blue-500'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        followUpDelay === delay
                          ? 'text-white font-medium'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {delay} min
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
