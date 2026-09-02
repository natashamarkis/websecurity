# План реализации: платформа техталка по frontend-безопасности

> **Для Claude:** ОБЯЗАТЕЛЬНЫЙ САБ-СКИЛЛ: используй superpowers:executing-plans, чтобы выполнять этот план задача за задачей.

**Goal:** Собрать приложение, в котором идёт презентация на antd-слайдах из JSON и одним нажатием происходит плавный переход на «живой» демо-сайт с уязвимостью, переключаемой между `vulnerable` и `fixed`.

**Методология (зачем это всё):** платформа учит людей **предотвращать** атаки. Каждый модуль ведёт зрителя по одному маршруту: **демо (сломали) → разбор (что произошло) → фикс (как чинить) → повтор демо в режиме `fixed` (доказали, что защита работает)**. Слайд-«чеклист» в конце модуля — это переносимое правило, которое зритель применит в своём коде.

**Architecture:** Монорепозиторий на pnpm workspaces. `apps/talk` — Next.js (App Router, SSR): презентация в route group `(talk)` и демо-сайт в `(site)`, две темы antd, переход через рамку-браузер и View Transitions. `apps/evil` — статический сайт злоумышленника на другом origin. `packages/slides-schema` — zod-схема JSON-слайдов, общая для приложения и CI. Слайды — JSON в `content/slides/`. FSD + atomic design внутри `apps/talk/src`.

**Tech Stack:** Node 24, pnpm (через corepack), Next.js 16, React 19.2, TypeScript 5.9, Ant Design 6, `@ant-design/nextjs-registry`, zod 4, shiki 4 (подсветка кода на сервере), vitest 4 (юниты + валидация слайдов), Playwright (смоук демо).

**Важные особенности версий (проверено 2026-09-02):**
- Next.js 16 переименовал `middleware.ts` → **`proxy.ts`** (экспорт функции `proxy`). Использовать `proxy.ts`.
- `cookies()` из `next/headers` **асинхронный**: `const store = await cookies()`.
- View Transitions в Next 16 работают **без конфига** (React 19.2). Компонент `ViewTransition` импортируется из `react`. Навигация роутера автоматически оборачивается в transition.
- antd v6 в App Router: обернуть в `<AntdRegistry>` из `@ant-design/nextjs-registry`, тему задавать через `ConfigProvider theme={{ algorithm, token, components }}`.
- Пиновать TypeScript **5.9.x** (не 7.x — это native-preview, несовместимо с частью тулинга).

---

## Соглашения

- **Только antd.** Свои компоненты — только обёртки над antd в отдельных файлах внутри `shared/ui/{atoms,molecules,organisms}`. Дизайн — только через тему (`ConfigProvider`).
- **FSD слои** (внутри `apps/talk/src`): `app` → `pages-layer` → `widgets` → `features` → `entities` → `shared`. Импорт только «вниз» по слоям.
- **TDD.** Для каждой задачи: сначала падающий тест, запуск (убедиться, что падает), минимальная реализация, запуск (зелёный), коммит.
- **Коммиты** частые, по задаче. Один коммит = одна завершённая задача.
- Все команды запускать из корня репозитория, если не сказано иное.

---

## Фаза 0. Инструменты и монорепо

### Task 0.1: Включить pnpm и инициализировать workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.npmrc`
- Create: `.nvmrc`

**Step 1:** Включить corepack и pnpm:

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v   # ожидаем 9.x+
```

**Step 2:** Создать корневой `package.json`:

```json
{
  "name": "websecurity",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "engines": { "node": ">=20.9.0" },
  "scripts": {
    "dev": "pnpm --filter @ws/talk dev",
    "dev:evil": "pnpm --filter @ws/evil dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "validate:slides": "pnpm --filter @ws/slides-schema validate",
    "e2e": "pnpm --filter @ws/talk e2e"
  }
}
```

**Step 3:** `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Step 4:** `.npmrc`:

```
shamefully-hoist=false
strict-peer-dependencies=false
```

**Step 5:** `.nvmrc` с содержимым `24`.

**Step 6:** Обновить корневой `.gitignore` (добавить, не удаляя существующее): `node_modules/`, `.next/`, `dist/`, `*.tsbuildinfo`, `.turbo/`, `test-results/`, `playwright-report/`, `.env*`.

**Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml .npmrc .nvmrc .gitignore
git commit -m "chore: init pnpm monorepo workspace"
```

### Task 0.2: Общий tsconfig и ESLint база

**Files:**
- Create: `tsconfig.base.json`
- Create: `eslint.config.mjs` (flat config, для всей репы)

**Step 1:** `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "jsx": "preserve"
  }
}
```

**Step 2:** Установить TS в корень: `pnpm add -Dw typescript@5.9.3 eslint@9 @eslint/js typescript-eslint`.

**Step 3:** Минимальный flat `eslint.config.mjs` с `@eslint/js` recommended + `typescript-eslint` recommended, игнор `**/.next`, `**/dist`.

**Step 4: Commit**

```bash
git add tsconfig.base.json eslint.config.mjs package.json pnpm-lock.yaml
git commit -m "chore: shared tsconfig + eslint flat config"
```

---

## Фаза 1. Пакет схемы слайдов (`packages/slides-schema`)

Это фундамент: типы слайдов и валидатор нужны и приложению, и CI. Делаем первым и на TDD.

### Task 1.1: Каркас пакета

**Files:**
- Create: `packages/slides-schema/package.json`
- Create: `packages/slides-schema/tsconfig.json`
- Create: `packages/slides-schema/vitest.config.ts`
- Create: `packages/slides-schema/src/index.ts` (пустой экспорт-заглушка)

**Step 1:** `package.json`:

```json
{
  "name": "@ws/slides-schema",
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "validate": "tsx src/validate-cli.ts"
  },
  "dependencies": { "zod": "^4.5.4" },
  "devDependencies": { "vitest": "^4.1.11", "tsx": "^4.19.0" }
}
```

**Step 2:** `tsconfig.json` extends `../../tsconfig.base.json`, `include: ["src"]`.

**Step 3:** `vitest.config.ts` минимальный (`test: { environment: 'node' }`).

**Step 4:** `pnpm install` из корня.

**Step 5: Commit** — `chore(slides-schema): package scaffold`.

### Task 1.2: Схема слайдов (TDD)

**Files:**
- Create: `packages/slides-schema/src/schema.ts`
- Test: `packages/slides-schema/src/schema.test.ts`
- Modify: `packages/slides-schema/src/index.ts`

**Step 1: Написать падающий тест** `schema.test.ts`. Он проверяет, что валидная разметка каждого из 8 типов проходит, а битая — падает:

```ts
import { describe, it, expect } from 'vitest'
import { ModuleSchema, SlideSchema } from './schema'

describe('SlideSchema', () => {
  it('accepts a title slide', () => {
    expect(() => SlideSchema.parse({ type: 'title', title: 'XSS' })).not.toThrow()
  })
  it('accepts a demo slide with mode and route', () => {
    expect(() =>
      SlideSchema.parse({ type: 'demo', route: '/site/comments', mode: 'vulnerable' }),
    ).not.toThrow()
  })
  it('rejects a demo slide with bad mode', () => {
    expect(() =>
      SlideSchema.parse({ type: 'demo', route: '/x', mode: 'nope' }),
    ).toThrow()
  })
  it('accepts a code slide referencing files', () => {
    expect(() =>
      SlideSchema.parse({
        type: 'code', lang: 'tsx',
        vulnerable: { file: 'features/vuln-xss/render.vulnerable.tsx' },
        fixed: { file: 'features/vuln-xss/render.fixed.tsx' },
      }),
    ).not.toThrow()
  })
  it('accepts two-columns and timeline', () => {
    expect(() => SlideSchema.parse({
      type: 'two-columns', title: 'До/после',
      left: { title: 'A', body: 'a' }, right: { title: 'B', body: 'b' },
    })).not.toThrow()
    expect(() => SlideSchema.parse({
      type: 'timeline', title: 'Хронология',
      steps: [{ title: 's1', text: 't1' }],
    })).not.toThrow()
  })
})

describe('ModuleSchema', () => {
  it('accepts a full module', () => {
    expect(() => ModuleSchema.parse({
      id: 'xss', title: 'XSS',
      meta: { cwe: 'CWE-79', cvss: '6.1', owasp: 'A03:2021' },
      slides: [{ type: 'title', title: 'XSS' }],
    })).not.toThrow()
  })
  it('rejects a module with empty slides', () => {
    expect(() => ModuleSchema.parse({ id: 'x', title: 'X', slides: [] })).toThrow()
  })
})
```

**Step 2: Запустить, убедиться что падает**

```bash
pnpm --filter @ws/slides-schema test
```
Ожидаем FAIL: `Cannot find module './schema'`.

**Step 3: Реализовать `schema.ts`.** Дискриминированное объединение по `type`, поле `notes: z.string().optional()` в общей базе (через `.extend` или spread). Типы: `title`, `bullets`, `code`, `story`, `demo`, `checklist`, `two-columns`, `timeline`. Экспортировать выведенные типы: `export type Slide = z.infer<typeof SlideSchema>` и `Module`, `SlideType`.

Ключевые поля (минимум):
- `title`: `title`, `subtitle?`, `moduleNo?`
- `bullets`: `title`, `items: string[].min(1)`, `image?`
- `code`: `title?`, `lang`, `vulnerable: {file}`, `fixed?: {file}`
- `story`: `quote`, `source?`
- `demo`: `route`, `mode: 'vulnerable'|'fixed'`, `caption?`, `payload?`, `evilPage?`
- `checklist`: `title`, `items: string[].min(1)`
- `two-columns`: `title`, `left:{title,body}`, `right:{title,body}`
- `timeline`: `title`, `steps: {title,text}[].min(1)`
- База (все): `notes?`

`ModuleSchema`: `id`, `title`, `meta?: {cwe?,cvss?,owasp?}`, `slides: SlideSchema.array().min(1)`.

**Step 4: Запустить, убедиться что зелёно**

```bash
pnpm --filter @ws/slides-schema test
```

**Step 5:** Реэкспорт из `index.ts`: `export * from './schema'`.

**Step 6: Commit** — `feat(slides-schema): zod schema for slide/module types`.

### Task 1.3: CLI-валидатор контента (TDD)

**Files:**
- Create: `packages/slides-schema/src/validate.ts` (чистая функция)
- Test: `packages/slides-schema/src/validate.test.ts`
- Create: `packages/slides-schema/src/validate-cli.ts` (обёртка над функцией, читает `content/slides`)

**Step 1: Падающий тест** для `validateModules(modules: unknown[])`: возвращает `{ ok: true }` для валидного набора и `{ ok: false, errors: [...] }` для битого (с указанием id модуля и индекса слайда).

**Step 2:** Запуск — FAIL.

**Step 3:** Реализовать `validate.ts`: маппит массив через `ModuleSchema.safeParse`, собирает ошибки в читаемый список. Пока **без** проверки существования файлов из `code.file` (её добавим в Task 5.3, когда появятся файлы фич).

**Step 4:** Запуск — PASS.

**Step 5:** `validate-cli.ts`: читает `content/slides/index.json` (список файлов), грузит каждый JSON, зовёт `validateModules`, печатает результат, `process.exit(1)` при ошибке. Пока `content/` пуст → CLI должен корректно писать «no modules found» и выходить с 0.

**Step 6: Commit** — `feat(slides-schema): content validator + CLI`.

---

## Фаза 2. Каркас приложения `apps/talk`

### Task 2.1: Next.js + antd bootstrap

**Files:**
- Create: `apps/talk/package.json`
- Create: `apps/talk/tsconfig.json`
- Create: `apps/talk/next.config.ts`
- Create: `apps/talk/next-env.d.ts` (генерится Next)
- Create: `apps/talk/src/app/layout.tsx`
- Create: `apps/talk/src/app/page.tsx`

**Step 1:** `package.json`:

```json
{
  "name": "@ws/talk",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "e2e": "playwright test"
  },
  "dependencies": {
    "next": "^16.3.4",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "antd": "^6.6.2",
    "@ant-design/nextjs-registry": "^1.3.0",
    "@ws/slides-schema": "workspace:*",
    "shiki": "^4.4.3",
    "zod": "^4.5.4"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5.9.3",
    "vitest": "^4.1.11",
    "@vitejs/plugin-react": "^4.3.0",
    "@testing-library/react": "^16.1.0",
    "jsdom": "^25.0.0",
    "@playwright/test": "^1.62.1"
  }
}
```

**Step 2:** `tsconfig.json` extends base, добавить `plugins: [{ name: 'next' }]`, `paths`: `@/*` → `./src/*`, `include` next-env + src, `moduleResolution: Bundler` уже в base.

**Step 3:** `next.config.ts`: `transpilePackages: ['@ws/slides-schema']`. (View transitions конфига не требуют.)

**Step 4:** `pnpm install` из корня.

**Step 5:** `layout.tsx` (root): `<html lang="ru">`, `<body>` оборачивает children в `<AntdRegistry>`. **Провайдер темы НЕ здесь** — темы разные для talk и site, их зададут вложенные layout'ы (Task 2.3 / 4.1).

**Step 6:** `page.tsx` (`/`): временный редирект на `/talk` (`redirect('/talk')` из `next/navigation`).

**Step 7:** Проверить запуск:

```bash
pnpm --filter @ws/talk dev
```
Открыть `http://localhost:3000` — не должно быть ошибок antd/SSR. Остановить.

**Step 8: Commit** — `feat(talk): next.js + antd app scaffold`.

### Task 2.2: Темы antd (talk / site)

**Files:**
- Create: `apps/talk/src/shared/theme/talkTheme.ts`
- Create: `apps/talk/src/shared/theme/siteTheme.ts`
- Create: `apps/talk/src/shared/theme/ThemeProvider.tsx` (клиентская обёртка над `ConfigProvider`)

**Step 1:** `talkTheme.ts` — `ThemeConfig`: `algorithm: theme.darkAlgorithm`, крупная типографика (`token.fontSize: 18`, увеличенные заголовки через `components.Typography`), акцентный `colorPrimary`. Экспорт `talkTheme: ThemeConfig`.

**Step 2:** `siteTheme.ts` — светлая «продуктовая» тема: `algorithm: theme.defaultAlgorithm`, нейтральный `colorPrimary`, обычные размеры. Экспорт `siteTheme`.

**Step 3:** `ThemeProvider.tsx` — `'use client'`, принимает `theme: ThemeConfig` и `children`, рендерит `<ConfigProvider theme={theme}>{children}</ConfigProvider>`. Локаль ru через `ConfigProvider locale={ruRU}`.

**Step 4:** Тест-дым (vitest + jsdom): рендер `ThemeProvider` с `talkTheme` и простым `<Button>` из antd не падает. Настроить `apps/talk/vitest.config.ts` (`environment: jsdom`, plugin-react).

**Step 5: Commit** — `feat(talk): antd talk/site themes + ThemeProvider`.

### Task 2.3: Route groups и layout'ы

**Files:**
- Create: `apps/talk/src/app/(talk)/layout.tsx`
- Create: `apps/talk/src/app/(talk)/talk/page.tsx` (обложка-заглушка)
- Create: `apps/talk/src/app/(site)/layout.tsx`

**Step 1:** `(talk)/layout.tsx` оборачивает children в `<ThemeProvider theme={talkTheme}>`.

**Step 2:** `(site)/layout.tsx` оборачивает в `<ThemeProvider theme={siteTheme}>`.

**Step 3:** `(talk)/talk/page.tsx` — заглушка «Обложка» (antd `Typography.Title`), позже станет сеткой модулей.

**Step 4:** Проверить `/talk` в dev — тёмная тема, заголовок виден.

**Step 5: Commit** — `feat(talk): (talk)/(site) route groups with themes`.

---

## Фаза 3. Контент и рендер слайдов

### Task 3.1: Загрузчик контента

**Files:**
- Create: `apps/talk/src/entities/slide/model/load-modules.ts`
- Create: `content/slides/index.json`
- Create: `content/slides/00-intro.json` (маленький валидный модуль для проверки)
- Test: `apps/talk/src/entities/slide/model/load-modules.test.ts`

**Step 1:** `content/slides/index.json`: `{ "modules": ["00-intro.json"] }`.

**Step 2:** `00-intro.json`: модуль `id: "intro"` с 2 слайдами (`title`, `bullets`).

**Step 3: Падающий тест** для `loadModules()`: читает index + файлы из `content/slides`, валидирует через `@ws/slides-schema`, возвращает `Module[]`; кидает понятную ошибку при провале валидации.

**Step 4:** Запуск — FAIL.

**Step 5:** Реализовать `load-modules.ts` через `node:fs/promises` + `path`, путь к `content/` резолвить от корня репы (`process.cwd()` в dev = `apps/talk`; вычислить корень через `path.resolve(process.cwd(), '../../content/slides')` или env). Указать способ явно и покрыть тестом.

**Step 6:** Запуск — PASS.

**Step 7: Commit** — `feat(talk): content loader + intro module`.

### Task 3.2: Обёртки antd (atoms/molecules) для слайдов

**Files (каждая — обёртка над antd, отдельный файл):**
- Create: `apps/talk/src/shared/ui/atoms/SlideTitle.tsx` (над `Typography.Title`)
- Create: `apps/talk/src/shared/ui/atoms/BadgeTag.tsx` (над `Tag`)
- Create: `apps/talk/src/shared/ui/molecules/BulletList.tsx` (над `List`)
- Create: `apps/talk/src/shared/ui/molecules/CodeBlock.tsx` (над `Typography` + подсветка, вход — готовый HTML от shiki)
- Create: `apps/talk/src/shared/ui/organisms/StepTimeline.tsx` (над `Timeline`)

**Step 1:** Реализовать обёртки с типизированными пропсами. Никакой бизнес-логики.

**Step 2:** Дым-тест на `BulletList` (рендерит все items) и `BadgeTag`.

**Step 3: Commit** — `feat(talk): antd ui wrappers for slides`.

### Task 3.3: Рендер слайда по типу (TDD)

**Files:**
- Create: `apps/talk/src/widgets/slide-view/SlideView.tsx`
- Create: `apps/talk/src/widgets/slide-view/renderers/` (по файлу на тип: `TitleSlide.tsx`, `BulletsSlide.tsx`, `StorySlide.tsx`, `TwoColumnsSlide.tsx`, `TimelineSlide.tsx`, `ChecklistSlide.tsx`, `CodeSlide.tsx`, `DemoSlide.tsx`)
- Test: `apps/talk/src/widgets/slide-view/SlideView.test.tsx`

**Step 1: Падающий тест:** `SlideView` c слайдом `{type:'title', title:'XSS'}` показывает "XSS"; со `{type:'bullets', items:['a','b']}` показывает оба пункта; с неизвестным типом рендерит фолбэк без падения.

**Step 2:** Запуск — FAIL.

**Step 3:** Реализовать `SlideView` как switch по `slide.type` → соответствующий renderer из `renderers/`. Каждый renderer использует обёртки из 3.2. `CodeSlide` пока показывает `vulnerable`-файл (подсветку прикрутим в 3.5). `DemoSlide` пока просто карточка с caption и кнопкой-заглушкой (интерактив — Фаза 4/6).

**Step 4:** Запуск — PASS.

**Step 5: Commit** — `feat(talk): SlideView renderers per slide type`.

### Task 3.4: Страница слайда и дека

**Files:**
- Create: `apps/talk/src/app/(talk)/talk/[module]/[slide]/page.tsx`
- Create: `apps/talk/src/widgets/slide-deck/SlideDeck.tsx`
- Create: `apps/talk/src/pages-layer/talk/TalkSlidePage.tsx`

**Step 1:** `page.tsx` (Server Component): `await` params, `loadModules()`, находит модуль по `[module]` и слайд по индексу `[slide]`, отдаёт в `TalkSlidePage`. 404 через `notFound()` при выходе за границы.

**Step 2:** `TalkSlidePage` компонует `SlideDeck` (обёртка с раскладкой центра слайда + место под прогресс) вокруг `SlideView`.

**Step 3:** Обновить `(talk)/talk/page.tsx` (обложку): сетка модулей из `loadModules()` на antd `Card`, ссылки на `/talk/<id>/0`.

**Step 4:** Проверить в dev: `/talk` → клик по модулю → `/talk/intro/0`, видно первый слайд; `/talk/intro/1` — второй.

**Step 5: Commit** — `feat(talk): slide route + deck + module grid cover`.

### Task 3.5: Подсветка кода через shiki (серверная)

**Files:**
- Create: `apps/talk/src/shared/lib/highlight.ts`
- Create: `apps/talk/src/features/code-view/read-code.ts` (читает файл фичи по `code.file` относительно `src/`)
- Modify: `renderers/CodeSlide.tsx`
- Test: `apps/talk/src/shared/lib/highlight.test.ts`

**Step 1: Падающий тест** для `highlight(code, lang)`: возвращает строку с `<pre` и подсвеченными токенами (проверить, что содержит `class` и исходный текст).

**Step 2:** Запуск — FAIL.

**Step 3:** Реализовать `highlight.ts` на shiki (`createHighlighter`, кэш инстанса на модуль). Тема кода — тёмная (`github-dark`), чтобы совпадала с темой talk.

**Step 4:** `read-code.ts`: безопасно читает файл из `src/` по относительному пути из `code.file`, запрещает выход за пределы `src/` (защита от `..`).

**Step 5:** `CodeSlide` (Server Component): читает `vulnerable` и, если есть, `fixed`; подсвечивает; показывает antd `Tabs` «Уязвимо / Исправлено» с готовым HTML в `CodeBlock`.

**Step 6:** Запуск теста highlight — PASS. Проверить `code`-слайд визуально (добавить временный `code`-слайд в intro-модуль, потом убрать).

**Step 7: Commit** — `feat(talk): shiki server-side code highlighting for code slides`.

---

## Фаза 4. Навигация, рамка-браузер, режим demo

### Task 4.1: demo-mode (cookie, сервер+клиент) — TDD

**Files:**
- Create: `apps/talk/src/shared/lib/demoMode.ts`
- Test: `apps/talk/src/shared/lib/demoMode.test.ts`

**Step 1: Падающий тест** для чистой функции `resolveMode(raw: string | undefined): 'vulnerable' | 'fixed'` (дефолт `vulnerable`; `'fixed'` только при точном совпадении) и `pick(vuln, fixed, mode)`.

**Step 2:** Запуск — FAIL.

**Step 3:** Реализовать: `resolveMode`, `pick`. Плюс `getServerMode()` (async, читает `await cookies()` → `demo-mode`) и `getClientMode()` (парсит `document.cookie`). Тестируем `resolveMode`/`pick`; серверную/клиентскую обёртки держим тонкими.

**Step 4:** Запуск — PASS.

**Step 5:** API-роут для переключения: `apps/talk/src/app/api/demo-mode/route.ts` (POST устанавливает cookie `demo-mode`, `SameSite=Lax`, `Path=/`).

**Step 6: Commit** — `feat(talk): demo-mode cookie resolver + toggle API`.

### Task 4.2: Хоткеи навигации

**Files:**
- Create: `apps/talk/src/features/slide-navigation/useSlideNavigation.ts`
- Create: `apps/talk/src/features/slide-navigation/NavigationController.tsx` (`'use client'`)
- Test: `apps/talk/src/features/slide-navigation/useSlideNavigation.test.tsx`

**Step 1: Падающий тест:** хук вычисляет next/prev маршрут по (модули, текущий module, index), корректно перескакивает границу модуля, не выходит за края.

**Step 2:** Запуск — FAIL.

**Step 3:** Реализовать хук (чистая логика вычисления маршрутов) + `NavigationController`, который вешает `keydown` (`→`/`Space`/`←`, `F` fullscreen) и зовёт `router.push`. `Enter`/`Esc` для демо добавим в 4.4.

**Step 4:** Запуск — PASS. Смонтировать `NavigationController` в `TalkSlidePage`. Проверить стрелки в dev.

**Step 5: Commit** — `feat(talk): keyboard slide navigation`.

### Task 4.3: BrowserFrame (widget)

**Files:**
- Create: `apps/talk/src/widgets/browser-frame/BrowserFrame.tsx` (`'use client'`)
- Create: `apps/talk/src/features/demo-mode-toggle/DemoModeToggle.tsx` (`'use client'`, antd `Segmented`/`Switch`)
- Test: `apps/talk/src/widgets/browser-frame/BrowserFrame.test.tsx`

**Step 1: Падающий тест:** `BrowserFrame` показывает переданный `url` в «адресной строке», origin-бейдж, кнопки тулбара (payload, reset, «к слайду»), и рендерит `children` в теле.

**Step 2:** Запуск — FAIL.

**Step 3:** Реализовать `BrowserFrame` на antd (`Card` с хедером-тулбаром: `Input` только для чтения с URL, `Tag` origin, кнопки `Button`, `DemoModeToggle`). Тумблер зовёт `/api/demo-mode` затем `router.refresh()`.

**Step 4:** Запуск — PASS.

**Step 5: Commit** — `feat(talk): BrowserFrame widget + demo-mode toggle`.

### Task 4.4: Переход слайд→сайт (View Transitions)

**Files:**
- Create: `apps/talk/src/features/demo-transition/DemoLauncher.tsx` (`'use client'`)
- Modify: `renderers/DemoSlide.tsx`
- Modify: `NavigationController.tsx` (Enter открывает демо, Esc возвращает)
- Create: `apps/talk/src/app/globals.css` (стили `::view-transition-*` + слой размытия слайда)

**Step 1:** `DemoSlide` показывает карточку с caption и `DemoLauncher` (кнопка «Показать»). `DemoLauncher` хранит целевой `route`/`mode`/`payload` и при активации: ставит cookie mode (fetch `/api/demo-mode`), пишет обратный слайд в `sessionStorage`, `router.push(route)` внутри `startTransition`.

**Step 2:** Обернуть контент слайда и контейнер сайта в `<ViewTransition>` (из `react`) с общим именем, чтобы получить morph. Задать CSS для `::view-transition-old/new` (fade+scale ~500ms).

**Step 3:** В `(site)/layout.tsx` обернуть контент в `BrowserFrame`, чтобы демо открывалось «в браузере». URL и origin брать из заголовков/`headers()`.

**Step 4:** `Esc` в `(site)` → `router.push` на сохранённый слайд.

**Step 5:** Ручная проверка в dev: со слайда `demo` по кнопке/Enter — плавно раскрывается рамка с сайтом; тумблер переключает режим; Esc возвращает на слайд. (Автотест перехода — в Playwright, Фаза 7.)

**Step 6: Commit** — `feat(talk): smooth slide→site transition via View Transitions + BrowserFrame`.

---

## Фаза 5. Демо-сайт и первый вертикальный срез (XSS)

> Идея продукта демо-сайта (банк/соцсеть) ещё не выбрана. Для первого среза берём **нейтральную страницу комментариев** `/site/comments` — она не зависит от выбора продукта и переиспользуется потом. Если к началу этой фазы продукт выбран, назвать страницу в его терминах.

### Task 5.1: Скелет демо-сайта

**Files:**
- Create: `apps/talk/src/app/(site)/site/page.tsx` (главная демо-сайта)
- Create: `apps/talk/src/widgets/site-header/SiteHeader.tsx`
- Create: `apps/talk/src/entities/demo-user/model.ts` (захардкоженный «залогиненный» пользователь)
- Create: `apps/talk/src/shared/lib/memory-store.ts` (in-memory стор + reset)

**Step 1:** `memory-store.ts`: модульный синглтон с массивом комментариев и `reset()`. Тест: `add` затем `reset` очищает.

**Step 2:** `SiteHeader` (antd `Layout.Header` обёртка), `demo-user` заглушка, `/site` — приветствие + навигация к `/site/comments`.

**Step 3:** API `/api/site/reset` (POST → `memory-store.reset()`), привязать к кнопке reset в `BrowserFrame`.

**Step 4: Commit** — `feat(site): demo site skeleton + in-memory store`.

### Task 5.2: Фича vuln-xss (vulnerable/fixed) — TDD

**Files:**
- Create: `apps/talk/src/features/vuln-xss/render.vulnerable.tsx`
- Create: `apps/talk/src/features/vuln-xss/render.fixed.tsx`
- Create: `apps/talk/src/features/vuln-xss/CommentsBoard.tsx`
- Create: `apps/talk/src/app/(site)/site/comments/page.tsx`
- Create: `apps/talk/src/app/api/site/comments/route.ts`
- Test: `apps/talk/src/features/vuln-xss/render.test.tsx`

**Step 1: Падающий тест:** `render.vulnerable` для строки `"<img src=x onerror=alert(1)>"` вставляет её как HTML (в разметке присутствует тег `img`); `render.fixed` выводит ту же строку как **текст** (тега `img` в DOM нет, есть текстовое содержимое). Это и есть сформулированная защита: экранирование вместо `dangerouslySetInnerHTML`.

**Step 2:** Запуск — FAIL.

**Step 3:** Реализовать: `render.vulnerable.tsx` использует `dangerouslySetInnerHTML` (намеренная уязвимость). `render.fixed.tsx` рендерит текст обычным JSX. `CommentsBoard` (server component) читает режим через `getServerMode()`, `pick(Vulnerable, Fixed)` и мапит комментарии из стора; форма постит на API. `route.ts` добавляет комментарий в `memory-store`.

**Step 4:** Запуск — PASS.

**Step 5:** Проверить в dev: в режиме vulnerable payload срабатывает (виден `alert`/эффект), в fixed — печатается как текст. Тот же URL, тот же payload.

**Step 6: Commit** — `feat(vuln-xss): stored XSS demo (vulnerable/fixed) on comments page`.

### Task 5.3: Заголовки безопасности через proxy.ts (fixed-режим)

**Files:**
- Create: `apps/talk/src/proxy.ts`
- Test: `apps/talk/src/proxy.test.ts` (юнит на чистую функцию построения заголовков)

**Step 1: Падающий тест** для `buildSecurityHeaders(mode)`: в `fixed` возвращает CSP, `X-Frame-Options: DENY`; в `vulnerable` — пусто.

**Step 2:** Запуск — FAIL.

**Step 3:** Реализовать чистую функцию + `proxy.ts` (экспорт `proxy`), которая на путях `/site/*` читает cookie `demo-mode` и вешает заголовки из функции. `config.matcher` = `/site/:path*`.

**Step 4:** Запуск теста — PASS. В dev проверить заголовки ответа `/site/comments` в обоих режимах (Network → Response Headers).

**Step 5:** Дополнить CLI-валидатор слайдов (Task 1.3) проверкой существования файлов `code.file` относительно `apps/talk/src`. Добавить падающий тест на несуществующий файл, реализовать, PASS.

**Step 6: Commit** — `feat(talk): security headers via proxy.ts in fixed mode; validate code.file paths`.

### Task 5.4: JSON-модуль XSS

**Files:**
- Create: `content/slides/01-xss.json`
- Modify: `content/slides/index.json`

**Step 1:** Собрать полный модуль по методологии: `title` → `demo`(vulnerable, route `/site/comments`, payload) → `bullets`(что произошло) → `story`(British Airways) → `timeline` → `two-columns`(до/после) → `code`(ссылки на `features/vuln-xss/render.vulnerable.tsx` и `render.fixed.tsx`) → `demo`(fixed) → `checklist`. Тексты — из `docs/security-guide/module/01-xss.md`.

**Step 2:** Добавить `01-xss.json` в `index.json`.

**Step 3:** `pnpm validate:slides` — зелено (включая проверку путей из 5.3).

**Step 4:** Пройти модуль в dev от начала до конца: демо ломается, фикс защищает, чеклист виден.

**Step 5: Commit** — `feat(content): full XSS module (demo → разбор → fix → proof)`.

---

## Фаза 6. Сайт злоумышленника `apps/evil`

### Task 6.1: Каркас evil

**Files:**
- Create: `apps/evil/package.json` (dev-сервер на другом порту, напр. `3666`)
- Create: `apps/evil/server.mjs` (крошечный статик-сервер + endpoint логирования украденных данных)
- Create: `apps/evil/public/index.html` (список атак)

**Step 1:** `package.json` со `scripts.dev` поднимающим `server.mjs` на 3666.

**Step 2:** `server.mjs` отдаёт `public/*` и имеет `POST /steal`, который логирует тело в консоль и хранит последнее в памяти; `GET /stolen` показывает собранное.

**Step 3: Commit** — `feat(evil): attacker site scaffold on separate origin`.

### Task 6.2: Страницы атак + связка со слайдами

**Files:**
- Create: `apps/evil/public/csrf.html` (перенести/адаптировать из `docs/demo/csrf-poc.html`)
- Create: `apps/evil/public/clickjacking.html`
- Create: `apps/evil/public/redirect.html`
- Create: `apps/evil/public/xss-collector.html`

**Step 1:** Реализовать страницы, бьющие в `http://localhost:3000/...` и отправляющие добытое на `/steal`.

**Step 2:** Убедиться, что кнопка «открыть evil» в `BrowserFrame` (по `slide.evilPage`) открывает нужную страницу в новой вкладке.

**Step 3:** Ручная проверка CSRF: evil-страница делает запрос к демо-сайту; в `vulnerable` проходит, в `fixed` (SameSite + заголовки) — нет.

**Step 4: Commit** — `feat(evil): CSRF/clickjacking/redirect/xss-collector pages`.

---

## Фаза 7. Качество: CI и e2e

### Task 7.1: Playwright смоук XSS-модуля

**Files:**
- Create: `apps/talk/playwright.config.ts`
- Create: `apps/talk/e2e/xss.spec.ts`

**Step 1:** Конфиг Playwright поднимает `next dev` (webServer) на 3000.

**Step 2:** Тест: открыть `/site/comments`, запостить payload; в `vulnerable` — проверить, что сработал (перехватить `dialog`/DOM-эффект); переключить режим на `fixed` (fetch `/api/demo-mode` или тумблер), повторить — payload как текст, диалога нет.

**Step 3:** Запуск `pnpm --filter @ws/talk e2e` — PASS.

**Step 4: Commit** — `test(e2e): XSS module vulnerable vs fixed smoke`.

### Task 7.2: CI (GitHub Actions)

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1:** Джоба: setup pnpm+node, `pnpm install`, `pnpm validate:slides`, `pnpm typecheck`, `pnpm test`, `pnpm build`. e2e — отдельная джоба с установкой браузеров Playwright.

**Step 2:** Прогнать локально аналог команд, убедиться что зелено.

**Step 3: Commit** — `ci: validate slides, typecheck, test, build`.

### Task 7.3: README

**Files:**
- Create: `README.md`

**Step 1:** Кратко: назначение (методология обучения предотвращению атак), запуск (`pnpm dev`, `pnpm dev:evil`), как добавить слайд/модуль (структура JSON, где лежат файлы фич для `code`), как добавить новую уязвимость (фича `vuln-<name>` + JSON-модуль), дисклеймер про намеренные уязвимости и запуск только локально.

**Step 2: Commit** — `docs: project README`.

---

## Дальнейшие модули (после первого среза)

Каждая следующая уязвимость повторяет паттерн Task 5.2–5.4: фича `features/vuln-<name>/` с `*.vulnerable`/`*.fixed`, страница в `(site)`, при необходимости endpoint в evil, JSON-модуль в `content/slides/`, запись в `index.json`, `validate:slides`, e2e-смоук. Порядок по `docs/security-guide/`: CSRF, data exposure, dependencies (supply chain), clickjacking, open redirect, prototype pollution, SSRF, session management.

## Проверка готовности (Definition of Done для среза)

- `pnpm validate:slides`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm e2e` — зелёные.
- В dev проходится модуль XSS целиком: демо ломается → разбор → фикс → тот же payload в `fixed` не срабатывает → чеклист.
- Переход слайд→сайт плавный, тумблер режима работает, Esc возвращает на слайд.
- Только antd + обёртки; кастомных «сырых» компонентов нет.
