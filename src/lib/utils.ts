import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';
import { PrayerWithRegistrations } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateDeviceKey(): string {
  return uuidv4();
}

export function getDeviceKey(): string {
  if (typeof window === 'undefined') return '';

  let deviceKey = localStorage.getItem('fridayReg:deviceKey');
  if (!deviceKey) {
    deviceKey = generateDeviceKey();
    localStorage.setItem('fridayReg:deviceKey', deviceKey);
  }
  return deviceKey;
}

export function isRegistrationOpen(prayer: PrayerWithRegistrations, now: Date): boolean {
  const berlinTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const prayerTime = new Date(prayer.datetime.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));

  // Find the Saturday before the prayer at midnight
  const prayerDate = new Date(prayerTime);
  const dayOfWeek = prayerDate.getDay(); // 0 = Sunday, 6 = Saturday
  const daysToLastSaturday = dayOfWeek === 6 ? 0 : (dayOfWeek + 1);

  const lastSaturday = new Date(prayerDate);
  lastSaturday.setDate(prayerDate.getDate() - daysToLastSaturday);
  lastSaturday.setHours(0, 0, 0, 0);

  const windowOpen = berlinTime >= lastSaturday && berlinTime < prayerTime;

  if (prayer.active) return true;
  if (prayer.auto_activation && windowOpen && (prayer.remaining || 0) > 0) return true;

  return false;
}

export function getPrayerStatus(prayer: PrayerWithRegistrations, now: Date): 'open' | 'full' | 'closed' {
  // First check if prayer is manually disabled by admin
  if (!prayer.active) return 'closed';

  // Then check time-based registration window
  if (!isRegistrationOpen(prayer, now)) return 'closed';

  // Finally check capacity
  if ((prayer.remaining || 0) <= 0) return 'full';

  return 'open';
}

export function formatDateTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin'
  }).format(new Date(date));
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}