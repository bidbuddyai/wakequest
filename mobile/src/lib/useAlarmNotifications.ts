import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAlarmStore } from '@/lib/alarm-store';
import { scheduleAlarmNotification, cancelAlarmNotification, scheduleReminderNotifications, cancelSingleAlarmOccurrence } from '@/lib/alarm-utils';
import { useRouter } from 'expo-router';
import { usePremium } from './usePremium';
import { Alert, Platform } from 'react-native';

// Set up notification category for reminder actions (only on native platforms)
if (Platform.OS !== 'web') {
  Notifications.setNotificationCategoryAsync('ALARM_REMINDER', [
    {
      identifier: 'CANCEL_OCCURRENCE',
      buttonTitle: 'Cancel This Alarm',
      options: {
        opensAppToForeground: false,
      },
    },
  ]);
}

export function useAlarmNotifications() {
  const router = useRouter();
  const alarms = useAlarmStore((s) => s.alarms);
  const settings = useAlarmStore((s) => s.settings);
  const { isPremium } = usePremium();

  useEffect(() => {
    // Request notification permissions
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
      }
    };

    requestPermissions();

    // Listen for notification responses
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data;
      const alarmId = data?.alarmId as string | undefined;
      const actionIdentifier = response.actionIdentifier;

      // Handle reminder notification with cancel action
      if (data?.type === 'reminder' && actionIdentifier === 'CANCEL_OCCURRENCE') {
        const alarmTime = data?.alarmTime as string | undefined;
        if (alarmId && typeof alarmId === 'string' && alarmTime && typeof alarmTime === 'string') {
          await cancelSingleAlarmOccurrence(alarmId, alarmTime);
          Alert.alert(
            'Alarm Cancelled',
            'This alarm occurrence has been cancelled. Recurring alarms will continue as scheduled.',
            [{ text: 'OK' }]
          );
        }
        return;
      }

      // Handle reminder tap (open app to show alarm details)
      if (data?.type === 'reminder') {
        return; // Just dismiss the reminder
      }

      // Handle follow-up check notification
      if (data?.type === 'followup' && alarmId && typeof alarmId === 'string') {
        router.push(`/follow-up-check?alarmId=${alarmId}`);
        return;
      }

      // Handle main alarm notification
      if (alarmId && typeof alarmId === 'string' && data?.type === 'alarm') {
        router.push(`/alarm-ring?alarmId=${alarmId}`);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Schedule/cancel notifications when alarms change
    const updateNotifications = async () => {
      for (const alarm of alarms) {
        await cancelAlarmNotification(alarm);
        if (alarm.enabled) {
          await scheduleAlarmNotification(alarm);

          // Schedule reminder notifications if premium and enabled for this alarm
          if (isPremium && alarm.reminderEnabled) {
            await scheduleReminderNotifications(alarm, true);
          }
        }
      }
    };

    updateNotifications();
  }, [alarms, isPremium]);
}
