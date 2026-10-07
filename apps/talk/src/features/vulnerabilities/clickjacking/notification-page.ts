import type { NotificationSession } from './session'

export function notificationPage(session: NotificationSession): string {
  // В HTML попадают только серверный hex-токен и фиксированные строки, не ввод пользователя.
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Уведомления о входе | ЭТМ</title>
  <style>
    * { box-sizing: border-box; letter-spacing: 0; }
    body { margin: 0; font: 16px/1.4 Arial, sans-serif; background: #fff; color: #232b37; }
    main { position: relative; min-height: 240px; width: 100%; border-top: 4px solid #05358c; }
    .brand { position: absolute; top: 16px; left: 24px; color: #05358c; font-weight: bold; }
    h1 { position: absolute; top: 48px; left: 24px; right: 24px; margin: 0; font-size: 20px; }
    p { position: absolute; top: 100px; left: 24px; margin: 0; color: ${session.enabled ? '#00808f' : '#b42318'}; }
    button { position: absolute; top: 136px; left: 24px; width: calc(100% - 48px); height: 48px; padding: 0 8px; border: 0; border-radius: 4px; background: #05358c; color: #fff; font: 16px Arial, sans-serif; cursor: pointer; }
    button:disabled { background: #e8edf5; color: #647084; cursor: default; }
    a { position: absolute; top: 204px; left: 24px; color: #05358c; font-size: 14px; }
  </style>
</head>
<body><main>
  <span class="brand">ЭТМ / Личный кабинет</span>
  <h1>Уведомления о входе</h1>
  <p role="status">${session.enabled ? 'Включены' : 'Отключены'}</p>
  <form method="post" action="/site/notifications/action">
    <input type="hidden" name="csrfToken" value="${session.csrfToken}">
    <button type="submit" ${session.enabled ? '' : 'disabled'}>Отключить уведомления</button>
  </form>
  <a href="/site/notifications" target="_top">Вернуться в профиль</a>
</main></body>
</html>`
}
