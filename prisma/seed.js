const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('d200m300k', 12);

  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@dmk-bs.de' },
    update: {
      password_hash: hashedPassword
    },
    create: {
      email: 'admin@dmk-bs.de',
      password_hash: hashedPassword,
      active: true
    }
  });

  console.log('👤 Created admin user:', admin.email);

  // Create prayer slots for upcoming Fridays
  const now = new Date();
  const prayers = [];

  // Get next 4 Fridays
  for (let i = 0; i < 4; i++) {
    const nextFriday = new Date();
    const daysUntilFriday = (5 - nextFriday.getDay() + 7) % 7 || 7; // 5 is Friday, 0 is Sunday
    nextFriday.setDate(nextFriday.getDate() + daysUntilFriday + (i * 7));
    nextFriday.setHours(13, 30, 0, 0); // 1:30 PM

    const prayer = await prisma.prayer.create({
      data: {
        title: `Friday Prayer - Week ${i + 1}`,
        datetime: nextFriday,
        capacity: 150,
        location: 'Main Prayer Hall',
        notes: 'Please arrive 15 minutes early',
        active: i === 0, // Only first one manually active
        auto_activation: true
      }
    });

    prayers.push(prayer);
    console.log(`🕌 Created prayer: ${prayer.title} at ${prayer.datetime}`);
  }

  // Add some past prayers for testing
  const pastPrayer = await prisma.prayer.create({
    data: {
      title: 'Previous Friday Prayer',
      datetime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Last week
      capacity: 100,
      location: 'Main Prayer Hall',
      notes: 'Past event for testing',
      active: false,
      auto_activation: true
    }
  });

  console.log(`🕌 Created past prayer: ${pastPrayer.title}`);

  // Create some sample registrations for the first prayer
  const deviceKeys = ['device-1', 'device-2', 'device-3'];

  for (let i = 0; i < deviceKeys.length; i++) {
    const registration = await prisma.registration.create({
      data: {
        prayer_id: prayers[0].id,
        people: Math.floor(Math.random() * 3) + 1, // 1-3 people
        device_key: deviceKeys[i],
        lang: ['en', 'de', 'ar'][i],
        qr_payload_text: JSON.stringify({
          pid: prayers[0].id,
          date: new Date().toISOString().split('T')[0],
          ppl: Math.floor(Math.random() * 3) + 1
        })
      }
    });

    console.log(`📝 Created registration: ${registration.id} for ${registration.people} people`);
  }

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });