import { View, Text, Pressable, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Clock, Trash2, Edit2, MessageCircle, Crown, Sparkles } from 'lucide-react-native';
import { useAlarmStore } from '@/lib/alarm-store';
import { formatAlarmTime, formatRepeatDays, getNextAlarmTime, MISSION_NAMES } from '@/lib/alarm-utils';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAlarmNotifications } from '@/lib/useAlarmNotifications';
import { usePremium } from '@/lib/usePremium';

dayjs.extend(relativeTime);

export default function AlarmsScreen() {
  console.log('📱 AlarmsScreen rendering...');
  const router = useRouter();
  const alarms = useAlarmStore((s) => s.alarms);
  const toggleAlarm = useAlarmStore((s) => s.toggleAlarm);
  const deleteAlarm = useAlarmStore((s) => s.deleteAlarm);
  const loadFromStorage = useAlarmStore((s) => s.loadFromStorage);
  const { isPremium, isLoading: isPremiumLoading } = usePremium();

  console.log('📊 Alarms count:', alarms.length);
  console.log('👑 Is Premium:', isPremium, 'Loading:', isPremiumLoading);

  // Set up notification handling
  useAlarmNotifications();

  useEffect(() => {
    console.log('🔄 Loading alarms from storage...');
    loadFromStorage();
  }, []);

  const handleToggle = async (id: string, enabled: boolean) => {
    if (enabled) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    toggleAlarm(id);
  };

  const handleDelete = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    deleteAlarm(id);
  };

  const handleEdit = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/edit-alarm?id=${id}`);
  };

  const sortedAlarms = [...alarms].sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    return a.time.localeCompare(b.time);
  });

  const nextAlarm = sortedAlarms.find(a => a.enabled && getNextAlarmTime(a));
  const nextAlarmTime = nextAlarm ? getNextAlarmTime(nextAlarm) : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <LinearGradient
        colors={['#3B82F6', '#2563EB']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 250 }}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Premium Banner (if not premium) */}
        {!isPremium && !isPremiumLoading && (
          <Animated.View entering={FadeInDown.duration(400)} className="mt-16 mx-4 mb-4">
            <Pressable
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/paywall');
              }}
              className="active:scale-98"
            >
              <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#FF6B35',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <View className="mr-3">
                  <Crown size={40} color="#FFF" strokeWidth={2.5} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg mb-1">
                    Unlock Premium
                  </Text>
                  <Text className="text-white/90 text-sm">
                    7-day free trial • $4.99/month
                  </Text>
                </View>
                <Sparkles size={24} color="#FFF" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Header */}
        <View style={{ marginTop: !isPremium && !isPremiumLoading ? 0 : 60, marginHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' }}>Alarms</Text>
        </View>

        {/* Next Alarm Info */}
        {nextAlarmTime && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="mx-4 mt-4 p-6 rounded-3xl bg-white dark:bg-white/20 border border-gray-200 dark:border-white/30"
          >
            <Text className="text-gray-600 dark:text-white/80 text-sm font-medium mb-1">Next alarm</Text>
            <Text className="text-gray-900 dark:text-white text-3xl font-bold">
              {dayjs(nextAlarmTime).fromNow()}
            </Text>
            <Text className="text-gray-600 dark:text-white/60 text-sm mt-1">
              {dayjs(nextAlarmTime).format('dddd, h:mm A')}
            </Text>
          </Animated.View>
        )}

        {/* Alarms List */}
        <View className="mt-6 mx-4">
          {sortedAlarms.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Clock size={64} color="#9CA3AF" />
              <Text className="text-gray-600 dark:text-gray-400 text-lg mt-4 text-center">
                No alarms yet
              </Text>
              <Text className="text-gray-500 dark:text-gray-600 text-sm mt-2 text-center px-8">
                Tap the + button to create your first alarm
              </Text>
            </View>
          ) : (
            sortedAlarms.map((alarm, index) => (
              <Animated.View
                key={alarm.id}
                entering={FadeInDown.delay(index * 50).duration(300)}
                className="mb-3"
              >
                <View
                  className={`p-4 rounded-2xl ${
                    alarm.enabled
                      ? 'bg-white dark:bg-[#151B3D] border-2 border-orange-500'
                      : 'bg-white dark:bg-[#151B3D] border border-gray-200 dark:border-[#1E2749] opacity-60'
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text
                        className={`text-4xl font-bold ${
                          alarm.enabled
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {formatAlarmTime(alarm.time)}
                      </Text>
                      {alarm.label && (
                        <Text className="text-gray-600 dark:text-gray-400 text-base mt-1">
                          {alarm.label}
                        </Text>
                      )}
                      <Text className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                        {formatRepeatDays(alarm.repeatDays)}
                      </Text>
                      {alarm.missionType !== 'none' && (
                        <View className="flex-row items-center mt-2">
                          <View className="bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-lg">
                            <Text className="text-orange-700 dark:text-orange-400 text-xs font-medium">
                              {MISSION_NAMES[alarm.missionType]}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                    <Switch
                      value={alarm.enabled}
                      onValueChange={() => handleToggle(alarm.id, !alarm.enabled)}
                      trackColor={{ false: '#D1D5DB', true: '#F97316' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100 dark:border-[#1E2749]">
                    <Pressable
                      onPress={() => handleEdit(alarm.id)}
                      className="flex-row items-center flex-1"
                      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                    >
                      <Edit2 size={16} color="#6B7280" />
                      <Text className="text-gray-600 dark:text-gray-400 text-sm ml-2">
                        Edit
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(alarm.id)}
                      className="flex-row items-center"
                      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                    >
                      <Trash2 size={16} color="#EF4444" />
                      <Text className="text-red-500 text-sm ml-2">Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <View className="absolute bottom-8 right-6">
        {/* Voice Assistant Button */}
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/voice-assistant');
          }}
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.92 : 1 }],
            marginBottom: 12
          })}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <MessageCircle size={24} color="#FFFFFF" strokeWidth={2} />
          </LinearGradient>
        </Pressable>

        {/* Add Alarm Button */}
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/edit-alarm');
          }}
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.92 : 1 }]
          })}
        >
          <LinearGradient
            colors={['#F97316', '#EF4444']}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#F97316',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Plus size={32} color="#FFFFFF" strokeWidth={3} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
