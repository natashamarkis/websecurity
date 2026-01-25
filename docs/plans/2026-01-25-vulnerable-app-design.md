# Дизайн приложения для демонстрации Frontend уязвимостей

**Дата:** 2026-01-25
**Цель:** Создать full-stack приложение для демонстрации 9 frontend уязвимостей на техтолке
**Формат:** Одно приложение со всеми уязвимостями + интерактивная админ-панель для демонстрации

---

## 1. Технологический стек

### Frontend
- **React 18** с TypeScript
- **Ant Design** для UI компонентов
- **React Router** для навигации
- **Axios** для HTTP запросов
- **Vite** для сборки

### Backend
- **Node.js** + Express
- **SQLite3** для базы данных
- **cookie-parser** для работы с cookies
- **bcrypt** для хеширования паролей
- **multer** для загрузки файлов

### Порты
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

---

## 2. Структура проекта

```
websecurity/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Уязвимые middleware
│   │   ├── database/        # SQLite setup + seed data
│   │   └── server.js
│   ├── uploads/             # Загруженные файлы
│   └── database.sqlite
├── frontend/
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   ├── pages/           # Страницы приложения
│   │   ├── services/        # API calls
│   │   └── admin/           # Админ панель для демо
│   └── public/
└── docs/
    └── plans/               # Документация дизайна
```

---

## 3. Функциональность приложения

### Страницы

**Публичные:**
1. Главная (`/`) - список всех постов с поиском
2. Регистрация (`/register`)
3. Логин (`/login`)
4. Пост (`/post/:id`) - детальный просмотр с комментариями

**Приватные (требуют авторизации):**
5. Профиль (`/profile/:userId`) - профиль, редактирование, загрузка аватара
6. Создать пост (`/create-post`)
7. Приватные сообщения (`/messages`)
8. Настройки (`/settings`) - изменение email, пароля, удаление аккаунта

**Админ:**
9. Админ панель (`/admin`) - управление пользователями, постами
10. **Демо контроль** (`/admin/demo`) - интерактивная панель для техтолка
11. Статистика (`/admin/stats`) - графики активности
12. Модерация (`/admin/moderation`) - одобрение/удаление контента

### API Endpoints

**Аутентификация:**
- `POST /api/auth/register`
- `POST /api/auth/login` (устанавливает httpOnly cookie)
- `POST /api/auth/logout`

**Посты:**
- `GET /api/posts` (с поиском)
- `GET /api/posts/:id`
- `POST /api/posts`
- `DELETE /api/posts/:id` ⚠️ Без CSRF защиты

**Комментарии:**
- `POST /api/posts/:id/comments` ⚠️ Уязвим к XSS
- `DELETE /api/comments/:id`

**Профиль:**
- `GET /api/users/:id`
- `PUT /api/users/:id` ⚠️ Уязвим к CSRF
- `POST /api/users/:id/avatar`
- `DELETE /api/users/:id`

**Сообщения:**
- `GET /api/messages`
- `GET /api/messages/:userId`
- `POST /api/messages`

**Админ:**
- `GET /api/admin/users`
- `GET /api/admin/logs` - логи атак
- `POST /api/admin/reset-demo` - сброс данных

**Уязвимые endpoints для демо:**
- `GET /api/redirect?url=` ⚠️ Open Redirect
- `POST /api/preview?url=` ⚠️ SSRF
- `POST /api/settings/merge` ⚠️ Prototype Pollution
- `GET /api/debug/config` ⚠️ Data Exposure

---

## 4. Схема базы данных (SQLite)

### Таблицы

**users**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  bio TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**posts**
```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**comments**
```sql
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**sessions**
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**messages**
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id)
);
```

**demo_logs**
```sql
CREATE TABLE demo_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  description TEXT,
  payload TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Тестовые аккаунты

1. **admin / admin123** - Администратор, полный доступ
2. **alice / alice123** - Обычный пользователь, "жертва" атак
3. **bob / bob123** - Обычный пользователь
4. **attacker / hack123** - Аккаунт для демонстрации атак

### Seed данные
- ~10 постов от разных пользователей
- ~20 комментариев (некоторые с XSS payloads)
- ~5 приватных сообщений
- Демо-посты для SSRF демонстрации

---

## 5. Интеграция уязвимостей

### 5.1 XSS (Cross-Site Scripting)

**Локации:**
- **Stored XSS** в комментариях - `dangerouslySetInnerHTML`
- **Reflected XSS** в поиске - параметр `?q=` без санитизации
- **DOM-based XSS** в биографии профиля

**Уязвимый код:**
```javascript
// Frontend
<div dangerouslySetInnerHTML={{__html: comment.text}} />

// Backend
res.send(`<h1>Результаты для: ${req.query.q}</h1>`)
```

**Демо:** Кнопка вставляет `<img src=x onerror=alert('XSS!')>`

---

### 5.2 CSRF (Cross-Site Request Forgery)

**Локации:**
- Удаление поста (без токена)
- Изменение email в настройках
- Перевод "денег" между пользователями

**Уязвимый код:**
```javascript
app.delete('/api/posts/:id', authenticateUser, (req, res) => {
  // Нет проверки CSRF токена
  deletePost(req.params.id);
});
```

**Демо:** Генерирует HTML страницу с hidden формой

---

### 5.3 Data Exposure

**Локации:**
- API ключи в frontend коде
- Session tokens в `localStorage`
- Debug endpoint `/api/debug/config`
- Source maps в production
- `.env` файлы доступны

**Демо:** Подсветка всех мест утечек

---

### 5.4 Insecure Dependencies

**Локации:**
- Старая версия lodash (CVE-2019-10744)
- Endpoint `/api/merge` уязвим к prototype pollution

**Демо:** `npm audit` результаты + эксплойт

---

### 5.5 Clickjacking

**Локации:**
- Отсутствует `X-Frame-Options` header
- Критические действия можно обернуть в iframe

**Демо:** Игра с прозрачным iframe кнопки удаления

---

### 5.6 Open Redirects

**Локации:**
- `/api/auth/login?redirect=` - любой URL
- `/api/redirect?url=` - без валидации

**Уязвимый код:**
```javascript
app.get('/api/redirect', (req, res) => {
  res.redirect(req.query.url);
});
```

**Демо:** Фишинговая ссылка с доверенным доменом

---

### 5.7 Prototype Pollution

**Локации:**
- `/api/settings/merge` использует `lodash.merge`

**Эксплойт:**
```json
{
  "__proto__": {
    "isAdmin": true
  }
}
```

**Демо:** Пользователь получает admin права

---

### 5.8 SSRF (Server-Side Request Forgery)

**Локации:**
- Предпросмотр ссылки: `/api/preview?url=`
- Backend делает запрос без валидации
- Доступ к `http://localhost:3000/api/admin/users`

**Демо:** Запросы к внутренним эндпоинтам

---

### 5.9 Session Management Issues

**Проблемы:**
- Токены НЕ обновляются после смены пароля
- Нет timeout для сессий
- Множество активных сессий

**Демо:** Украденная сессия работает после "смены пароля"

---

## 6. Админ Демо-панель

### Интерфейс (`/admin/demo`)

**Секция 1: Контроль уязвимостей**
```
┌─────────────────────────────────────────┐
│ 🎯 Vulnerability Demo Control Panel     │
├─────────────────────────────────────────┤
│ [✓] XSS Attacks                         │
│     └─ [Show Exploit] [View Logs]      │
│ [✓] CSRF Attacks                        │
│     └─ [Generate Attack Page] [Logs]   │
│ [✓] Data Exposure                       │
│     └─ [Show Leaks] [View Sources]     │
│ ... (все 9 уязвимостей)                │
└─────────────────────────────────────────┘
```

**Секция 2: Live Exploit Generator**
- Модальное окно с кодом
- Syntax highlighting
- Кнопки "Copy Code" и "Execute Demo"
- Реал-тайм лог выполнения

**Секция 3: Attack Logs** (реал-тайм)
```
[XSS] Alice viewed malicious comment - Cookie stolen
[CSRF] Bob's post deleted via CSRF
[SSRF] Internal API accessed
```

**Секция 4: Quick Actions**
- 🔄 Reset Demo Data
- 🧹 Clear Logs
- 📥 Export Evidence
- 👥 Login As User

### Визуальные индикаторы

- 🔴 Красная рамка вокруг уязвимого поля
- 💀 Иконка на опасных кнопках
- ⚠️ Тултип: "Vulnerable to XSS"
- Переключатель в админке

### Предустановленные сценарии

1. **"Demo: Steal Cookie via XSS"**
2. **"Demo: CSRF Attack"**
3. **"Demo: SSRF Internal Access"**
4. **"Demo: Clickjacking Game"**
... по одному для каждой уязвимости

---

## 7. UI/UX дизайн

### Layout
```
┌─────────────────────────────────────────┐
│ Header: Logo | Search | User Menu       │
├─────────────────────────────────────────┤
│  Sidebar          Main Content          │
│  - Home           ┌─────────────────┐  │
│  - My Posts       │   Page content  │  │
│  - Messages       └─────────────────┘  │
│  - Profile                              │
│  - Settings                             │
│  - Admin (if)                           │
└─────────────────────────────────────────┘
```

### Ant Design компоненты
- Layout, Menu, Breadcrumb - структура
- Form, Input, Button - формы
- Card, List, Avatar - контент
- Modal, Drawer - диалоги
- Table, Badge, Tag - админка
- Alert, Notification - уведомления

### Цветовая схема
- **Основная тема:** Темная (для презентации)
- Primary: Ant Design blue
- Danger: Red (уязвимости)
- Success: Green (безопасные действия)
- Warning: Orange (предупреждения)
- **Переключатель** на светлую тему в админке

---

## 8. План реализации

### Этап 1: Backend setup
1. Инициализация Node.js проекта
2. Настройка Express сервера
3. Создание SQLite схемы
4. Seed данных (тестовые аккаунты)

### Этап 2: Backend API
1. Аутентификация (регистрация, логин, logout)
2. CRUD для постов
3. CRUD для комментариев
4. Профиль и настройки
5. Приватные сообщения
6. Админ endpoints
7. Уязвимые endpoints (redirect, preview, merge)

### Этап 3: Frontend setup
1. Инициализация Vite + React + TypeScript
2. Настройка Ant Design
3. Настройка React Router
4. API service layer (Axios)

### Этап 4: Frontend страницы
1. Публичные страницы (Home, Login, Register)
2. Приватные страницы (Profile, Create Post, Messages, Settings)
3. Детальная страница поста с комментариями

### Этап 5: Админ панель
1. Базовая админка (users, posts management)
2. Демо-контроль панель
3. Exploit генераторы
4. Attack logs display
5. Quick actions

### Этап 6: Интеграция уязвимостей
1. XSS (Stored, Reflected, DOM-based)
2. CSRF
3. Data Exposure
4. Insecure Dependencies
5. Clickjacking
6. Open Redirects
7. Prototype Pollution
8. SSRF
9. Session Management Issues

### Этап 7: Демо-сценарии
1. Предустановленные эксплойты
2. Визуальные индикаторы
3. Интерактивные кнопки
4. Логирование атак

### Этап 8: Полировка
1. Тестирование всех уязвимостей
2. Улучшение UX админки
3. Документация для техтолка
4. Финальная проверка

---

## 9. Запуск приложения

### Development mode

**Backend:**
```bash
cd backend
npm install
npm run dev  # Запуск на :3000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # Запуск на :5173
```

### Доступ
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Admin Demo: http://localhost:5173/admin/demo

### Тестовые аккаунты
- admin / admin123
- alice / alice123
- bob / bob123
- attacker / hack123

---

## 10. Примечания для техтолка

### Перед презентацией:
1. ✅ Запустить backend и frontend
2. ✅ Проверить, что все 4 аккаунта работают
3. ✅ Сбросить демо-данные через админку
4. ✅ Очистить логи атак
5. ✅ Открыть админ панель в отдельной вкладке

### Во время презентации:
- Использовать темную тему для эффектности
- Показывать код уязвимостей через модальные окна
- Логи атак обновляются в реальном времени
- Быстрое переключение между аккаунтами через админку

### После демонстрации:
- Можно экспортировать логи атак
- Код эксплойтов доступен для копирования
- Все материалы в папке `allInfo/`

---

**Цель достигнута:** Полнофункциональное приложение для демонстрации 9 критических frontend уязвимостей с интерактивной панелью управления для эффектной презентации на техтолке.
