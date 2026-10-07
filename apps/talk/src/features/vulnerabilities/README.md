# Модули уязвимостей

Одна папка на каждую тему презентации. Сейчас реализованы XSS, CSRF, зависимости и сторонние скрипты;
остальные папки обозначают место будущих модулей, без запуска атак и кода-заглушек.

| Папка | Тема | Статус |
| --- | --- | --- |
| [xss](xss) | Stored XSS | Демо и исправление |
| [csrf](csrf) | CSRF | Демо и серверная защита токеном |
| [dependencies](dependencies) | Уязвимые npm-зависимости | Две версии учебной библиотеки и демо товара |
| [third-party-scripts](third-party-scripts) | Сторонние скрипты / Magecart | Подмена аналитики, локальный получатель и SRI |
| [open-redirects](open-redirects) | Open Redirects | Только теория |
| [clickjacking](clickjacking) | Clickjacking | Только теория |
| [prototype-pollution](prototype-pollution) | Prototype Pollution | Только теория |
| [ssrf](ssrf) | SSRF | Только теория |
| [sessions](sessions) | Session Management | Только теория |
| [sql-injection](sql-injection) | SQL Injection | Только теория |
| [brute-force](brute-force) | Brute Force / Credential Stuffing | Только теория |
| [file-download](file-download) | Insecure File Download | Только теория |

## Пара реализаций

Уязвимый компонент и его исправление лежат рядом: `XssInject.tsx` и
`FixedXssInject.tsx`. Форма, сборка демо и тесты находятся в той же папке `xss`.
Общую форму и состояние не дублируем; меняется только реализация уязвимого участка.

В `xss/CommentsBoard.tsx` режим из cookie `demo-mode` выбирает компонент напрямую:

```tsx
const vulnerable = mode === 'vulnerable'

{vulnerable ? <XssInject text={c.text} /> : <FixedXssInject text={c.text} />}
```

Для будущих UI-демо используем такую же пару `<Name>.tsx` / `Fixed<Name>.tsx`.
Серверные темы получают соседние `<name>.ts` / `fixed-<name>.ts` с общей сигнатурой;
серверный код не импортируем в клиентские компоненты. Реализации добавляем вместе
со сценарием, тестами и маршрутом демо, а не пустыми компонентами.

Инфраструктура режима, учебные данные, cookie и HTTP-заголовки остаются общими
в `shared/lib`; Next.js API-маршруты остаются в `app/api`. Слайды с кодом ссылаются
на реальные файлы пары относительно `apps/talk/src`.
