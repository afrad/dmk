import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-super-secret-key-change-in-production';

export interface AdminSession {
  id: string;
  email: string;
}

export function signJWT(payload: AdminSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyJWT(token: string): AdminSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminSession;
  } catch {
    return null;
  }
}

export function getAuthSession(request: NextRequest): AdminSession | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  return verifyJWT(token);
}

export function requireAuth(request: NextRequest): AdminSession {
  const session = getAuthSession(request);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}