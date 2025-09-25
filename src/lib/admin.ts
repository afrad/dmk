import { prisma } from './db';
import bcrypt from 'bcryptjs';

export async function createAdminUser(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 12);

  return prisma.adminUser.create({
    data: {
      email,
      password_hash: hashedPassword
    }
  });
}

export async function validateAdminCredentials(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({
    where: { email, active: true }
  });

  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return null;

  return {
    id: user.id,
    email: user.email
  };
}

export async function getAdminUser(id: string) {
  return prisma.adminUser.findUnique({
    where: { id, active: true },
    select: {
      id: true,
      email: true,
      created_at: true
    }
  });
}