# iPRO Security Demo

Учебное **намеренно уязвимое** веб-приложение в стилистике внутреннего продукта
**iPRO OneTeam**. Показывает сотрудникам, как выглядят и как эксплуатируются
типовые веб-уязвимости — на узнаваемых экранах и по реальным паттернам кода.

> ⚠️ **Только для локального обучения.** Приложение содержит уязвимости
> специально. **Не деплоить в интернет, не использовать в проде.**

---

## Быстрый старт

Нужен Node.js ≥ 18. Никаких VPN, hosts-правок, Docker-прокси и приватных пакетов.

```bash
npm install
npm run dev
```

Откройте **http://localhost:3000** (используйте Chrome — демо CSRF/сессии
полагается на поведение куки на localhost).

Тестовый аккаунт: **ivanov** / **qwerty123** (есть и другие, сид генерируется
при старте).

---

## Что внутри

- **Главная (`/`)** — вики уязвимостей: по каждой карточке «что это → где у нас
  → как абузить → payload в один клик → impact → как чинить → живой пример».
- **4 экрана-двойника** в стиле iPRO OneTeam, каждый несёт реальную уязвимость.

| Экран | Маршрут | Уязвимость |
|---|---|---|
| Вход | `/login` | **Open Redirect** (`returnUrl` → `window.location.assign`) |
| Заказы | `/orders` | **Reflected XSS** (эхо фильтра через `dangerouslySetInnerHTML`) |
| Факторинг | `/factoring`, `/factoring/[uuid]` | **IDOR** + **CSRF** (нет проверки владельца и CSRF-токена) |
| База знаний | `/knowledge-base` | **Stored XSS** + **DOM XSS** (тело статьи и комментарии как сырой HTML) |

Сквозная связка: кука `session-id` **не HttpOnly**, поэтому XSS в «Базе знаний»
крадёт живую сессию.

---

## Сценарии для демонстрации

1. **Reflected XSS** — `/orders`, в поиск: `<img src=x onerror=alert(document.domain)>`
2. **Stored XSS** — `/knowledge-base` → открыть статью → комментарий:
   `<img src=x onerror="alert('Сессия: '+document.cookie)">` → переоткрыть статью.
3. **IDOR** — `/factoring` → «Все заявки» → открыть чужую (или поменять `uuid` в URL).
4. **CSRF** — на странице заявки «Сформировать CSRF-PoC» (или открыть
   `public/csrf-poc.html` с диска через `file://` для настоящего кросс-сайта).
5. **Open Redirect** — `/login?returnUrl=https://example.com` → войти.

Подробные шаги — в вики на главной и в [`docs/demo/`](docs/demo/).

---

## Структура

```
app/
  page.tsx              # вики уязвимостей (главная)
  login/                # экран входа (open redirect)
  (app)/                # аутентифицированный каркас (header + sider)
    orders/             # Заказы (reflected XSS)
    factoring/          # Факторинг: список + [uuid] (IDOR + CSRF)
    knowledge-base/     # База знаний (stored/DOM XSS)
  api/                  # намеренно уязвимые route handlers («бэкенд»)
components/             # Logo, AppHeader, AppSider, VulnBadge, PayloadCopy
lib/                    # db (in-memory seed), session, theme, api, wiki
styles/                # ETM-токены + globals
public/csrf-poc.html   # PoC-страница «атакующего»
docs/                  # security-guide (теория), demo, plans (дизайн)
```

## Технологии

Next.js (App Router) · TypeScript · Ant Design 5 · SCSS · in-memory seed
(`@faker-js/faker`). Никаких приватных `@etm/*` пакетов и внешних API.

## Материалы для Tech Talk

- **Вики на главной** — готовые карточки уязвимостей с payload'ами.
- [`docs/security-guide/`](docs/security-guide/) — углублённая теория (9 модулей).
- [`docs/plans/2026-08-17-ipro-security-demo-design.md`](docs/plans/2026-08-17-ipro-security-demo-design.md) — дизайн проекта.

> Точный бренд-цвет/лого ETM — плейсхолдер в `lib/theme.ts` (меняется одной строкой).
