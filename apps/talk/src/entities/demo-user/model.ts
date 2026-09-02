/** «Залогиненный» пользователь демо-сайта. Жертва по сценарию — это он. */
export const demoUser = {
  id: 'u-1',
  name: 'Алекс',
  email: 'alex@example.com',
  role: 'user',
} as const

/** «Секретная» сессионная cookie жертвы — то, что атакующий пытается украсть в XSS-демо. */
export const DEMO_SESSION_COOKIE = 'session'
export const DEMO_SESSION_VALUE = 'sess_alex_7f3a9c'
