# Дизайн: платформа техталка по frontend-безопасности

Дата: 2026-09-02. Исторический проект платформы, часть возможностей не реализована.
Актуальное состояние и запуск описаны в [README](../../README.md), программа по
`Cybersecurity.pptx` и отличия от этого проекта: [программа доклада](../talk-scope.md).

## Цель

Одно приложение, в котором идёт презентация и из которого одним нажатием открывается
«живой» сайт с уязвимостью. Сценарий модуля: **сначала демо, потом объяснение** —
заходим на сайт, ломаем, возвращаемся к слайдам, объясняем и показываем фикс.

Список уязвимостей берётся из `docs/security-guide/`: XSS, CSRF, data exposure,
supply chain, clickjacking, open redirect, prototype pollution, SSRF, session management.

## Ограничения (заданы владельцем)

- Стек: Next.js (App Router, SSR) + React + TypeScript + Ant Design.
- Свои компоненты не пишем. Дизайн меняем только через тему antd (`ConfigProvider`).
  Если компонент нужен, это обёртка над antd в отдельном файле.
- Архитектура: FSD + atomic design.
- Слайды описываются в JSON и лежат в git; добавление/удаление слайда = правка JSON.

## Принятые решения

| Вопрос | Решение |
|---|---|
| Сколько приложений | Гибрид: `apps/talk` (слайды + демо-сайт) и `apps/evil` (сайт злоумышленника на другом origin) |
| Формат слайдов | React-слайды на antd, рендерятся из JSON |
| Порядок в модуле | Демо → объяснение → фикс → повтор демо в режиме `fixed` |
| Типы слайдов | `title`, `bullets`, `code`, `story`, `demo`, `checklist`, `two-columns`, `timeline` |
| Визуальная граница | Две темы antd (тёмная для слайдов, светлая для сайта) + рамка-браузер |
| Переключение vulnerable/fixed | Cookie `demo-mode`, тумблер в тулбаре рамки, читается и на сервере, и на клиенте |

## 1. Структура репозитория

```
websecurity/
  apps/
    talk/          # Next.js: презентация + демо-сайт
    evil/          # статичный сайт злоумышленника, отдельный порт (3666, evil.localhost)
  packages/
    slides-schema/ # zod-схема JSON-слайдов + типы, общая для talk и CI-валидации
  content/
    slides/        # JSON-слайды: index.json + один файл на модуль (01-xss.json, ...)
  docs/            # материалы гайда, не трогаем
  package.json     # pnpm workspaces
```

### apps/talk — FSD + atomic design

```
src/
  app/                # Next App Router: layouts, providers (antd ConfigProvider), роуты
    (talk)/talk/[module]/[slide]/page.tsx
    (site)/site/...   # демо-сайт: своя тема, layout с рамкой-браузера
    api/...           # уязвимые и исправленные API-роуты
  pages-layer/        # FSD "pages" (имя выбрано, чтобы не конфликтовать с Next `pages/`)
  widgets/            # SlideDeck, BrowserFrame, PresenterBar, SiteHeader
  features/           # slide-navigation, demo-mode-toggle, demo-transition, vuln-<name>
  entities/           # slide, module, demo-user и сущности демо-сайта
  shared/
    ui/               # ТОЛЬКО обёртки над antd: atoms/ molecules/ organisms/
    theme/            # talkTheme.ts, siteTheme.ts (antd ThemeConfig)
    lib/              # cookies, demoMode, highlight
    config/
```

Atomic внутри `shared/ui`: atom = один antd-компонент с пресетом пропсов; molecule = 2–3 atom;
organism = составной блок без бизнес-логики. Слои выше `shared` используют только эти
обёртки и голый antd.

## 2. JSON-схема слайдов

Один файл на модуль в `content/slides/`, порядок модулей в `content/slides/index.json`.

```jsonc
{
  "id": "xss",
  "title": "Cross-Site Scripting",
  "meta": { "cwe": "CWE-79", "cvss": "6.1–9.6", "owasp": "A03:2021" },
  "slides": [
    { "type": "title",   "title": "XSS", "subtitle": "Одна строка — $230M", "notes": "…" },
    { "type": "demo",    "route": "/site/comments", "mode": "vulnerable",
      "caption": "Оставим комментарий…", "payload": "<img src=x onerror=alert(document.cookie)>",
      "evilPage": "xss-collector.html" },
    { "type": "bullets", "title": "Что произошло", "items": ["…"], "image": "/img/xss-flow.svg" },
    { "type": "story",   "quote": "380 000 карт. $230M штрафа.", "source": "British Airways, 2018" },
    { "type": "timeline", "title": "Хронология атаки", "steps": [{ "title": "…", "text": "…" }] },
    { "type": "two-columns", "title": "До / после",
      "left":  { "title": "Уязвимо",   "body": "…" },
      "right": { "title": "Исправлено", "body": "…" } },
    { "type": "code",    "title": "Фикс", "lang": "tsx",
      "vulnerable": { "file": "features/vuln-xss/render.vulnerable.tsx" },
      "fixed":      { "file": "features/vuln-xss/render.fixed.tsx" } },
    { "type": "demo",    "route": "/site/comments", "mode": "fixed", "caption": "Тот же payload — не работает" },
    { "type": "checklist", "title": "Чеклист", "items": ["…"] }
  ]
}
```

- `code` ссылается на **реальные файлы** демо, а не дублирует код. При сборке содержимое
  читается с диска и подсвечивается (shiki на сервере, результат вставляется в antd `Typography`).
- Схема в `packages/slides-schema` на zod. `pnpm validate:slides` в CI отклоняет битый JSON
  и несуществующие файлы в `code`.
- `notes` есть у любого слайда, видно только в режиме докладчика.
- `body` в `two-columns` и `story` — markdown-подмножество: жирный, код, списки.

## 3. Навигация и переход на демо

**Роуты:** `/talk` — обложка с сеткой модулей; `/talk/<module>/<n>` — слайд. Позиция в URL,
поэтому работают прямые ссылки и «продолжить с этого места».

**Хоткеи** (фича `slide-navigation`):

| Клавиша | Действие |
|---|---|
| `→` `Space` / `←` | следующий / предыдущий слайд, на границе модуля переходит в соседний модуль |
| `Enter` на слайде `demo` | открыть демо |
| `Esc` в демо | вернуться на слайд, с которого ушли |
| `N` | заметки докладчика (antd `Drawer` снизу) |
| `G` | сетка всех слайдов |
| `F` | fullscreen |

**Переход «слайд → сайт»** (widget `BrowserFrame` + фича `demo-transition`):

1. По `Enter` поверх слайда появляется маленькая рамка браузера с адресной строкой, в которой
   печатается URL демо; слайд под ней размывается и темнеет.
2. Рамка за ~500 мс расширяется на весь экран, внутри монтируется демо-сайт в светлой теме.
   Реализация: `router.push('/site/…')` + View Transitions API, fallback на CSS-transition.
3. Тулбар рамки: адрес, бейдж origin, тумблер `vulnerable / fixed` (cookie `demo-mode` +
   `router.refresh()`), кнопка «payload» (копирует payload слайда), кнопка «открыть evil»
   (если у слайда есть `evilPage`), кнопка «сбросить данные», кнопка «← к слайду».
4. Обратно: `Esc` или кнопка — рамка сжимается и растворяется, показывается слайд,
   с которого ушли (номер в `sessionStorage`).

Внутри рамки не показываем ничего, что выдаёт презентацию: тулбар выглядит как часть «браузера».

## 4. Демо-сайт, evil и режимы

**Демо-сайт** (`/site/*`) в route group `(site)` со своим layout: тема `siteTheme`, шапка,
«залогиненный» демо-пользователь. Идея сайта (банк / соцсеть) выбирается позже, каркас от неё
не зависит. Каждая уязвимость — фича `features/vuln-<name>/` с парой `*.vulnerable.ts` /
`*.fixed.ts` и точкой выбора:

```ts
// shared/lib/demoMode.ts
export const pick = <T>(vulnerable: T, fixed: T) =>
  getDemoMode() === 'fixed' ? fixed : vulnerable
```

`getDemoMode()` читает cookie `demo-mode` на сервере через `cookies()`, на клиенте через
`document.cookie`. SSR, API-роуты и клиентские компоненты выбирают ветку одинаково.
По умолчанию `vulnerable`.

**Данные:** in-memory-стор в процессе Next + кнопка «сбросить» в тулбаре. Без БД.

**Заголовки безопасности** ставятся в `middleware.ts` только для `/site/*` и только в режиме
`fixed`: CSP, `X-Frame-Options`, `SameSite` у cookie. В `vulnerable` их нет — это и есть демо
для clickjacking и CSRF.

**apps/evil:** статичный html на порту 3666 (`evil.localhost`), без фреймворка. Одна страница
на атаку: `csrf.html`, `clickjacking.html`, `redirect.html`, `xss-collector.html` + крошечный
Node-сервер, который логирует украденные cookie и показывает их на странице.
`docs/demo/csrf-poc.html` переезжает сюда.

**Тесты:**
- zod-валидация слайдов в CI;
- Playwright-смоук на каждый модуль: открыть демо, применить payload, проверить эффект
  в `vulnerable` и его отсутствие в `fixed`.

## Открытые вопросы

- Идея демо-сайта (банк / соцсеть / корпоративный портал) — решить перед реализацией
  фич уязвимостей, на каркас не влияет.
- Библиотека подсветки кода (shiki предпочтительно, серверный рендер).
