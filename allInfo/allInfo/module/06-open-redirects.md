## 6. Open Redirects

### Что это такое

Open Redirect — это уязвимость, при которой приложение перенаправляет пользователя на URL, который может быть контролируем злоумышленником. Это происходит когда приложение принимает user-controlled input (обычно URL parameter) и использует его для редиректа без должной валидации.

**CVSS Score:** 4.3 - 6.1 (часто считается low severity, но может быть critical в контексте)
**CWE ID:** CWE-601
**OWASP Top 10:** A01:2021 – Broken Access Control

### Как работает механизм атаки

Open Redirect эксплуатирует доверие пользователя к домену:

1. **Легитимная функция:** Приложение имеет redirect функционал (login → redirect to requested page)
2. **User-controlled URL:** Destination URL берется из параметра запроса
3. **Недостаточная валидация:** Приложение не проверяет что URL принадлежит тому же домену
4. **Злоупотребление доверием:** Злоумышленник отправляет ссылку с trusted domain но redirect на malicious site
5. **Фишинг успешен:** Пользователь доверяет ссылке потому что видит trusted domain

**Пример flow:**
```
1. Пользователь получает email:
   "Login to your bank: https://trusted-bank.com/login?redirect=https://evil-phishing.com"

2. Видит домен: trusted-bank.com ✅ (доверяет)

3. Кликает ссылку

4. Перенаправляется на: evil-phishing.com (выглядит как банк)

5. Вводит credentials на фишинговом сайте
```

### Типы Open Redirect

#### 6.1 URL Parameter Redirect

**Характеристики:**
- Самый распространенный тип
- Redirect URL в query parameter
- Часто в login/logout flows

**Уязвимый код:**
```javascript
// ❌ Опасно - нет валидации
app.get('/login', (req, res) => {
    const redirectUrl = req.query.redirect || '/dashboard';

    // После успешного login:
    res.redirect(redirectUrl);  // Любой URL!
});

// Эксплуатация:
// https://site.com/login?redirect=https://evil.com
```

**Impact:** СРЕДНИЙ - требует social engineering, но очень эффективен

#### 6.2 Header-based Redirect

**Характеристики:**
- Redirect URL в HTTP header (Referer, X-Forwarded-Host)
- Менее очевиден для пользователя
- Сложнее эксплуатировать

**Уязвимый код:**
```javascript
// ❌ Опасно - доверие к Referer header
app.get('/logout', (req, res) => {
    const referer = req.headers.referer || '/';

    destroySession(req.session);
    res.redirect(referer);  // Может быть подделан!
});
```

**Эксплуатация:**
```html
<!-- Страница злоумышленника -->
<a href="https://victim.com/logout">Logout</a>

<!-- Браузер отправляет:
     Referer: https://evil.com
     Пользователь перенаправлен обратно на evil.com -->
```

**Impact:** НИЗКИЙ-СРЕДНИЙ - требует контроль над initial page

#### 6.3 Host Header Injection

**Характеристики:**
- Манипуляция Host header
- Используется в password reset emails
- Критична для security

**Уязвимый код:**
```javascript
// ❌ КРИТИЧЕСКИ опасно - доверие к Host header
app.post('/password-reset', (req, res) => {
    const email = req.body.email;
    const host = req.headers.host;  // Подконтрольно атакующему!
    const token = generateResetToken();

    const resetLink = `https://${host}/reset?token=${token}`;

    sendEmail(email, `Reset your password: ${resetLink}`);
    res.send('Email sent');
});

// Атака:
// POST /password-reset HTTP/1.1
// Host: evil.com
//
// email=victim@example.com

// Жертва получает email:
// "Reset your password: https://evil.com/reset?token=VALID_TOKEN"
// Кликает, token отправлен злоумышленнику!
```

**Impact:** КРИТИЧЕСКИЙ - прямая кража reset tokens

#### 6.4 JavaScript-based Redirect

**Характеристики:**
- Redirect через `window.location`
- Client-side уязвимость
- Часто в SPA

**Уязвимый код:**
```javascript
// ❌ Опасно - DOM-based Open Redirect
const urlParams = new URLSearchParams(window.location.search);
const redirect = urlParams.get('next');

if (redirect) {
    window.location.href = redirect;  // Любой URL!
}

// Эксплуатация:
// https://site.com/page?next=javascript:alert(document.cookie)
// или
// https://site.com/page?next=https://evil.com
```

**Impact:** СРЕДНИЙ-ВЫСОКИЙ - может комбинироваться с XSS

### Реальные кейсы с финансовым impact

#### Shopify (2020) - OAuth Token Theft

**Что произошло:**
Open Redirect в OAuth flow позволял воровать access tokens партнерских приложений.

**Механизм:**
```
1. OAuth flow Shopify:
   https://shopify.com/oauth/authorize?
     client_id=APP_ID&
     redirect_uri=https://partner-app.com/callback

2. Уязвимость: redirect_uri недостаточно валидировался

3. Атака:
   https://shopify.com/oauth/authorize?
     client_id=APP_ID&
     redirect_uri=https://partner-app.com@evil.com/callback

   или

   redirect_uri=https://partner-app.com.evil.com/callback

4. После authorization, токен отправлен на evil.com
```

**Результат:**
- Возможность кражи OAuth tokens
- Компрометация партнерских приложений
- Access к Shopify stores
- Bug bounty: $25,000 (высокий severity)

**Урок:** Open Redirect в OAuth = Token theft.

#### Slack (2017) - Phishing Campaign

**Что произошло:**
Open Redirect в `/api/redirect` endpoint использовался в фишинговых кампаниях.

**Механизм:**
```
Легитимный endpoint:
https://slack.com/api/redirect?url=https://slack.com/downloads

Эксплуатация:
https://slack.com/api/redirect?url=https://slack-phishing.com

Фишинговая страница выглядела идентично Slack login page
```

**Результат:**
- Массовые фишинговые кампании использовали slack.com domain
- Пользователи доверяли так как URL начинался с slack.com
- Credentials украдены с тысяч пользователей
- Bug bounty: $1,750
- Slack исправил валидацию URL

**Урок:** Trusted domain + Open Redirect = Very effective phishing.

#### WhatsApp Web (2019) - Universal XSS

**Что произошло:**
Open Redirect комбинированный с data: URI приводил к XSS.

**Механизм:**
```
https://web.whatsapp.com/redirect?url=data:text/html,<script>alert(document.cookie)</script>

или использование javascript: URI:
https://web.whatsapp.com/redirect?url=javascript:alert(document.cookie)
```

**Результат:**
- Universal XSS на web.whatsapp.com
- Возможность кражи session tokens
- Access ко всем сообщениям пользователя
- Bug bounty: $15,000+
- Facebook (owner) быстро исправил

**Урок:** Open Redirect + dangerous URI schemes = XSS.

### Технические детали эксплуатации

#### URL parsing bypasses

**Обход whitelist валидации:**
```javascript
// Попытка валидации (неправильная)
function isAllowedDomain(url) {
    return url.includes('mysite.com');
}

// Bypasses:
https://mysite.com@evil.com        // user:pass format
https://evil.com/mysite.com        // в path
https://evil.com?redirect=mysite.com  // в query
https://mysite.com.evil.com        // subdomain атакующего
```

**JavaScript URI scheme:**
```javascript
// Эксплуатация для XSS
javascript:alert(document.cookie)
javascript:eval(atob('BASE64_PAYLOAD'))

// data: URI
data:text/html,<script>alert(1)</script>
data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==
```

**Protocol-relative URLs:**
```javascript
// Bypass https:// валидации
//evil.com
\//evil.com
\/\/evil.com
```

**Unicode/Encoding bypasses:**
```javascript
// Unicode characters
https://mуsite.com  // 'у' is Cyrillic, not Latin 'y'

// URL encoding
https://mysite.com%00@evil.com  // null byte

// Double encoding
https://mysite.com%2540evil.com  // %25 = %, так что %2540 = @
```

#### Обход валидации domain

**Примеры некорректной валидации:**
```javascript
// ❌ Плохо - легко обойти
function validateDomain(url) {
    if (url.startsWith('https://mysite.com')) {
        return true;
    }
    return false;
}

// Bypass:
https://mysite.com.evil.com  // Начинается с https://mysite.com ✓

// ❌ Плохо - regex без anchors
function validateDomain(url) {
    return /mysite\.com/.test(url);
}

// Bypass:
https://evil.com/mysite.com  // Содержит mysite.com ✓

// ❌ Плохо - доверие к parse без проверки
function validateDomain(url) {
    const parsed = new URL(url);
    if (parsed.host.includes('mysite.com')) {
        return true;
    }
}

// Bypass:
https://mysite.com@evil.com  // host = evil.com, но includes mysite.com ✓
```

### Методы защиты

#### 1. Whitelist Approach (Recommended)

**Правильная валидация:**
```javascript
// ✅ Правильно - строгий whitelist
function validateRedirect(url) {
    const allowedDomains = [
        'mysite.com',
        'www.mysite.com',
        'app.mysite.com'
    ];

    try {
        const parsed = new URL(url, window.location.origin);

        // Проверяем protocol
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return false;
        }

        // Проверяем hostname (не host, чтобы исключить port tricks)
        if (!allowedDomains.includes(parsed.hostname)) {
            return false;
        }

        return true;
    } catch(e) {
        // Невалидный URL
        return false;
    }
}

// Использование
app.get('/redirect', (req, res) => {
    const url = req.query.url;

    if (!validateRedirect(url)) {
        return res.status(400).send('Invalid redirect URL');
    }

    res.redirect(url);
});
```

#### 2. Relative URLs Only

**Самый безопасный подход:**
```javascript
// ✅ Только relative URLs
function validateRedirect(url) {
    // Проверяем что URL не содержит :// (protocol)
    if (url.includes('://') || url.includes('//')) {
        return false;
    }

    // Проверяем что начинается с /
    if (!url.startsWith('/')) {
        return false;
    }

    return true;
}

// Примеры:
validateRedirect('/dashboard');          // ✅ Разрешено
validateRedirect('/users/profile');      // ✅ Разрешено
validateRedirect('//evil.com');          // ❌ Заблокировано
validateRedirect('https://evil.com');    // ❌ Заблокировано
```

#### 3. Indirect Redirect Pattern

**Использование mapping вместо прямых URLs:**
```javascript
// ✅ Indirect redirect через mapping
const REDIRECT_MAP = {
    'dashboard': '/dashboard',
    'profile': '/users/profile',
    'settings': '/settings',
    'logout_done': '/goodbye'
};

app.get('/redirect', (req, res) => {
    const key = req.query.to;  // Не URL, а key!
    const destination = REDIRECT_MAP[key];

    if (!destination) {
        return res.redirect('/');  // Default fallback
    }

    res.redirect(destination);
});

// Использование:
// https://site.com/redirect?to=dashboard  ✅
// https://site.com/redirect?to=evil.com   ❌ Не в map, fallback to /
```

#### 4. Referer Validation

**Для logout и similar flows:**
```javascript
// ✅ Валидация Referer
app.get('/logout', (req, res) => {
    const referer = req.headers.referer;

    if (referer) {
        try {
            const parsed = new URL(referer);
            const allowedHosts = ['mysite.com', 'www.mysite.com'];

            if (allowedHosts.includes(parsed.hostname)) {
                destroySession(req);
                return res.redirect(referer);
            }
        } catch(e) {
            // Invalid referer
        }
    }

    // Fallback to safe default
    destroySession(req);
    res.redirect('/');
});
```

#### 5. OAuth redirect_uri Validation

**Для OAuth flows (критично!):**
```javascript
// ✅ Строгая валидация redirect_uri
function validateOAuthRedirect(clientId, redirectUri) {
    // Получить зарегистрированные redirect URIs для этого client
    const registeredUris = getRegisteredRedirectUris(clientId);

    // Должно быть ТОЧНОЕ совпадение (не startsWith!)
    if (!registeredUris.includes(redirectUri)) {
        return false;
    }

    // Дополнительная проверка protocol
    try {
        const parsed = new URL(redirectUri);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return false;
        }
    } catch(e) {
        return false;
    }

    return true;
}

// OAuth endpoint
app.get('/oauth/authorize', (req, res) => {
    const { client_id, redirect_uri } = req.query;

    if (!validateOAuthRedirect(client_id, redirect_uri)) {
        return res.status(400).send('Invalid redirect_uri');
    }

    // Proceed with OAuth flow...
});
```

#### 6. Warning Page Approach

**Показывать предупреждение для external redirects:**
```javascript
// ✅ Warning page для external URLs
app.get('/external-redirect', (req, res) => {
    const url = req.query.url;

    // Валидируем что это валидный URL
    try {
        const parsed = new URL(url);

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return res.status(400).send('Invalid URL');
        }
    } catch(e) {
        return res.status(400).send('Invalid URL');
    }

    // Показываем warning page
    res.render('external-redirect-warning', {
        destinationUrl: url,
        destinationDomain: new URL(url).hostname
    });
});
```

**external-redirect-warning.html:**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Leaving Our Site</title>
</head>
<body>
<h1>⚠️ You are leaving our site</h1>
<p>You are about to navigate to an external website:</p>
<p><strong><%= destinationDomain %></strong></p>

<p>We are not responsible for the content or privacy practices of external sites.</p>

<a href="<%= destinationUrl %>">Continue to <%= destinationDomain %></a>
<a href="/">Stay on our site</a>
</body>
</html>
```

### Как тестировать

#### Ручное тестирование

**1. Поиск redirect parameters:**
```bash
# Ищем подозрительные параметры
?redirect=
?url=
?next=
?return=
?returnTo=
?continue=
?destination=
?redir=
?out=
?view=
?to=
?target=
```

**2. Базовое тестирование:**
```
https://target.com/login?redirect=https://evil.com
https://target.com/logout?next=https://evil.com
https://target.com/redirect?url=//evil.com
https://target.com/goto?to=javascript:alert(1)
```

**3. Bypass техники:**
```
# @-trick
https://target.com/redirect?url=https://target.com@evil.com

# Subdomain trick
https://target.com/redirect?url=https://target.com.evil.com

# Open redirect chain
https://target.com/redirect?url=https://another-target.com/redirect?url=https://evil.com

# Backslash trick
https://target.com/redirect?url=https:\\evil.com

# Null byte
https://target.com/redirect?url=https://target.com%00.evil.com
```

#### Автоматизированное тестирование

**Burp Suite:**
```
1. Найти все redirect параметры через Proxy → HTTP history
2. Send to Repeater
3. Модифицировать URL на https://evil.com
4. Проверить Location header в response
```

**Custom script:**
```python
import requests

def test_open_redirect(base_url, param_name):
    payloads = [
        'https://evil.com',
        '//evil.com',
        '\\\\evil.com',
        'https://trusted.com@evil.com',
        'https://trusted.com.evil.com',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>'
    ]

    for payload in payloads:
        url = f"{base_url}?{param_name}={payload}"
        response = requests.get(url, allow_redirects=False)

        if response.status_code in [301, 302, 303, 307, 308]:
            location = response.headers.get('Location', '')

            if 'evil.com' in location or 'javascript:' in location:
                print(f"[VULNERABLE] {url}")
                print(f"  Redirects to: {location}")
                return True

    print(f"[SAFE] No open redirect found")
    return False

# Тест
test_open_redirect('https://target.com/redirect', 'url')
```

### Контрольный чеклист

**Для разработчиков:**
- [ ] Все redirect URLs валидируются (whitelist approach)
- [ ] Только https:// и http:// protocols разрешены
- [ ] Exact match для OAuth redirect_uri (не startsWith!)
- [ ] Используется URL parsing (new URL()) для валидации
- [ ] Default fallback для invalid URLs
- [ ] Warning page для external redirects (опционально)
- [ ] Нет доверия к Referer header без валидации
- [ ] Host header валидируется в password reset emails

**Для security review:**
- [ ] Все login/logout flows проверены
- [ ] OAuth implementation аудирован
- [ ] Password reset flow не доверяет Host header
- [ ] Penetration testing с bypass техниками
- [ ] Code review на использование req.query.redirect patterns

**Для критичных приложений:**
- [ ] Только relative URLs или indirect mapping
- [ ] Rate limiting на redirect endpoints
- [ ] Logging всех external redirects
- [ ] CSP настроен для ограничения navigation

