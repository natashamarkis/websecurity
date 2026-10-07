# CSRF

- `change-delivery.ts`: уязвимое изменение адреса по сессии, без проверки намерения.
- `fixed-change-delivery.ts`: та же операция после проверки токена сессии.
- `session.ts`: изолированное состояние учебного профиля, случайная сессия и токен.
- `DeliveryProfile.tsx`: обычная форма профиля, результат запросов и ссылка на акцию.
- `attacker.html`: поддельная форма без токена, обслуживается отдельным сервером.
- `delivery.test.ts`: проверки сессии, токена, валидации и управляющих API.

Next.js-маршрут `/api/site/delivery` выбирает обработчик:

```ts
vulnerable ? changeDelivery(session, input) : fixedChangeDelivery(session, input)
```

Страница `/site/delivery`; теория `/talk/csrf/0`, код `/talk/csrf/1`, демо `/talk/csrf/2`.
`pnpm dev` из корня запускает основной сайт и отдельный сервер акции.
Подробности: [сценарий CSRF](../../../../../../docs/demo/csrf.md).
