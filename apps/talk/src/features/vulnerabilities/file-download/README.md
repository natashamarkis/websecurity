# Insecure File Download: IDOR и Path Traversal

Слайды: `/talk/file-download/0`. Демо: `/site/backend/file-download`.

- `get-document.ts`: уязвимая реализация на сервере.
- `fixed-get-document.ts`: исправление с той же сигнатурой.
- `server.ts`: проверка формы и переключение реализации по серверной cookie.
- Компонент `*Demo.tsx`: форма и отображение настоящего ответа API.
- `*.test.ts`: проверки механизма и границ защиты.

Вторая пара: `read-download.ts` / `fixed-read-download.ts` для Path Traversal.

Оболочка лаборатории: `features/backend-lab`. Она изолирует зрителей,
ограничивает входные данные и сбрасывает состояние. Она не является показанным исправлением.

Сценарий и ограничения: [руководство](../../../../../../docs/demo/file-download.md).
