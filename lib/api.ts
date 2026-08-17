export interface SessionUser {
  login: string;
  fio: string;
  org: { name: string; inn: string; kpp: string };
}

export async function apiSession(): Promise<SessionUser | null> {
  const r = await fetch('/api/auth/session', { credentials: 'include' });
  const d = await r.json();
  return (d.user as SessionUser | null) ?? null;
}

export async function apiLogin(
  login: string,
  password: string,
): Promise<SessionUser> {
  const r = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ login, password }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error ?? 'Ошибка входа');
  return d.user as SessionUser;
}

export async function apiLogout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}
