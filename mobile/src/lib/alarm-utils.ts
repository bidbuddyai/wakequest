import * as Notifications from 'expo-notifications';
import dayjs from 'dayjs';
import { Alarm } from './types';

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MISSION_NAMES = {
  none: 'None',
  math: 'Math Problems',
  shake: 'Shake Phone',
  photo: 'Photo Verification',
  barcode: 'Scan Barcode',
  memory: 'Memory Game',
  walk: 'Walk Steps',
  'object-find': '🤖 Find Object (AI)',
  'sing': '🎤 Sing Song (AI)',
  'riddle': '🧩 Solve Riddle (AI)',
};

export const SOUND_OPTIONS = [
  // Loud & Annoying (for heavy sleepers)
  { label: '🔊 Loud Siren', value: 'siren', premium: true },
  { label: '🚨 Emergency Alert', value: 'emergency', premium: true },
  { label: '📢 Air Horn', value: 'airhorn', premium: true },
  { label: '🚒 Fire Alarm', value: 'fire', premium: true },
  { label: '📯 Foghorn', value: 'foghorn', premium: true },
  { label: '🔊 Buzzer', value: 'buzzer', premium: false }, // Free - basic annoying sound
  { label: '📣 Alarm Klaxon', value: 'klaxon', premium: true },
  // Medium Intensity
  { label: '⏰ Classic Beeping', value: 'classic', premium: false }, // Free - basic sound
  { label: '🔔 Aggressive Bell', value: 'bell', premium: false }, // Free - basic sound
  { label: '🎺 Trumpet Blast', value: 'trumpet', premium: true },
  { label: '🐓 Rooster Crowing', value: 'rooster', premium: true },
  { label: '⚠️ Warning Beep', value: 'warning', premium: false }, // Free - basic sound
  // Gentle & Pleasant
  { label: '🌅 Gentle Chimes', value: 'chimes', premium: true },
  { label: '🎵 Morning Melody', value: 'melody', premium: true },
  { label: '🌊 Ocean Waves', value: 'ocean', premium: true },
  { label: '🐦 Birds Chirping', value: 'birds', premium: true },
  { label: '🎼 Piano Sunrise', value: 'piano', premium: true },
  { label: '☀️ Peaceful Wake', value: 'peaceful', premium: true },
];

export function formatAlarmTime(time: string): string {
  return dayjs(`2000-01-01 ${time}`).format('h:mm A');
}

export function getNextAlarmTime(alarm: Alarm): Date | null {
  if (!alarm.enabled) return null;

  const now = dayjs();
  const [hours, minutes] = alarm.time.split(':').map(Number);

  if (alarm.repeatDays.length === 0) {
    // One-time alarm
    let alarmTime = now.hour(hours).minute(minutes).second(0);
    if (alarmTime.isBefore(now)) {
      alarmTime = alarmTime.add(1, 'day');
    }
    return alarmTime.toDate();
  }

  // Repeating alarm - find next occurrence
  for (let i = 0; i < 7; i++) {
    const checkDate = now.add(i, 'day');
    const dayOfWeek = checkDate.day();

    if (alarm.repeatDays.includes(dayOfWeek)) {
      let alarmTime = checkDate.hour(hours).minute(minutes).second(0);

      if (alarmTime.isAfter(now)) {
        return alarmTime.toDate();
      }
    }
  }

  return null;
}

export function formatRepeatDays(days: number[]): string {
  if (days.length === 0) return 'One time';
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && !days.includes(0) && !days.includes(6)) {
    return 'Weekdays';
  }
  if (days.length === 2 && days.includes(0) && days.includes(6)) {
    return 'Weekends';
  }

  return days
    .sort()
    .map(d => DAYS_OF_WEEK[d])
    .join(', ');
}

export async function scheduleAlarmNotification(alarm: Alarm): Promise<string | null> {
  const nextTime = getNextAlarmTime(alarm);
  if (!nextTime) return null;

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.label || 'Alarm',
        body: 'Time to wake up!',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { alarmId: alarm.id, type: 'alarm' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextTime,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return null;
  }
}

export async function scheduleReminderNotifications(alarm: Alarm, isPremium: boolean): Promise<void> {
  if (!isPremium) return;

  const nextTime = getNextAlarmTime(alarm);
  if (!nextTime) return;

  const nextTimeDayjs = dayjs(nextTime);
  const oneHourBefore = nextTimeDayjs.subtract(1, 'hour').toDate();
  const tenMinutesBefore = nextTimeDayjs.subtract(10, 'minute').toDate();

  // Only schedule if reminder time is in the future
  const now = dayjs();

  try {
    // 1 hour before notification
    if (dayjs(oneHourBefore).isAfter(now)) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Alarm in 1 hour',
          body: `${alarm.label || 'Alarm'} will ring at ${formatAlarmTime(alarm.time)}. Tap to cancel this occurrence.`,
          sound: false,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          data: {
            alarmId: alarm.id,
            type: 'reminder',
            reminderType: '1hour',
            alarmTime: nextTime.toISOString(),
          },
          categoryIdentifier: 'ALARM_REMINDER',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: oneHourBefore,
        },
      });
    }

    // 10 minutes before notification
    if (dayjs(tenMinutesBefore).isAfter(now)) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Alarm in 10 minutes',
          body: `${alarm.label || 'Alarm'} will ring soon. Tap to cancel this occurrence.`,
          sound: false,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          data: {
            alarmId: alarm.id,
            type: 'reminder',
            reminderType: '10min',
            alarmTime: nextTime.toISOString(),
          },
          categoryIdentifier: 'ALARM_REMINDER',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: tenMinutesBefore,
        },
      });
    }
  } catch (error) {
    console.error('Failed to schedule reminder notifications:', error);
  }
}

export async function cancelAlarmNotification(alarm: Alarm): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const alarmNotifications = scheduled.filter(
      (n) => n.content.data?.alarmId === alarm.id
    );

    for (const notification of alarmNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
}

export async function cancelSingleAlarmOccurrence(alarmId: string, alarmTime: string): Promise<void> {
  try {
    // Cancel only the specific scheduled notification for this alarm time
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const targetTime = new Date(alarmTime);

    for (const notification of scheduled) {
      const data = notification.content.data;

      // Cancel main alarm notification and reminders for this specific time
      if (data?.alarmId === alarmId && data?.type === 'alarm') {
        const trigger = notification.trigger as any;
        if (trigger?.type === 'date' && trigger?.value) {
          const notifTime = new Date(trigger.value);
          // Check if this notification is for the same time (within 1 minute)
          if (Math.abs(notifTime.getTime() - targetTime.getTime()) < 60000) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          }
        }
      }

      // Also cancel reminder notifications for this time
      if (data?.alarmId === alarmId && data?.type === 'reminder' && data?.alarmTime === alarmTime) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error('Failed to cancel single alarm occurrence:', error);
  }
}

export async function scheduleFollowUpNotification(alarmId: string, delay: number): Promise<string | null> {
  try {
    const followUpTime = dayjs().add(delay, 'minute').toDate();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Are you still awake?',
        body: 'Tap to confirm you\'re up. You\'ll need to type a challenge phrase.',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          alarmId,
          type: 'followup',
        },
        categoryIdentifier: 'FOLLOW_UP',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: followUpTime,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to schedule follow-up notification:', error);
    return null;
  }
}

export function generateMathProblem(difficulty: 'easy' | 'medium' | 'hard'): { question: string; answer: number } {
  let num1: number, num2: number, operation: string;

  if (difficulty === 'easy') {
    num1 = Math.floor(Math.random() * 20) + 1;
    num2 = Math.floor(Math.random() * 20) + 1;
    operation = Math.random() > 0.5 ? '+' : '-';
  } else if (difficulty === 'medium') {
    num1 = Math.floor(Math.random() * 50) + 10;
    num2 = Math.floor(Math.random() * 50) + 10;
    const ops = ['+', '-', '*'];
    operation = ops[Math.floor(Math.random() * ops.length)];
  } else {
    num1 = Math.floor(Math.random() * 100) + 20;
    num2 = Math.floor(Math.random() * 100) + 20;
    const ops = ['+', '-', '*'];
    operation = ops[Math.floor(Math.random() * ops.length)];
  }

  let answer: number;
  let question: string;

  switch (operation) {
    case '+':
      answer = num1 + num2;
      question = `${num1} + ${num2}`;
      break;
    case '-':
      if (num2 > num1) [num1, num2] = [num2, num1];
      answer = num1 - num2;
      question = `${num1} - ${num2}`;
      break;
    case '*':
      if (difficulty === 'medium') {
        num1 = Math.floor(Math.random() * 12) + 2;
        num2 = Math.floor(Math.random() * 12) + 2;
      } else {
        num1 = Math.floor(Math.random() * 20) + 5;
        num2 = Math.floor(Math.random() * 20) + 5;
      }
      answer = num1 * num2;
      question = `${num1} × ${num2}`;
      break;
    default:
      answer = num1 + num2;
      question = `${num1} + ${num2}`;
  }

  return { question, answer };
}

export function getShakeThreshold(difficulty: 'easy' | 'medium' | 'hard'): number {
  switch (difficulty) {
    case 'easy':
      return 20;
    case 'medium':
      return 50;
    case 'hard':
      return 100;
    default:
      return 50;
  }
}

export function getMemorySequenceLength(difficulty: 'easy' | 'medium' | 'hard'): number {
  switch (difficulty) {
    case 'easy':
      return 4;
    case 'medium':
      return 6;
    case 'hard':
      return 8;
    default:
      return 6;
  }
}

export async function scheduleSnooze(alarmId: string, snoozeDuration: number): Promise<string | null> {
  try {
    const snoozeTime = dayjs().add(snoozeDuration, 'minute').toDate();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Snoozed Alarm',
        body: 'Time to wake up!',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { alarmId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: snoozeTime,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to schedule snooze:', error);
    return null;
  }
}

export const ALARM_SOUNDS = {
  // Loud & Annoying
  siren: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  emergency: 'https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3',
  airhorn: 'https://assets.mixkit.co/active_storage/sfx/1645/1645-preview.mp3',
  fire: 'https://assets.mixkit.co/active_storage/sfx/3124/3124-preview.mp3',
  foghorn: 'https://assets.mixkit.co/active_storage/sfx/1647/1647-preview.mp3',
  buzzer: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3',
  klaxon: 'https://assets.mixkit.co/active_storage/sfx/1646/1646-preview.mp3',
  // Medium Intensity
  classic: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  bell: 'https://assets.mixkit.co/active_storage/sfx/1473/1473-preview.mp3',
  trumpet: 'https://assets.mixkit.co/active_storage/sfx/1648/1648-preview.mp3',
  rooster: 'https://assets.mixkit.co/active_storage/sfx/1684/1684-preview.mp3',
  warning: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  // Gentle & Pleasant
  chimes: 'https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3',
  melody: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  ocean: 'https://assets.mixkit.co/active_storage/sfx/2487/2487-preview.mp3',
  birds: 'https://assets.mixkit.co/active_storage/sfx/500/500-preview.mp3',
  piano: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
  peaceful: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3',
};
