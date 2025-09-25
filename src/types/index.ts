import { Prayer, Registration, AdminUser, RegistrationStatus } from '@prisma/client';

export type PrayerWithRegistrations = Prayer & {
  registrations: Registration[];
  _count?: {
    registrations: number;
  };
  remaining?: number;
  status?: 'open' | 'full' | 'closed';
};

export type QRPayload = {
  pid: string;
  date: string;
  ppl: number;
};

export type LocalStorageRegistration = {
  people: number;
  qr_json: QRPayload;
  lastSeenISO: string;
  lang: string;
  registration_id?: string;
};

export type PrayerFormData = {
  title: string;
  datetime: string;
  capacity: number;
  location?: string;
  notes?: string;
  active: boolean;
  auto_activation: boolean;
};

export type RegistrationFormData = {
  prayer_id: string;
  people: number;
  device_key: string;
  lang: string;
};

export type { Prayer, Registration, AdminUser, RegistrationStatus };