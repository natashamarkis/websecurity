import { cookies } from 'next/headers';

import { db, type User } from '@/lib/db';

export const SESSION_COOKIE = 'session-id';

export async function getSessionId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function getCurrentUser(): Promise<User | null> {
  const sid = await getSessionId();
  if (!sid) return null;
  const login = db.sessions.get(sid);
  if (!login) return null;
  return db.users.find((u) => u.login === login) ?? null;
}

export function publicUser(user: User) {
  return { login: user.login, fio: user.fio, org: user.org };
}
