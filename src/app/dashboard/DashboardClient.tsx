"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { getMe, logout } from '@/lib/auth';
import { getDevices, locateDevice, screamDevice, stopScreamDevice, startSearchMode, stopSearchMode, markStolen, markFound, deleteDevice, togglePowerSaver } from '@/lib/api/devices';
import { subscribeToDeviceState } from '@/lib/firebase';
import { useTerminalStore } from '@/store/useTerminalStore';
import { Shield, Zap, User, Smartphone, Search, AlertTriangle, ShieldCheck,
  Volume2, VolumeX, Battery, Wifi, Trash2, Menu, X, Settings, Map, Activity,
  Eye, EyeOff, LogOut, Radar, MapPin, Crosshair,
  BluetoothSearching, CheckCircle,
  Terminal, ShieldAlert, Copy, Check, Bell
} from 'lucide-react';
import dynamic from 'next/dynamic';
import SettingsModal from '@/components/modals/SettingsModal';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

const DeviceMap = dynamic(() => import('@/components/map/DeviceMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[420px] h-[420px] flex items-center justify-center bg-slate-100 text-slate-500 font-mono text-xs rounded-2xl">
      <span>جاري تحميل الخريطة...</span>
    </div>
  ),
});

const IMPORTANT_ACTIVITY_PATTERN = /(command|locate|location|gps|ble|sms|relay|offline|scream|siren|stolen|found|lock|track|power|photo|network|error|fail|proximity|install|register)/i;
const NOISY_CLIENT_LOG_PATTERN = /(?:SYS\/\/(?:REQ|RES).*(?:\/logs|\/devices|\/auth\/me)|\b(?:REQ|RES)\s+GET\s+\/(?:logs|devices|auth\/me)\b)/i;
const NOTIFICATION_STORAGE_KEY = 'zex_dashboard_notifications_v1';
const commandLabels: Record<string, string> = {
  LOCATE: 'طلب تحديد الموقع',
  CONTINUOUS_TRACK: 'تشغيل التتبع المستمر',
  STOP_TRACKING: 'إيقاف التتبع',
  STOP_SEARCH: 'إيقاف البحث',
  SCREAM: 'تشغيل الإنذار',
  STOP_SCREAM: 'إيقاف الإنذار',
  LOCK: 'قفل الجهاز',
  ENABLE_NET: 'تشغيل الشبكة',
  STOLEN_MODE: 'وضع السرقة',
  FOUND_MODE: 'تم العثور على الجهاز',
  POWER_SAVER_ON: 'تشغيل توفير الطاقة',
  POWER_SAVER_OFF: 'إيقاف توفير الطاقة',
};

const asObject = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
);

const firstText = (...values: unknown[]) => {
  for (const value of values) {
    if (value == null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return '';
};

const firstNumber = (...values: unknown[]) => {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return null;
};

const compactCoordinate = (value: number) => Number(value.toFixed(6)).toString();

const formatActivityTime = (timestamp: unknown) => {
  const time = new Date(String(timestamp || ''));
  return Number.isNaN(time.getTime()) ? '--:--:--' : time.toLocaleTimeString('en-GB');
};

const isImportantActivity = (entry: any) => {
  const payload = asObject(entry?.payload);
  const metadata = asObject(entry?.metadata);
  const action = String(entry?.action || '').toUpperCase();

  // Only suppress high-frequency raw beacon proximity updates
  if (action === 'BLE_PROXIMITY_UPDATE') {
    return false;
  }

  const haystack = [
    entry?.action,
    entry?.message,
    entry?.device_name,
    entry?.target_device_name,
    payload.source,
    payload.transport,
    payload.proximity,
    payload.command,
    payload.command_type,
    metadata.command,
    metadata.command_type,
    metadata.status,
  ].map((value) => String(value || '')).join(' ');

  return IMPORTANT_ACTIVITY_PATTERN.test(haystack);
};

const activitySignature = (entry: any) => {
  const payload = asObject(entry?.payload);
  const metadata = asObject(entry?.metadata);
  const lat = firstNumber(payload.lat, payload.latitude, metadata.lat, metadata.latitude);
  const lng = firstNumber(payload.lng, payload.longitude, metadata.lng, metadata.longitude);

  return [
    entry?.action,
    entry?.device_name,
    entry?.target_device_name,
    payload.source,
    payload.transport,
    payload.target_uid,
    metadata.command_id,
    metadata.status,
    lat == null ? '' : compactCoordinate(lat),
    lng == null ? '' : compactCoordinate(lng),
    entry?.message,
  ].map((value) => String(value || '').trim()).join('|');
};

const formatActivityLine = (entry: any) => {
  const payload = asObject(entry?.payload);
  const metadata = asObject(entry?.metadata);
  const action = firstText(entry?.action, 'activity').toUpperCase();
  const message = firstText(entry?.message, 'Activity logged');
  const deviceName = firstText(entry?.device_name, payload.device_name, payload.source_uid, 'device');
  const targetName = firstText(entry?.target_device_name, payload.target_name, payload.target_uid);
  const source = firstText(payload.source, payload.transport, action).toUpperCase();
  const command = firstText(payload.command, payload.command_type, metadata.command, metadata.command_type);
  const status = firstText(metadata.status, payload.status);
  const lat = firstNumber(payload.lat, payload.latitude, metadata.lat, metadata.latitude);
  const lng = firstNumber(payload.lng, payload.longitude, metadata.lng, metadata.longitude);
  const distance = firstNumber(payload.distance_meters, metadata.distance_meters, payload.distance);
  const time = formatActivityTime(entry?.timestamp || entry?.created_at);

  if (action === 'LOCATION_RECEIVED') {
    const parts = [`[${time}] ${deviceName}: وصل موقع جديد`];
    if (lat != null && lng != null) parts.push(`${compactCoordinate(lat)}, ${compactCoordinate(lng)}`);
    if (payload.accuracy != null) parts.push(`دقة ${Number(payload.accuracy).toFixed(0)}م`);
    return parts.join(' ');
  }

  if (command || action.includes('COMMAND')) {
    const commandName = (command || action).toUpperCase();
    const label = commandLabels[commandName] || commandName;
    if (action === 'COMMAND_DEDUPED') {
      return `[${time}] ${deviceName}: ${label} موجود بالفعل، مستني رد الموبايل`;
    }
    if (action === 'COMMAND_WAITING') {
      return `[${time}] ${deviceName}: ${label} لسه مستني الموبايل يستلمه`;
    }
    if (action === 'COMMAND_TIMEOUT') {
      return `[${time}] ${deviceName}: ${label} انتهت مهلة الرد`;
    }
    const state = action.includes('QUEUED')
      ? 'اتسجل'
      : action.includes('SENT')
        ? 'اترسل للموبايل'
        : status.toUpperCase() === 'FAILED'
          ? 'فشل'
          : status.toUpperCase() === 'EXECUTED'
            ? 'اتنفذ'
            : 'اتحدث';
    const parts = [`[${time}] ${deviceName}: ${label} ${state}`];
    if (targetName) parts.push(`لـ ${targetName}`);
    if (status && !['EXECUTED', 'FAILED'].includes(status.toUpperCase())) parts.push(`(${status})`);
    return parts.join(' ');
  }

  if (/(BLE|SMS|OFFLINE|RELAY|PROXIMITY|LOCATION|GPS)/i.test(`${source} ${action} ${message}`)) {
    const channel = source.includes('BLE') ? 'بالبلوتوث' : source.includes('SMS') ? 'برسالة SMS' : 'Offline';
    const parts = [`[${time}] ${deviceName} لقط موقع ${targetName || 'الجهاز'} ${channel}`];
    if (lat != null && lng != null) parts.push(`${compactCoordinate(lat)}, ${compactCoordinate(lng)}`);
    if (distance != null) parts.push(`المسافة ${distance.toFixed(1)}م`);
    return parts.join(' ');
  }

  if (/INSTALL|REGISTER/i.test(`${action} ${message}`)) {
    return `[${time}] ${deviceName}: الجهاز اتسجل على النظام`;
  }

  return `[${time}] ${deviceName}: ${message}`;
};

const terminalLineClass = (line: string) => {
  if (/\b(ERR|ERROR|FAIL)\b/i.test(line)) return 'text-rose-300';
  if (/\b(CMD|COMMAND)\b/i.test(line)) return 'text-sky-300';
  if (/\b(OFFLINE|BLE|SMS|RELAY|PROXIMITY)\b/i.test(line)) return 'text-amber-200';
  if (/\b(LOCATION|GPS|LOCATE)\b/i.test(line)) return 'text-emerald-300';
  return 'text-slate-300';
};

type DashboardNotification = {
  id: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  detail: string;
  deviceName: string;
  deviceId?: number | string;
  createdAt: string;
  read: boolean;
};

const activityNotification = (entry: any): DashboardNotification | null => {
  const payload = asObject(entry?.payload);
  const metadata = asObject(entry?.metadata);
  const action = firstText(entry?.action, '').toUpperCase();
  const command = firstText(payload.command, payload.command_type, metadata.command, metadata.command_type);
  const commandName = command ? (commandLabels[command.toUpperCase()] || command.toUpperCase()) : '';
  const deviceName = firstText(entry?.device_name, payload.device_name, payload.source_uid, 'device');
  const deviceId = entry?.device_id || payload.device_id || metadata.device_id;
  const createdAt = String(entry?.timestamp || entry?.created_at || new Date().toISOString());
  const id = String(entry?.id || `${action}:${deviceName}:${createdAt}:${command}`);
  const line = formatActivityLine(entry).replace(/^\[[^\]]+\]\s*/, '');

  if (action === 'LOCATION_RECEIVED') {
    return { id, tone: 'success', title: `وصل موقع ${deviceName}`, detail: line, deviceName, deviceId, createdAt, read: false };
  }

  if (action === 'COMMAND_SENT') {
    return { id, tone: 'info', title: `${deviceName} استلم الأمر`, detail: commandName || line, deviceName, deviceId, createdAt, read: false };
  }

  if (action === 'COMMAND_RESPONSE') {
    const status = firstText(metadata.status, payload.status).toUpperCase();
    const failed = status === 'FAILED';
    return {
      id,
      tone: failed ? 'danger' : 'success',
      title: failed ? `${deviceName} فشل في تنفيذ الأمر` : `${deviceName} نفذ الأمر`,
      detail: commandName || line,
      deviceName,
      deviceId,
      createdAt,
      read: false,
    };
  }

  if (action === 'COMMAND_WAITING') {
    return { id, tone: 'warning', title: `${deviceName} لسه مستلمش الأمر`, detail: commandName || line, deviceName, deviceId, createdAt, read: false };
  }

  if (action === 'COMMAND_TIMEOUT') {
    return { id, tone: 'danger', title: `${deviceName} مردش على الأمر`, detail: commandName || line, deviceName, deviceId, createdAt, read: false };
  }

  if (action.includes('STOLEN')) {
    return { id, tone: 'danger', title: `${deviceName} وضع السرقة اتفعل`, detail: line, deviceName, deviceId, createdAt, read: false };
  }

  if (action.includes('FOUND')) {
    return { id, tone: 'success', title: `${deviceName} خرج من وضع السرقة`, detail: line, deviceName, deviceId, createdAt, read: false };
  }

  if (/INSTALL|REGISTER/i.test(`${action} ${entry?.message || ''}`)) {
    return { id, tone: 'info', title: `${deviceName} اتسجل على النظام`, detail: line, deviceName, deviceId, createdAt, read: false };
  }

  return null;
};

export default function DashboardClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [now, setNow] = useState(Date.now());
  const [pendingLocates, setPendingLocates] = useState<Record<string, number>>({});

  useEffect(() => {
    const isAnyPending = Object.keys(pendingLocates).length > 0;
    const intervalMs = isAnyPending ? 1000 : 10000;
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [pendingLocates]);

  function isDeviceOnline(d: any): boolean {
    if (!d) return false;
    const lastSeen = d.last_heartbeat_at || d.last_seen_at || d.updated_at || d.last_heartbeat;
    if (!lastSeen) return false;
    const t = new Date(lastSeen).getTime();
    if (isNaN(t) || t <= 0) return false;
    return (now - t) < 300000;
  }
  const [device, setDevice] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [rtState, setRtState] = useState<any>(null);
  const [locationHistory, setLocationHistory] = useState<[number, number][]>([]);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);
  const [unregisterTarget, setUnregisterTarget] = useState<any>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [serverActivity, setServerActivity] = useState<any[]>([]);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const devicesRefreshInFlight = useRef(false);
  const lastLocationNoticeKey = useRef<string | null>(null);
  const seenActivityNotifications = useRef<Set<string>>(new Set());

  const allLogs = useTerminalStore((state) => state.logs);
  const addLog = useTerminalStore((state) => state.addLog);
  const clearLogs = useTerminalStore((state) => state.clearLogs);
  const [terminalCopied, setTerminalCopied] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const activityLines = useMemo(() => {
    const seen = new Set<string>();

    return serverActivity
      .filter(isImportantActivity)
      .filter((entry) => {
        const signature = activitySignature(entry);
        if (seen.has(signature)) return false;
        seen.add(signature);
        return true;
      })
      .map(formatActivityLine)
      .slice(0, 30);
  }, [serverActivity]);
  const logs = useMemo(() => {
    const clientLogs = allLogs.filter((log) => !NOISY_CLIENT_LOG_PATTERN.test(log)).slice(0, 50).reverse();
    const serverLogs = activityLines.slice(0, 30).reverse();
    const merged = [...serverLogs, ...clientLogs];
    const seen = new Set<string>();
    const dedupe: string[] = [];
    for (const item of merged) {
      if (!seen.has(item)) {
        seen.add(item);
        dedupe.push(item);
      }
    }
    return dedupe.slice(-80);
  }, [activityLines, allLogs]);
  const router = useRouter();

  const copyTerminalLogs = useCallback(async () => {
    if (!logs.length) return;
    try {
      await navigator.clipboard.writeText(logs.join('\n'));
      setTerminalCopied(true);
      window.setTimeout(() => setTerminalCopied(false), 1500);
    } catch {
      alert('Failed to copy debug logs');
    }
  }, [logs]);

  const clearDebugLogs = useCallback(async () => {
    setClearingLogs(true);
    try {
      if (serverActivity.length > 0) {
        await api.delete('/logs');
      }
      setServerActivity([]);
      clearLogs();
    } catch {
      clearLogs();
      alert('Cleared local logs, but failed to clear server logs');
    } finally {
      setClearingLogs(false);
    }
  }, [clearLogs, serverActivity.length]);

  useEffect(() => {
    const loadServerActivity = async () => {
      try {
        const response = await api.get('/logs');
        setServerActivity(Array.isArray(response.data) ? response.data.slice(0, 80) : []);
      } catch {
        // The main dashboard remains usable when the activity endpoint is unavailable.
      }
    };
    loadServerActivity();
    const refresh = setInterval(loadServerActivity, 5000);
    return () => clearInterval(refresh);
  }, []);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setNotifications(parsed.slice(0, 50));
        seenActivityNotifications.current = new Set(parsed.map((item: DashboardNotification) => item.id));
      }
    } catch {
      // Session notifications are best-effort only.
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
    } catch {
      // Keep the dashboard usable if session storage is unavailable.
    }
  }, [notifications]);

  useEffect(() => {
    const fresh: DashboardNotification[] = [];

    serverActivity
      .slice()
      .reverse()
      .forEach((entry: any) => {
        const notification = activityNotification(entry);
        if (!notification || seenActivityNotifications.current.has(notification.id)) return;
        seenActivityNotifications.current.add(notification.id);
        fresh.push(notification);
      });

    if (!fresh.length) return;
    setNotifications((current) => {
      const known = new Set(current.map((item) => item.id));
      return [...fresh.filter((item) => !known.has(item.id)).reverse(), ...current].slice(0, 50);
    });
  }, [serverActivity]);

  const unreadNotifications = notifications.filter((item) => !item.read).length;

  const toggleNotifications = () => {
    setNotificationsOpen((open) => !open);
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  };

  const clearNotifications = () => {
    const visibleIds = serverActivity
      .map(activityNotification)
      .filter((item): item is DashboardNotification => Boolean(item))
      .map((item) => item.id);
    setNotifications([]);
    seenActivityNotifications.current = new Set(visibleIds);
    try {
      sessionStorage.removeItem(NOTIFICATION_STORAGE_KEY);
    } catch {
      // Nothing to clear.
    }
  };

  const pushSessionNotification = useCallback((notification: DashboardNotification) => {
    if (seenActivityNotifications.current.has(notification.id)) return;
    seenActivityNotifications.current.add(notification.id);
    setNotifications((current) => {
      if (current.some((item) => item.id === notification.id)) return current;
      return [notification, ...current].slice(0, 50);
    });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('zex_token') || localStorage.getItem('zex_auth_token');
    const hasCookie = document.cookie.includes('zex_token=');
    if (!token && !hasCookie) { router.replace('/login'); return; }

    getMe()
      .then((data) => { setUser(data?.data || data); fetchDevicesInner(); })
      .catch(() => { localStorage.removeItem('zex_token'); localStorage.removeItem('zex_auth_token'); document.cookie = 'zex_token=; Max-Age=0; path=/'; document.cookie = 'zex_auth_token=; Max-Age=0; path=/'; router.replace('/login'); })
      .finally(() => setIsLoading(false));

    const t = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const uid = device?.device_uid;
    if (!uid) return;
    setLocationHistory([]); // Reset history when switching device
    let unsub: (() => void) | null = null;
    try { unsub = subscribeToDeviceState(uid, (data: any) => { if (data) setRtState(data); }); }
    catch (e) { console.warn('Firebase sub error', e); }
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [device?.device_uid]);

  useEffect(() => {
    setLocationHistory([]);
  }, [device?.id]);

  const statusObj = rtState?.status || rtState || {};
  const locObj = rtState?.last_location || rtState?.location || device?.last_location || {};
  const rawLat = locObj.latitude ?? device?.last_location?.latitude;
  const rawLng = locObj.longitude ?? device?.last_location?.longitude;
  const rawAcc = locObj.accuracy ?? device?.last_location?.accuracy;
  const latitude: number  = rawLat ? Number(rawLat) : 0;
  const longitude: number = rawLng ? Number(rawLng) : 0;
  const accuracy: number  = rawAcc ? Number(rawAcc) : 0;
  const locationRecordedAt = locObj.recorded_at ?? device?.last_location?.recorded_at;
  const relaySource = statusObj.relay_source ?? locObj.relay_source ?? device?.relay_source ?? device?.last_location?.relay_source;

  useEffect(() => {
    setLocationHistory(prev => {
      const last = prev[prev.length - 1];
      if (last && last[0] === latitude && last[1] === longitude) return prev;
      const updated: [number, number][] = [...prev, [latitude, longitude] as [number, number]];
      return updated.length > 50 ? updated.slice(-50) : updated;
    });
  }, [latitude, longitude]);

  useEffect(() => {
    if (!device) return;
    const devIdStr = String(device.id);
    const requestedAt = pendingLocates[devIdStr];
    if (!requestedAt) return;
    if (!latitude || !longitude) return;

    const recordedTime = locationRecordedAt ? new Date(String(locationRecordedAt)).getTime() : Date.now();
    if (Number.isFinite(recordedTime) && recordedTime + 10000 < requestedAt) return;

    const key = `${device.id}:${locationRecordedAt || `${latitude},${longitude}`}`;
    if (lastLocationNoticeKey.current === key) return;

    lastLocationNoticeKey.current = key;
    setPendingLocates((prev) => {
      const next = { ...prev };
      delete next[devIdStr];
      return next;
    });
    const deviceName = getTacticalName(device);
    const receivedAt = new Date().toISOString();
    const coordinateText = `${compactCoordinate(latitude)}, ${compactCoordinate(longitude)}`;
    const detail = `${deviceName}: وصل موقع جديد ${coordinateText}${accuracy ? ` دقة ${accuracy.toFixed(0)}م` : ''}`;
    setLocationNotice(`وصل موقع ${deviceName} الآن`);
    pushSessionNotification({
      id: `local-location:${key}`,
      tone: 'success',
      title: `وصل موقع ${deviceName}`,
      detail,
      deviceName,
      deviceId: device.id,
      createdAt: receivedAt,
      read: false,
    });
    addLog(`[${formatActivityTime(receivedAt)}] ${detail}`);
    window.setTimeout(() => setLocationNotice(null), 6000);
  }, [accuracy, addLog, device, latitude, longitude, locationRecordedAt, pendingLocates, pushSessionNotification]);

  useEffect(() => {
    if (!serverActivity.length) return;
    const pendingKeys = Object.keys(pendingLocates);
    if (!pendingKeys.length) return;

    for (const entry of serverActivity) {
      const action = String(entry?.action || '').toUpperCase();
      const payload = asObject(entry?.payload);
      const metadata = asObject(entry?.metadata);
      const cmd = firstText(payload.command, payload.command_type, metadata.command, metadata.command_type).toUpperCase();
      const status = firstText(metadata.status, payload.status).toUpperCase();

      const isLocationReceived = action === 'LOCATION_RECEIVED';
      const isLocateExecuted = (action === 'COMMAND_RESPONSE' || action === 'COMMAND_EXECUTED') && cmd === 'LOCATE' && status === 'EXECUTED';

      if (!isLocationReceived && !isLocateExecuted) continue;

      let matchedDevId: string | null = null;
      for (const id of pendingKeys) {
        if (entry.device_id && String(entry.device_id) === String(id)) {
          matchedDevId = id;
          break;
        }
      }
      if (!matchedDevId && entry.device_name) {
        const found = devices.find(d => getTacticalName(d) === String(entry.device_name) || String(d.name) === String(entry.device_name));
        if (found && pendingKeys.includes(String(found.id))) {
          matchedDevId = String(found.id);
        }
      }

      if (!matchedDevId) continue;

      const requestedAt = pendingLocates[matchedDevId];
      if (!requestedAt) continue;

      const eventTime = new Date(String(entry.timestamp || entry.created_at || '')).getTime();
      if (Number.isFinite(eventTime) && eventTime + 10000 < requestedAt) {
        continue;
      }

      const key = `server-loc-${matchedDevId}-${entry.id || entry.timestamp || entry.created_at}`;
      if (lastLocationNoticeKey.current === key) continue;
      lastLocationNoticeKey.current = key;

      setPendingLocates((prev) => {
        const next = { ...prev };
        delete next[matchedDevId!];
        return next;
      });

      const matchedDev = devices.find((d: any) => String(d.id) === String(matchedDevId));
      const devName = matchedDev ? getTacticalName(matchedDev) : (entry.device_name || `جهاز #${matchedDevId}`);
      const noticeMsg = `وصل موقع ${devName} الآن`;
      setLocationNotice(noticeMsg);
      window.setTimeout(() => setLocationNotice(null), 6000);

      const timeStr = formatActivityTime(entry.timestamp || entry.created_at || new Date().toISOString());
      const lat = firstNumber(payload.lat, payload.latitude, metadata.lat, metadata.latitude);
      const lng = firstNumber(payload.lng, payload.longitude, metadata.lng, metadata.longitude);
      const coords = (lat != null && lng != null) ? ` (${compactCoordinate(lat)}, ${compactCoordinate(lng)})` : '';
      const detail = `${devName}: وصل موقع جديد${coords}`;

      pushSessionNotification({
        id: key,
        tone: 'success',
        title: `وصل موقع ${devName}`,
        detail,
        deviceName: devName,
        deviceId: matchedDevId,
        createdAt: new Date().toISOString(),
        read: false,
      });

      addLog(`[${timeStr}] ${detail}`);

      if (device && String(device.id) === String(matchedDevId)) {
        fetchDevicesInner();
      }
    }
  }, [serverActivity, pendingLocates, devices, device, addLog, pushSessionNotification]);

  const isScreaming  = statusObj.is_screaming  ?? device?.is_screaming;
  const isStolen     = statusObj.is_stolen     ?? device?.is_stolen;
  const isSearching  = statusObj.is_searching  ?? device?.is_searching;
    const isPowerSaver = statusObj.is_power_saver ?? device?.is_power_saver;
  const batteryLevel = Number(statusObj.battery_level ?? device?.battery_level ?? 0);

  const isOnline = isDeviceOnline({ ...device, ...statusObj });

  const filteredDevices = (devices || []).filter((d) => {
    if (!searchQuery) return true;
    const q = String(searchQuery).toLowerCase();
    return String(d?.name || d?.device_uid || d?.model || '').toLowerCase().includes(q) ||
           String(d?.model || d?.device_type || '').toLowerCase().includes(q);
  });

  async function fetchDevicesInner() {
    if (devicesRefreshInFlight.current) return;
    devicesRefreshInFlight.current = true;
    try {
      const fetched = await getDevices();
      if (fetched && fetched.length > 0) {
        setDevices(fetched);
        setDevice((prev: any) => { if (prev) { const m = fetched.find((d: any) => d.id === prev.id); if (m) return m; } return fetched[0]; });
      } else { setDevices([]); setDevice(null); }
    } catch { /* Keep the last known device state during a transient network failure. */ }
    finally { devicesRefreshInFlight.current = false; }
  }
  const fetchDevices = () => fetchDevicesInner();

  // Keep newly registered devices and server-side status changes visible without
  // a full page reload. Firebase remains the fast path for the selected device.
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') fetchDevicesInner(); };
    const interval = window.setInterval(refresh, 10000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const optimisticPing = () => {
    if (!device) return;
    const nowStr = new Date().toISOString();
    setDevice((p: any) => p ? { ...p, last_heartbeat_at: nowStr, updated_at: nowStr } : null);
    setRtState((p: any) => p ? { ...p, last_heartbeat_at: nowStr } : null);
    setDevices((prev: any[]) => prev.map(d => d.id === device.id ? { ...d, last_heartbeat_at: nowStr, updated_at: nowStr } : d));
    setNow(Date.now());
  };

  const handleTogglePowerSaver = async () => { if (!device) return; setActionLoading(true); try { await togglePowerSaver(device.id, !isPowerSaver); setDevice((p:any)=>({...p,is_power_saver:!isPowerSaver})); setRtState((p:any)=>p?{...p,is_power_saver:!isPowerSaver}:null); optimisticPing(); await fetchDevicesInner(); } catch (err: any) { alert("Failed to toggle power saver: " + (err.response?.data?.message || err.message || "Server Error")); } finally { setActionLoading(false); } };
  const isCurrentDevicePending = Boolean(device && pendingLocates[String(device.id)]);
  const currentPendingSeconds = isCurrentDevicePending ? Math.max(0, Math.floor((now - pendingLocates[String(device.id)]) / 1000)) : 0;
  const otherPendingIds = Object.keys(pendingLocates).filter((id) => !device || String(id) !== String(device.id));
  const otherPendingDevices = otherPendingIds
    .map((id) => devices.find((d: any) => String(d.id) === String(id)))
    .filter(Boolean);
  const otherPendingSeconds = otherPendingIds.length > 0
    ? Math.max(0, Math.floor((now - pendingLocates[otherPendingIds[0]]) / 1000))
    : 0;

  const handleLocate = useCallback(async () => {
    if (!device) return;
    setActionLoading(true);
    const devIdStr = String(device.id);
    const devName = getTacticalName(device);
    try {
      setPendingLocates((prev) => ({ ...prev, [devIdStr]: Date.now() }));
      addLog(`[${formatActivityTime(new Date())}] تم إرسال طلب تحديد موقع ${devName} (جاري انتظار استجابة الموبايل...)`);
      await locateDevice(device.id);
      optimisticPing();
      await fetchDevicesInner();
      [3000, 8000, 15000].forEach((delay) => {
        window.setTimeout(() => {
          if (document.visibilityState === 'visible') fetchDevicesInner();
        }, delay);
      });
    } catch {
      setPendingLocates((prev) => {
        const next = { ...prev };
        delete next[devIdStr];
        return next;
      });
      alert('Failed to execute GPS Locate');
    } finally {
      setActionLoading(false);
    }
  }, [device?.id, device?.name, device?.device_name, device?.device_uid, addLog]);
  const handleStartScream  = async () => {
    if (!device) return;
    try {
      addLog(`[${formatActivityTime(new Date())}] تم إرسال أمر تشغيل الإنذار/الرنين إلى ${getTacticalName(device)}`);
      await screamDevice(device.id);
      setDevice((p: any) => ({ ...p, is_screaming: true }));
      setRtState((p: any) => p ? { ...p, is_screaming: true } : null);
      optimisticPing();
      await fetchDevicesInner();
    } catch {
      alert('Failed to execute Scream Alert');
    }
  };
  const handleStopScreamClick = () => { if (!device) return; setShowPasswordModal(true); };
  const handleStopScream   = async () => { if (!device) return; setActionLoading(true); try { await stopScreamDevice(device.id, passwordInput.trim()); setShowPasswordModal(false); setPasswordInput(''); setDevice((p:any)=>p?{...p,is_screaming:false}:null); setRtState((p:any)=>p?{...p,is_screaming:false}:null); optimisticPing(); await fetchDevicesInner(); } catch { alert('Invalid Password'); } finally { setActionLoading(false); } };
  const handleStartSearch  = async () => { if (!device) return; try { await startSearchMode(device.id, 30); setDevice((p:any)=>({...p,is_searching:true})); setRtState((p:any)=>p?{...p,is_searching:true}:null); optimisticPing(); await fetchDevicesInner(); } catch { alert('Failed to execute BLE Radar'); } };
  const handleStopSearch   = async () => { if (!device) return; try { await stopSearchMode(device.id); setDevice((p:any)=>({...p,is_searching:false})); setRtState((p:any)=>p?{...p,is_searching:false}:null); optimisticPing(); await fetchDevicesInner(); } catch { alert('Failed to stop BLE Radar'); } };
  const handleStartStolen  = async () => { if (!device) return; try { await markStolen(device.id); setDevice((p:any)=>({...p,is_stolen:true})); setRtState((p:any)=>p?{...p,is_stolen:true}:null); optimisticPing(); await fetchDevicesInner(); } catch { alert('Failed to execute Lock Protocol'); } };
  const handleStopStolenClick = () => { if (!device) return; setShowPinModal(true); };
  const handleMarkFound    = async () => { if (!device) return; setActionLoading(true); try { await markFound(device.id, pinInput.trim()); setShowPinModal(false); setPinInput(''); setDevice((p:any)=>p?{...p,is_stolen:false,is_screaming:false,is_searching:false}:null); setRtState((p:any)=>p?{...p,is_stolen:false,is_screaming:false,is_searching:false}:null); optimisticPing(); await fetchDevicesInner(); } catch { alert('Invalid 6-digit PIN'); } finally { setActionLoading(false); } };
  const handleDeleteClick  = () => { if (!device) return; setShowDeleteModal(true); };
  const handleDeleteDevice = async () => { if (!device) return; setActionLoading(true); try { await deleteDevice(device.id, deletePasswordInput.trim()); setShowDeleteModal(false); setDeletePasswordInput(''); const r=devices.filter((d:any)=>d.id!==device.id); setDevices(r); setDevice(r.length>0?r[0]:null); } catch { alert('Failed to Remove Device. Invalid Password.'); } finally { setActionLoading(false); } };
  const handleUnregisterDevice = async () => { if (!unregisterTarget) return; setActionLoading(true); try { await deleteDevice(unregisterTarget.id, deletePasswordInput.trim()); setShowUnregisterModal(false); setDeletePasswordInput(''); const r=devices.filter((d:any)=>d.id!==unregisterTarget.id); setDevices(r); if(device?.id===unregisterTarget.id) setDevice(r.length>0?r[0]:null); setUnregisterTarget(null); } catch { alert('Failed to Remove Device. Invalid Password.'); } finally { setActionLoading(false); } };

  const commands = [
    { label: 'Extreme Power Saver', sub: isPowerSaver ? 'Disable Saver' : 'Activate Saver', icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" />, color: isPowerSaver ? 'amber' : 'emerald', onClick: handleTogglePowerSaver, disabled: !device || actionLoading },
    { label: 'Scream Alert', sub: isScreaming ? 'Mute Siren' : 'Force Siren', icon: isScreaming ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />, color: isScreaming ? 'slate' : 'blue', onClick: isScreaming ? handleStopScreamClick : handleStartScream, disabled: !device },
    {
      label: 'GPS Locate',
      sub: isCurrentDevicePending ? `مستني الرد (${currentPendingSeconds}s)` : 'Fetch Live GPS',
      icon: <MapPin className={`w-5 h-5 sm:w-6 sm:h-6 ${isCurrentDevicePending ? 'animate-bounce text-amber-600' : ''}`} />,
      color: isCurrentDevicePending ? 'amber' : 'emerald',
      onClick: handleLocate,
      disabled: !device || actionLoading,
    },
    { label: isSearching ? 'Stop BLE Radar' : 'BLE Radar', sub: isSearching ? 'Stop peer discovery' : 'Start offline discovery', icon: <BluetoothSearching className="w-5 h-5 sm:w-6 sm:h-6" />, color: isSearching ? 'slate' : 'indigo', onClick: isSearching ? handleStopSearch : handleStartSearch, disabled: !device || actionLoading },
    { label: 'Mark Stolen', sub: 'Lock Protocol', icon: <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />, color: 'rose', onClick: handleStartStolen, disabled: !!isStolen || !device },
    { label: 'Unmark Stolen', sub: 'Recovered Status', icon: <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />, color: 'emerald', onClick: handleStopStolenClick, disabled: !isStolen || !device },
    { label: 'Remove Device', sub: 'Delete Record', icon: <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />, color: 'slate', onClick: handleDeleteClick, disabled: !device || actionLoading },
  ];
  const btnColors: Record<string,string> = {
    blue:    'bg-blue-50 text-blue-600',
    slate:   'bg-slate-100 text-slate-600',
    amber: 'bg-amber-50 text-amber-600',
      emerald: 'bg-emerald-50 text-emerald-600',
    indigo:  'bg-indigo-50 text-indigo-600',
    rose:    'bg-rose-50 text-rose-600',
  };

  function getTacticalName(d: any): string {
    if (!d) return 'Device';
    if (d.device_name && String(d.device_name).trim()) return String(d.device_name).trim();
    if (d.name && String(d.name).trim()) return String(d.name).trim();
    if (d.device_model && String(d.device_model).trim()) return String(d.device_model).trim();
    if (d.model && String(d.model).trim()) return String(d.model).trim();
    
    const uid = String(d.device_uid || d.uid || '');
    return uid ? `Device #${uid.slice(-4).toUpperCase()}` : 'Device';
  }

  const memoizedDeviceMap = useMemo(() => (
    <DeviceMap latitude={latitude} longitude={longitude} accuracy={accuracy} isOnline={isOnline} batteryLevel={batteryLevel} deviceId={device?.device_uid} history={locationHistory} />
  ), [latitude, longitude, accuracy, isOnline, batteryLevel, device?.device_uid, locationHistory]);

  const notificationToneClasses: Record<DashboardNotification['tone'], string> = {
    info: 'border-sky-200 bg-sky-50 text-sky-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-rose-200 bg-rose-50 text-rose-800',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-mono" dir="ltr">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-bold text-slate-200">جاري تهيئة غرفة العمليات C4ISR...</span>
        <span className="text-xs text-slate-500 mt-1">Securing ZEX Node...</span>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex flex-row items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shrink-0"><Shield className="w-4 h-4" /></div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight">ZEX MILITARY</span>
            <span className="text-[10px] font-semibold text-slate-500">Encrypted Operations</span>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/60 flex flex-row items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0"><User className="w-3.5 h-3.5" /></div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-xs text-slate-800 truncate">{user?.name || 'Operator'}</span>
            <span className="text-[10px] text-slate-500 font-mono truncate">{user?.email || 'admin@c4isr.gov'}</span>
          </div>
        </div>
      </div>

      {/* Device List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        <div className="flex flex-row items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex flex-row items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-blue-600" />Active Units</span>
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px]">{devices?.length || 0}</span>
        </div>
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
          <input type="text" placeholder="Search units..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full h-8 pr-8 pr-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <div className="flex flex-col gap-1.5">
          {(filteredDevices.length > 0) ? filteredDevices.map(d => {
            const isPending = Boolean(pendingLocates[String(d.id)]);
            const pendingSec = isPending ? Math.max(0, Math.floor((now - pendingLocates[String(d.id)]) / 1000)) : 0;
            return (
              <div key={d.id} onClick={() => { setDevice(d); setShowMobileMenu(false); }}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${device?.id === d.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className={`w-3.5 h-3.5 ${device?.id === d.id ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={`font-bold text-xs truncate max-w-[120px] ${device?.id === d.id ? 'text-blue-900' : 'text-slate-700'}`}>
                        {getTacticalName(d)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isPending && (
                      <span className="flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold animate-pulse">
                        <MapPin className="w-2.5 h-2.5" />
                        {pendingSec}s
                      </span>
                    )}
                    {d.is_stolen && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-500 truncate">{`Android ${d?.android_version || '10'} • ${d?.device_model || d?.model || d?.brand || ''}`}</span>
                  <span className={`px-1 py-0.5 rounded flex items-center gap-0.5 ${(d?.battery_level ?? 0) > 20 ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-700'}`}>
                    <Battery className="w-2.5 h-2.5" />{d?.battery_level ?? 0}%
                  </span>
                </div>
              </div>
            );
          }) : <div className="text-xs text-slate-400 text-center py-4">No devices found</div>}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-slate-100 flex flex-col gap-1 bg-slate-50/50">
                <button onClick={() => { router.push('/dashboard/mesh-map'); setShowMobileMenu(false); }} className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 py-2 px-2.5 hover:bg-white rounded-lg transition-colors">
          <Map className="w-3.5 h-3.5" />Offline Mesh Map
        </button>
        <button onClick={() => { router.push('/logs'); setShowMobileMenu(false); }} className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 py-2 px-2.5 hover:bg-white rounded-lg transition-colors">
          <Activity className="w-3.5 h-3.5" />Fleet Activities
        </button>
        <button onClick={() => { router.push('/settings'); setShowMobileMenu(false); }} className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 py-2 px-2.5 hover:bg-white rounded-lg transition-colors">
          <Settings className="w-3.5 h-3.5" />System Settings
        </button>
        <button onClick={() => { logout(); router.push('/login'); }} className="flex items-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-700 py-2 px-2.5 hover:bg-white rounded-lg transition-colors">
          <LogOut className="w-3.5 h-3.5" />Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex font-sans" dir="ltr">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* ── Desktop Sidebar ── */}
      <aside className="w-72 xl:w-80 bg-white border-l border-slate-200/80 shadow-sm hidden lg:flex flex-col z-20 h-screen shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile Drawer Overlay ── */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 lg:hidden" dir="ltr">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />
          <aside className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200/80 shadow-sm flex items-center justify-between px-3 sm:px-5 z-10 shrink-0 sticky top-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger */}
            <button onClick={() => setShowMobileMenu(true)} className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center active:scale-95 transition-transform">
              <Menu className="w-4 h-4" />
            </button>
            {/* Brand icon (mobile only) */}
            <div className="lg:hidden w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            {/* Device UID chip */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono max-w-[180px] sm:max-w-none">
              <Radar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-slate-500 hidden sm:inline">عقدة:</span>
              <span className="font-bold text-slate-900 truncate" title={device?.device_uid}>{getTacticalName(device)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={toggleNotifications}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-600 px-1 text-[9px] font-bold leading-4 text-white">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-11 z-30 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-slate-900">إشعارات الأجهزة</span>
                      <span className="text-[10px] text-slate-500">محفوظة في السيشن فقط</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearNotifications}
                      disabled={!notifications.length}
                      className="rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {notifications.length ? notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.deviceId) {
                            const target = devices.find((d: any) => String(d.id) === String(item.deviceId));
                            if (target) {
                              setDevice(target);
                              setNotificationsOpen(false);
                            }
                          }
                        }}
                        className={`mb-2 rounded-xl border px-3 py-2 last:mb-0 transition hover:shadow-sm cursor-pointer ${notificationToneClasses[item.tone]}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-extrabold leading-snug">{item.title}</span>
                          <span className="shrink-0 text-[9px] font-mono opacity-70">{formatActivityTime(item.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-[10px] leading-relaxed opacity-85">{item.detail}</p>
                        {item.deviceId && (
                          <div className="mt-1.5 flex justify-end">
                            <span className="text-[9px] font-bold text-blue-600 underline">عرض الجهاز &larr;</span>
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-6 text-center text-xs font-semibold text-slate-400">
                        مفيش إشعارات جديدة
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => alert('SOS BROADCAST SENT')} className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-2.5 py-1.5 text-xs font-bold active:scale-95 transition-transform hover:bg-rose-100">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse shrink-0" />
              <span className="hidden xs:inline">SOS</span>
            </button>
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-2.5 py-1.5 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="hidden sm:inline">ONLINE</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 flex flex-col gap-4 sm:gap-5">

          {devices.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-sm min-h-[400px]">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-5 border border-slate-100">
                <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">No devices found مسجلة</h2>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">يرجى تسجيل جهاز من تطبيق الموبايل أو Operator Login بحساب يحتوي على أجهزة.</p>
            </div>
          ) : (
            <>
              {/* ── Status Banner ── */}
              <div className={`rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border shadow-sm ${isStolen ? 'bg-red-50 border-red-200 text-red-900' : 'bg-blue-50/60 border-blue-200/60 text-blue-900'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isStolen ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {isStolen ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-sm">{isStolen ? '⚠ سرقة: Protocol الطوارئ Active' : 'TACTICAL STATUS: SYSTEM ONLINE'}</span>
                    <span className={`text-[11px] ${isStolen ? 'text-red-700' : 'text-slate-500'}`}>{isStolen ? 'التتبع السري Active — AES-256 E2EE' : 'All systems operating within standard parameters. — Normal Operations'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 font-mono text-[10px] sm:text-xs self-end sm:self-center">
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400">Encryption</span>
                    <span className="font-bold">AES-256</span>
                  </div>
                  <div className="w-px h-7 bg-slate-200" />
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400">Protocol</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Active</span>
                  </div>
                </div>
              </div>

              {locationNotice ? (
                <div className="rounded-2xl border px-4 py-3 shadow-sm flex items-center justify-between gap-3 bg-emerald-50 border-emerald-200 text-emerald-800 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span className="text-xs sm:text-sm font-bold truncate">
                      {locationNotice}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg shrink-0">
                    تم التحديث الآن
                  </span>
                </div>
              ) : isCurrentDevicePending ? (
                <div className="rounded-2xl border px-4 py-3 shadow-sm flex items-center justify-between gap-3 bg-amber-50 border-amber-200 text-amber-800 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 shrink-0 animate-pulse text-amber-600" />
                    <span className="text-xs sm:text-sm font-bold truncate">
                      مستني رد الموبايل على طلب موقع {getTacticalName(device)}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-lg shrink-0">
                    {currentPendingSeconds}s
                  </span>
                </div>
              ) : otherPendingDevices.length > 0 ? (
                <div className="rounded-2xl border px-4 py-3 shadow-sm flex items-center justify-between gap-3 bg-indigo-50 border-indigo-200 text-indigo-900 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 shrink-0 animate-pulse text-indigo-600" />
                    <span className="text-xs sm:text-sm font-bold truncate">
                      جاري انتظار رد موقع {otherPendingDevices.map(d => getTacticalName(d)).join('، ')} في الخلفية ({otherPendingSeconds}s)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDevice(otherPendingDevices[0])}
                    className="text-xs font-bold bg-indigo-600 text-white px-2.5 py-1 rounded-lg shrink-0 hover:bg-indigo-700 transition"
                  >
                    عرض الجهاز
                  </button>
                </div>
              ) : null}

              {/* ── Map ── */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-1.5 sm:p-4 border border-slate-200/80 shadow-sm relative">
                {/* Map container */}
                <div className="w-full h-[280px] sm:h-[360px] lg:h-[420px] rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100">
                  <div className="absolute inset-0 z-0">
                    {memoizedDeviceMap}
                  </div>

                  {/* HUD overlays */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex justify-between items-start pointer-events-none">
                    <div className="bg-white/90 backdrop-blur border border-slate-200/80 shadow-sm rounded-lg p-2 flex flex-col gap-0.5 font-mono text-[9px] sm:text-[10px] pointer-events-auto">
                      <div className="flex flex-row items-center gap-3 mb-1">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                            <MapPin className="w-2.5 h-2.5 text-blue-600" />
                            <span>{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
                          </div>
                          <div className="text-slate-500 flex items-center gap-1">
                            <Crosshair className="w-2.5 h-2.5" />±{accuracy}m
                          </div>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${latitude || 0},${longitude || 0}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all"
                        >
                          <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                          Open in Google Maps
                        </a>
                      </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur border border-slate-200/80 shadow-sm rounded-lg p-2 flex flex-col gap-0.5 font-mono text-[9px] sm:text-[10px] items-end">
                      <div className="flex items-center gap-1 text-slate-700 font-bold">
                        <span>{batteryLevel}%</span>
                        <Battery className={`w-2.5 h-2.5 ${batteryLevel > 20 ? 'text-emerald-500' : 'text-rose-500'}`} />
                      </div>
                      <div className={`flex items-center gap-1 ${isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
                        <Wifi className="w-2.5 h-2.5" />{isOnline ? 'Protocol: Standard' : 'Offline'}
                      </div>
                      {isPowerSaver && (
                        <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Zap className="w-2.5 h-2.5" />Power Saver
                        </div>
                      )}
                      <div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none">
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded-lg font-bold text-[9px] sm:text-[10px] flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />Geofence
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Command Matrix — 2 cols mobile / 4 cols md+ ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {commands.map(({ label, sub, icon, color, onClick, disabled }) => (
                  <button key={label} onClick={onClick} disabled={disabled}
                    className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-sm hover:shadow-md active:scale-[.98] transition-all flex flex-col items-center justify-center gap-2 text-center disabled:opacity-50 disabled:cursor-not-allowed group">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${btnColors[color]}`}>
                      {icon}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-[11px] sm:text-xs text-slate-800 leading-tight">{label}</span>
                      <span className="text-[9px] sm:text-[10px] text-slate-500 leading-tight">{sub}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* ── Terminal Log ── */}
              <div className="bg-slate-950 rounded-2xl sm:rounded-3xl p-4 shadow-xl border border-slate-800 text-slate-300 font-mono text-xs h-56 sm:h-64 flex flex-col relative overflow-hidden mb-2">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 via-emerald-400 to-transparent opacity-60" />
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-2.5 mb-2.5 shrink-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-bold text-[10px] text-slate-100 uppercase tracking-widest">Debug Stream</span>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-200">
                      commands only
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={copyTerminalLogs}
                      disabled={!logs.length}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 transition hover:border-sky-500 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {terminalCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {terminalCopied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={clearDebugLogs}
                      disabled={clearingLogs || (!allLogs.length && !serverActivity.length)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 transition hover:border-rose-500 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-3 w-3" />
                      {clearingLogs ? 'Clearing' : 'Clear'}
                    </button>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-left pr-1" dir="ltr">
                  {(logs.length > 0) ? logs.map((log, i) => (
                    <div key={`${log}-${i}`} className="rounded-lg border border-slate-800 bg-slate-900/65 px-2.5 py-2">
                      <span className={`break-all text-[10px] leading-relaxed sm:text-xs ${terminalLineClass(log)}`}>
                        <span className="text-sky-400">$ </span>{log}
                      </span>
                    </div>
                  )) : (
                    <div className="rounded-lg border border-slate-800 bg-slate-900/65 px-2.5 py-2">
                      <span className="text-slate-400"><span className="text-sky-400">$ </span>Waiting for command, location, SMS, or BLE events...</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── Modals ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white p-5 sm:p-6 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl text-center" dir="ltr">
            <div className="w-3 h-1 rounded-full bg-slate-300 mx-auto mb-4 sm:hidden" />
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3"><VolumeX className="w-7 h-7" /></div>
            <h3 className="text-lg font-bold text-slate-800 mb-1.5">Silence Alert</h3>
            <p className="text-slate-500 text-xs mb-5">أدخل Password لSilence Alert.</p>
            <div className="relative mb-5">
              <input type={showPassword ? 'text' : 'password'} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none pl-10 font-mono text-left" dir="ltr" placeholder="••••••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 text-sm">Cancel</button>
              <button onClick={handleStopScream} disabled={actionLoading} className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white disabled:opacity-50 text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white p-5 sm:p-6 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl text-center" dir="ltr">
            <div className="w-3 h-1 rounded-full bg-slate-300 mx-auto mb-4 sm:hidden" />
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3"><Trash2 className="w-7 h-7" /></div>
            <h3 className="text-lg font-bold text-slate-800 mb-1.5">Remove Device</h3>
            <p className="text-slate-500 text-xs mb-5">This action will remove the device from your tracking dashboard. It does NOT wipe the device data or factory reset it.</p>
            <div className="relative mb-5">
              <input type={showPassword ? 'text' : 'password'} value={deletePasswordInput} onChange={e => setDeletePasswordInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none pl-10 font-mono text-left" dir="ltr" placeholder="••••••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 text-sm">Cancel</button>
              <button onClick={handleDeleteDevice} disabled={actionLoading} className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white disabled:opacity-50 text-sm">Remove Device</button>
            </div>
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white p-5 sm:p-6 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl text-center" dir="ltr">
            <div className="w-3 h-1 rounded-full bg-slate-300 mx-auto mb-4 sm:hidden" />
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3"><ShieldCheck className="w-7 h-7" /></div>
            <h3 className="text-lg font-bold text-slate-800 mb-1.5">Cancel Mark Stolen</h3>
            <p className="text-slate-500 text-xs mb-5">أدخل رمز PIN المكون من 6 digits.</p>
            <input type="text" maxLength={6} value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 text-center tracking-[0.5em] font-mono text-2xl mb-5 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="000000" />
            <div className="flex gap-3">
              <button onClick={() => setShowPinModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 text-sm">Cancel</button>
              <button onClick={handleMarkFound} disabled={actionLoading} className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white disabled:opacity-50 text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showUnregisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white p-5 sm:p-6 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl text-center" dir="ltr">
            <div className="w-3 h-1 rounded-full bg-slate-300 mx-auto mb-4 sm:hidden" />
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3"><Trash2 className="w-7 h-7" /></div>
            <h3 className="text-lg font-bold text-slate-800 mb-1.5">Cancel تسجيل الجهاز</h3>
            <p className="text-slate-500 text-xs mb-5">لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="relative mb-5">
              <input type={showPassword ? 'text' : 'password'} value={deletePasswordInput} onChange={e => setDeletePasswordInput(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none pl-10 font-mono text-left" dir="ltr" placeholder="••••••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowUnregisterModal(false); setUnregisterTarget(null); setDeletePasswordInput(''); }} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 text-sm">Cancel</button>
              <button onClick={handleUnregisterDevice} disabled={actionLoading || !deletePasswordInput} className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white disabled:opacity-50 text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} onUserUpdate={(u: any) => setUser({ ...user, ...u })} />
    </div>
  );
}

