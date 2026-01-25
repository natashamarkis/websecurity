# Vulnerable Web Application Demo

Образовательное приложение для демонстрации уязвимостей веб-безопасности.

## 🎯 Реализованные уязвимости

### Frontend (React + TypeScript)
1. **Reflected XSS** - поиск постов без санитизации
2. **Stored XSS** - комментарии рендерятся через dangerouslySetInnerHTML
3. **API Keys в коде** - хардкоднутые ключи Stripe и Google Maps
4. **DOM-based XSS** - (будет в Profile page)

### Backend (Node.js + Express)
1. **XSS** - отсутствие санитизации пользовательского ввода
2. **CSRF** - отсутствие CSRF токенов на DELETE endpoints
3. **Open Redirect** - /api/redirect?url=
4. **SSRF** - /api/preview принимает любые URL
5. **Prototype Pollution** - уязвимый lodash@4.17.11
6. **Data Exposure** - /api/debug/config раскрывает секреты
7. **Missing Security Headers** - отсутствуют X-Frame-Options, CSP и др.
8. **Session Management** - старые сессии не инвалидируются при смене пароля

## 🚀 Запуск проекта

### Требования
- Node.js >= 18
- npm

### Backend
```bash
cd backend
npm install
npm run dev
```
Backend запустится на http://localhost:3000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend запустится на http://localhost:5173 (или следующем свободном порту)

## 👥 Тестовые аккаунты

- **admin** / admin123 (Администратор)
- **alice** / alice123 (Пользователь)
- **bob** / bob123 (Пользователь)
- **attacker** / hack123 (Атакующий)

## 📁 Структура проекта

```
websecurity/
├── backend/                # Node.js + Express API
│   ├── src/
│   │   ├── database/      # SQLite схема и seed данные
│   │   ├── middleware/    # Auth middleware
│   │   ├── routes/        # API роуты
│   │   └── server.js      # Главный файл
│   ├── uploads/           # Загруженные файлы
│   └── database.sqlite    # База данных
│
├── frontend/              # React + TypeScript
│   ├── src/
│   │   ├── components/    # Переиспользуемые компоненты
│   │   ├── contexts/      # React Contexts (Auth)
│   │   ├── pages/         # Страницы приложения
│   │   ├── services/      # API клиенты
│   │   └── App.tsx
│   └── package.json
│
└── docs/                  # Документация
    └── plans/             # Implementation планы
```

## 🔐 Демонстрация уязвимостей

### 1. Reflected XSS (Поиск)
```
Перейдите на главную → Введите в поиск:
<img src=x onerror=alert('XSS')>
```

### 2. Stored XSS (Комментарии)
```
Войдите как alice → Откройте любой пост → Добавьте комментарий:
<script>alert('Stored XSS')</script>
```

### 3. Open Redirect
```
http://localhost:3000/api/redirect?url=http://evil.com
```

### 4. SSRF
```bash
curl -X POST http://localhost:3000/api/preview \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:3000/api/debug/config"}'
```

### 5. Data Exposure
```
http://localhost:3000/api/debug/config
```

### 6. Prototype Pollution
```bash
curl -X POST http://localhost:3000/api/settings/merge \
  -H "Content-Type: application/json" \
  -b "session_token=YOUR_TOKEN" \
  -d '{"__proto__":{"isAdmin":true}}'
```

## 📝 API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Логин
- `POST /api/auth/logout` - Выход
- `GET /api/auth/me` - Текущий пользователь

### Посты
- `GET /api/posts` - Все посты (с поиском ?q=)
- `GET /api/posts/:id` - Один пост с комментариями
- `POST /api/posts` - Создать пост (требует auth)
- `DELETE /api/posts/:id` - Удалить пост (требует auth)

### Комментарии
- `POST /api/comments` - Добавить комментарий (требует auth)
- `DELETE /api/comments/:id` - Удалить комментарий (требует auth)

### Профили
- `GET /api/users/:id` - Профиль пользователя
- `PUT /api/users/:id` - Обновить профиль (требует auth)
- `POST /api/users/:id/avatar` - Загрузить аватар (требует auth)
- `POST /api/users/:id/change-password` - Сменить пароль (требует auth)
- `DELETE /api/users/:id` - Удалить аккаунт (требует auth)

### Сообщения
- `GET /api/messages` - Все диалоги (требует auth)
- `GET /api/messages/:userId` - Сообщения с пользователем (требует auth)
- `POST /api/messages` - Отправить сообщение (требует auth)

### Уязвимые endpoints
- `GET /api/redirect` - Open Redirect
- `POST /api/preview` - SSRF
- `POST /api/settings/merge` - Prototype Pollution
- `GET /api/debug/config` - Data Exposure

### Admin (требует роль admin)
- `GET /api/admin/users` - Все пользователи
- `GET /api/admin/sessions` - Все сессии
- `GET /api/admin/stats` - Статистика
- `GET /api/admin/logs` - Demo logs
- `POST /api/admin/logs` - Добавить log
- `DELETE /api/admin/logs` - Очистить logs
- `POST /api/admin/reset-demo` - Сбросить demo данные

## ⚠️ Важно

Это приложение **намеренно содержит уязвимости** для образовательных целей. 
**НЕ ИСПОЛЬЗУЙТЕ** этот код в продакшене!

## 📚 Технологии

**Backend:**
- Node.js + Express
- SQLite3
- bcrypt
- cookie-parser
- multer
- lodash@4.17.11 (уязвимая версия)
- node-fetch@2

**Frontend:**
- React 18
- TypeScript
- Vite
- Ant Design
- React Router
- Axios

## 🎓 Цель проекта

Демонстрация распространенных веб-уязвимостей для:
- Обучения разработчиков
- Tech talks и презентаций
- Понимания векторов атак
- Практики безопасного кодирования

---

**Разработано для образовательных целей** 🎯
