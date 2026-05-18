// Daily revision reminders via expo-notifications.
// Web: no-op (browsers can't schedule local notifs through Expo).
// Native (Expo Go on Android works fully; iOS requires a dev build for full support).
import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREF_KEY = 'nalla_nudi_reminder_v1';
const NOTIF_ID_KEY = 'nalla_nudi_reminder_notif_id';

export interface ReminderPref {
  enabled: boolean;
  hour: number;     // 0-23
  minute: number;   // 0-59
}

const DEFAULT: ReminderPref = { enabled: false, hour: 20, minute: 0 };

async function loadPref(): Promise<ReminderPref> {
  const raw = await AsyncStorage.getItem(PREF_KEY);
  return raw ? JSON.parse(raw) : DEFAULT;
}

async function savePref(p: ReminderPref) {
  await AsyncStorage.setItem(PREF_KEY, JSON.stringify(p));
}

/** Schedule a daily local notification at the given hour:minute. Cancels any prior schedule first. */
async function applySchedule(p: ReminderPref): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  // Lazy import — keeps web bundle clean
  const Notifications = await import('expo-notifications');

  // Cancel any prior schedule
  const oldId = await AsyncStorage.getItem(NOTIF_ID_KEY);
  if (oldId) {
    try { await Notifications.cancelScheduledNotificationAsync(oldId); } catch {}
    await AsyncStorage.removeItem(NOTIF_ID_KEY);
  }
  if (!p.enabled) return null;

  // Request permission idempotently
  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  if (!granted) return null;

  // Set Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Daily revision reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: undefined,
      vibrationPattern: [0, 200, 100, 200],
    });
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📚 Time to revise',
      body: 'Open Nalla-Nudi to keep your streak alive!',
      sound: false,
    },
    trigger: {
      hour: p.hour,
      minute: p.minute,
      repeats: true,
      channelId: Platform.OS === 'android' ? 'reminders' : undefined,
    } as any,
  });
  await AsyncStorage.setItem(NOTIF_ID_KEY, id);
  return id;
}

export function useReminder() {
  const [pref, setPref] = useState<ReminderPref>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [supported] = useState(Platform.OS !== 'web');
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await loadPref();
      setPref(p);
      setLoading(false);
    })();
  }, []);

  const update = useCallback(async (next: ReminderPref) => {
    setPref(next);
    await savePref(next);
    if (supported) {
      const id = await applySchedule(next);
      if (next.enabled && !id) setPermissionDenied(true);
      else setPermissionDenied(false);
    }
  }, [supported]);

  const toggle = useCallback(() => update({ ...pref, enabled: !pref.enabled }), [pref, update]);
  const setTime = useCallback((hour: number, minute: number) => update({ ...pref, hour, minute }), [pref, update]);

  return { pref, loading, supported, permissionDenied, toggle, setTime };
}
