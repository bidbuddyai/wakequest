import { View, Text, ScrollView } from 'react-native';
import { useAlarmStore } from '@/lib/alarm-store';
import { useEffect } from 'react';
import { TrendingUp, Award, Zap, Clock } from 'lucide-react-native';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';

export default function StatisticsScreen() {
  const history = useAlarmStore((s) => s.history);
  const loadFromStorage = useAlarmStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, []);

  // Calculate statistics
  const totalAlarms = history.length;
  const completedMissions = history.filter((h) => h.missionCompleted).length;
  const totalSnoozes = history.reduce((sum, h) => sum + h.snoozedCount, 0);
  const avgSnooze = totalAlarms > 0 ? (totalSnoozes / totalAlarms).toFixed(1) : 0;
  const successRate = totalAlarms > 0 ? Math.round((completedMissions / totalAlarms) * 100) : 0;

  // This week's data
  const weekStart = dayjs().startOf('week');
  const thisWeekHistory = history.filter((h) => dayjs(h.ringTime).isAfter(weekStart));
  const thisWeekCompleted = thisWeekHistory.filter((h) => h.missionCompleted).length;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180 }}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Overview Cards */}
        <View className="mt-6 mx-4">
          <Text className="text-white text-2xl font-bold mb-4">Your Progress</Text>

          <View className="flex-row flex-wrap -mx-2">
            {/* Success Rate */}
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                <View className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-full items-center justify-center mb-3">
                  <Award size={24} color="#10B981" />
                </View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">Success Rate</Text>
                <Text className="text-gray-900 dark:text-white text-3xl font-bold mt-1">
                  {successRate}%
                </Text>
              </View>
            </View>

            {/* Total Alarms */}
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                <View className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full items-center justify-center mb-3">
                  <Clock size={24} color="#3B82F6" />
                </View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">Total Alarms</Text>
                <Text className="text-gray-900 dark:text-white text-3xl font-bold mt-1">
                  {totalAlarms}
                </Text>
              </View>
            </View>

            {/* This Week */}
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                <View className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-full items-center justify-center mb-3">
                  <TrendingUp size={24} color="#A855F7" />
                </View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">This Week</Text>
                <Text className="text-gray-900 dark:text-white text-3xl font-bold mt-1">
                  {thisWeekCompleted}
                </Text>
              </View>
            </View>

            {/* Avg Snooze */}
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                <View className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-full items-center justify-center mb-3">
                  <Zap size={24} color="#F97316" />
                </View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">Avg Snooze</Text>
                <Text className="text-gray-900 dark:text-white text-3xl font-bold mt-1">
                  {avgSnooze}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent History */}
        <View className="mx-4 mt-6">
          <Text className="text-gray-900 dark:text-white text-xl font-bold mb-4">
            Recent Activity
          </Text>

          {history.length === 0 ? (
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-8 items-center">
              <Clock size={48} color="#9CA3AF" />
              <Text className="text-gray-400 dark:text-gray-500 text-base mt-4 text-center">
                No alarm history yet
              </Text>
              <Text className="text-gray-400 dark:text-gray-600 text-sm mt-2 text-center">
                Your alarm activity will appear here
              </Text>
            </View>
          ) : (
            <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
              {history.slice(0, 10).map((item, index) => (
                <View
                  key={item.id}
                  className={`p-4 ${
                    index !== history.slice(0, 10).length - 1
                      ? 'border-b border-gray-100 dark:border-gray-700'
                      : ''
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-gray-900 dark:text-white text-base font-medium">
                        {dayjs(item.ringTime).format('MMM D, h:mm A')}
                      </Text>
                      {item.missionType !== 'none' && (
                        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                          Mission: {item.missionType}
                        </Text>
                      )}
                      {item.snoozedCount > 0 && (
                        <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                          Snoozed {item.snoozedCount} time{item.snoozedCount > 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                    <View
                      className={`px-3 py-1 rounded-full ${
                        item.missionCompleted
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          item.missionCompleted
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-red-700 dark:text-red-400'
                        }`}
                      >
                        {item.missionCompleted ? 'Completed' : 'Dismissed'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
