import { prisma } from './db';
import { PrayerWithRegistrations, PrayerFormData, RegistrationFormData, QRPayload } from '@/types';
import { getPrayerStatus, formatDate } from './utils';
import { RegistrationStatus } from '@prisma/client';

export async function getPrayers(): Promise<PrayerWithRegistrations[]> {
  const prayers = await prisma.prayer.findMany({
    include: {
      registrations: {
        where: {
          status: RegistrationStatus.CONFIRMED
        }
      },
      _count: {
        select: {
          registrations: {
            where: {
              status: RegistrationStatus.CONFIRMED
            }
          }
        }
      }
    },
    orderBy: {
      datetime: 'asc'
    }
  });

  const now = new Date();

  return prayers.map(prayer => {
    const totalRegistered = prayer.registrations.reduce((sum, reg) => sum + reg.people, 0);
    const remaining = prayer.capacity - totalRegistered;
    const status = getPrayerStatus({ ...prayer, remaining }, now);

    return {
      ...prayer,
      remaining,
      status
    };
  });
}

export async function getPrayerById(id: string): Promise<PrayerWithRegistrations | null> {
  const prayer = await prisma.prayer.findUnique({
    where: { id },
    include: {
      registrations: {
        where: {
          status: RegistrationStatus.CONFIRMED
        }
      }
    }
  });

  if (!prayer) return null;

  const totalRegistered = prayer.registrations.reduce((sum, reg) => sum + reg.people, 0);
  const remaining = prayer.capacity - totalRegistered;
  const now = new Date();
  const status = getPrayerStatus({ ...prayer, remaining }, now);

  return {
    ...prayer,
    remaining,
    status
  };
}

export async function createPrayer(data: PrayerFormData) {
  return prisma.prayer.create({
    data: {
      ...data,
      datetime: new Date(data.datetime)
    }
  });
}

export async function updatePrayer(id: string, data: Partial<PrayerFormData>) {
  const updateData: any = { ...data };
  if (data.datetime) {
    updateData.datetime = new Date(data.datetime);
  }

  return prisma.prayer.update({
    where: { id },
    data: updateData
  });
}

export async function deletePrayer(id: string) {
  // Delete registrations first due to foreign key constraint
  await prisma.registration.deleteMany({
    where: { prayer_id: id }
  });

  return prisma.prayer.delete({
    where: { id }
  });
}

export async function registerForPrayer(data: RegistrationFormData): Promise<{ id: string, qr: QRPayload }> {
  return prisma.$transaction(async (tx) => {
    // Check if prayer exists and is open
    const prayer = await tx.prayer.findUnique({
      where: { id: data.prayer_id },
      include: {
        registrations: {
          where: {
            status: RegistrationStatus.CONFIRMED
          }
        }
      }
    });

    if (!prayer) {
      throw new Error('Prayer not found');
    }

    // Calculate current capacity
    const totalRegistered = prayer.registrations.reduce((sum, reg) => sum + reg.people, 0);
    const remaining = prayer.capacity - totalRegistered;

    if (remaining < data.people) {
      throw new Error('Not enough capacity');
    }

    // Check if device already registered
    const existingReg = await tx.registration.findFirst({
      where: {
        prayer_id: data.prayer_id,
        device_key: data.device_key,
        status: RegistrationStatus.CONFIRMED
      }
    });

    if (existingReg) {
      throw new Error('Device already registered');
    }

    // Create QR payload
    const qrPayload: QRPayload = {
      pid: data.prayer_id,
      date: formatDate(new Date()),
      ppl: data.people
    };

    // Create registration
    const registration = await tx.registration.create({
      data: {
        prayer_id: data.prayer_id,
        people: data.people,
        device_key: data.device_key,
        lang: data.lang,
        qr_payload_text: JSON.stringify(qrPayload)
      }
    });

    return {
      id: registration.id,
      qr: qrPayload
    };
  });
}

export async function updateRegistration(registrationId: string, people: number) {
  return prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({
      where: { id: registrationId },
      include: {
        prayer: {
          include: {
            registrations: {
              where: {
                status: RegistrationStatus.CONFIRMED,
                id: { not: registrationId }
              }
            }
          }
        }
      }
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    if (registration.status !== RegistrationStatus.CONFIRMED) {
      throw new Error('Registration is not active');
    }

    // Check capacity with new people count
    const otherRegistrations = registration.prayer.registrations.reduce((sum, reg) => sum + reg.people, 0);
    const totalWithUpdate = otherRegistrations + people;

    if (totalWithUpdate > registration.prayer.capacity) {
      throw new Error('Not enough capacity');
    }

    // Update QR payload
    const qrPayload: QRPayload = {
      pid: registration.prayer_id,
      date: formatDate(new Date(registration.created_at)),
      ppl: people
    };

    return tx.registration.update({
      where: { id: registrationId },
      data: {
        people,
        qr_payload_text: JSON.stringify(qrPayload)
      }
    });
  });
}

export async function cancelRegistration(registrationId: string) {
  return prisma.registration.delete({
    where: { id: registrationId }
  });
}

export async function getRegistration(registrationId: string) {
  return prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      prayer: true
    }
  });
}

export async function getRegistrationsByPrayer(prayerId: string) {
  return prisma.registration.findMany({
    where: {
      prayer_id: prayerId,
      status: RegistrationStatus.CONFIRMED
    },
    orderBy: {
      created_at: 'asc'
    }
  });
}

