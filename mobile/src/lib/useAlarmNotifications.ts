import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAlarmStore } from '@/lib/alarm-store';
import { scheduleAlarmNotification, cancelAlarmNotification, scheduleReminderNotifications, cancelSingleAlarmOccurrence } from '@/lib/alarm-utils';
import { useRouter } from 'expo-router';
import { usePremium } from './usePremium';
import { Alert, Platform } from 'react-native';

export function useAlarmNotifications() {
  const router = useRouter();
  const alarms = useAlarmStore((s) => s.alarms);
  const { isPremium } = usePremium();

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    // Set up notification category for reminder actions (only on native platforms)
    try {
      Notifications.setNotificationCategoryAsync('ALARM_REMINDER', [
        {
          identifier: 'CANCEL_OCCURRENCE',
          buttonTitle: 'Cancel This Alarm',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to set notification category:', error);
    }

    // Request notification permissions
    const requestPermissions = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Notification permissions not granted');
        }
      } catch (error) {
        console.error('Failed to request notification permissions:', error);
      }
    };

    requestPermissions();

    // Listen for notification responses
    let subscription: Notifications.Subscription | null = null;
    try {
      subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
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
    } catch (error) {
      console.error('Failed to add notification listener:', error);
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    // Schedule/cancel notifications when alarms change
    const updateNotifications = async () => {
      try {
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
      } catch (error) {
        console.error('Failed to update notifications:', error);
      }
    };

    updateNotifications();
  }, [alarms, isPremium]);
}
