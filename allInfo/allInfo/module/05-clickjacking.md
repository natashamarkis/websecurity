## 5. Clickjacking (UI Redressing)

### Что это такое

Clickjacking (UI Redressing) — это атака, при которой злоумышленник обманывает пользователя, заставляя его кликать на элемент, который отличается от того, что пользователь видит. Это достигается путем размещения невидимого или прозрачного iframe поверх видимого контента, перехватывая клики пользователя.

**CVSS Score:** 4.3 - 7.1 (в зависимости от действия)
**CWE ID:** CWE-1021
**OWASP Top 10:** A04:2021 – Insecure Design

### Как работает механизм атаки

Clickjacking эксплуатирует визуальное восприятие пользователя:

1. **Создание приманки:** Злоумышленник создает привлекательный контент (игра, видео, "Win iPhone!")
2. **Размещение iframe:** Поверх контента размещается прозрачный iframe с целевым сайтом
3. **Позиционирование:** Критичная кнопка целевого сайта позиционируется точно над приманкой
4. **Клик пользователя:** Пользователь думает что кликает на приманку
5. **Действие выполнено:** Реальный клик происходит на невидимой кнопке целевого сайта

**Визуализация:**
```
┌─────────────────────────────────┐
│  Видимый слой (evil.com)        │
│                                  │
│   [Click to Win iPhone! 📱]     │ ← Что видит пользователь
│                                  │
└─────────────────────────────────┘
           ↓ (Прозрачный слой)
┌─────────────────────────────────┐
│  Невидимый iframe (bank.com)    │
│  opacity: 0.0001                 │
│   [Delete Account ❌]            │ ← Реальная кнопка
│                                  │
└─────────────────────────────────┘
```

### Типы Clickjacking атак

#### 5.1 Classic Clickjacking

**Характеристики:**
- Прозрачный iframe (opacity: 0)
- Точное позиционирование кнопки
- Single click атака

**Пример кода:**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        #target {
            position: absolute;
            top: 100px;
            left: 200px;
            opacity: 0.0001;  /* Почти невидим */
            z-index: 1000;
        }

        #decoy {
            position: absolute;
            top: 100px;
            left: 200px;
            z-index: 1;
        }
    </style>
</head>
<body>
    <h1>Click to win a FREE iPhone 15!</h1>

    <!-- Приманка -->
    <button id="decoy">CLAIM NOW! 🎁</button>

    <!-- Невидимый iframe с целевым сайтом -->
    <iframe id="target"
            src="https://bank.com/deleteAccount"
            width="300"
            height="200">
    </iframe>
</body>
</html>
```

**Impact:** СРЕДНИЙ - требует точного позиционирования

#### 5.2 Likejacking

**Характеристики:**
- Специфично для social media (Facebook, Twitter)
- Невидимая кнопка "Like" или "Share"
- Массовое распространение контента

**Механизм:**
```html
<style>
    iframe {
        position: absolute;
        top: 150px;
        left: 300px;
        opacity: 0;
        z-index: 999;
    }
</style>

<!-- Привлекательный контент -->
<div style="position: absolute; top: 150px; left: 300px;">
    <h2>See who viewed your profile! 👀</h2>
    <button>Click Here</button>
</div>

<!-- Невидимый Facebook Like button -->
<iframe src="https://facebook.com/plugins/like.php?href=SPAM_PAGE"></iframe>
```

**Impact:** СРЕДНИЙ - репутационный и spread malware

#### 5.3 Cursorjacking

**Характеристики:**
- Манипуляция с отображением курсора
- Пользователь думает что курсор в одном месте, но он в другом
- Более сложная техника

**Пример:**
```html
<style>
    * {
        cursor: none !important;  /* Скрываем настоящий курсор */
    }

    #fake-cursor {
        position: absolute;
        width: 20px;
        height: 20px;
        background: url('cursor.png');
        pointer-events: none;  /* Не блокирует клики */
        z-index: 10000;
    }
</style>

<div id="fake-cursor"></div>

<script>
document.addEventListener('mousemove', (e) => {
    // Отображаем fake cursor со смещением
    const fakeCursor = document.getElementById('fake-cursor');
    fakeCursor.style.left = (e.pageX + 50) + 'px';  // Смещение!
    fakeCursor.style.top = (e.pageY + 50) + 'px';
});
</script>
```

**Impact:** ВЫСОКИЙ - очень обманчиво

#### 5.4 Double Clickjacking

**Характеристики:**
- Требует два клика
- Первый клик - prepare
- Второй клик - confirm действие

**Пример для "Delete Account":**
```html
<!-- Первый клик: открыть диалог подтверждения -->
<iframe id="step1" src="https://site.com/settings"></iframe>

<!-- После первого клика, динамически показать второй iframe -->
<iframe id="step2"
        src="https://site.com/confirmDelete"
        style="display: none;">
</iframe>

<script>
let clickCount = 0;

document.addEventListener('click', () => {
    clickCount++;
    if (clickCount === 1) {
        // После первого клика показываем confirmation iframe
        setTimeout(() => {
            document.getElementById('step2').style.display = 'block';
        }, 500);
    }
});
</script>
```

**Impact:** ВЫСОКИЙ - может обойти confirmation dialogs

### Реальные кейсы с финансовым impact

#### Facebook Likejacking (2010-2011)

**Что произошло:**
Массовая кампания likejacking на Facebook. Миллионы пользователей непреднамеренно лайкали spam страницы.

**Механизм:**
```html
<!-- Вредоносная страница -->
<h1>OMG! You won't believe what this celebrity did!</h1>
<img src="celebrity.jpg">
<p>Click here to watch the video!</p>

<!-- Невидимый Facebook Like button поверх -->
<iframe src="https://www.facebook.com/plugins/like.php?href=SPAM_PAGE"
        style="position: absolute; opacity: 0; top: 200px; left: 100px;">
</iframe>
```

**Результат:**
- Миллионы непреднамеренных лайков
- Распространение spam контента
- Некоторые страницы продвигали malware
- Facebook внедрил X-Frame-Options защиту
- Репутационный ущерб для платформы

**Урок:** Clickjacking может использоваться для viral spread вредоносного контента.

#### Adobe Flash Clickjacking (2008)

**Что произошло:**
Clickjacking использовался для получения доступа к камере и микрофону пользователя через Flash.

**Механизм:**
```html
<!-- Flash security dialog невидим -->
<object style="opacity: 0.01;">
    <param name="allowScriptAccess" value="always">
    <embed src="camera_permission.swf">
</object>

<!-- Пользователь играет в игру -->
<div style="position: absolute; top: 0;">
    <canvas id="game">Click to play!</canvas>
</div>
```

**Результат:**
- Пользователи unknowingly предоставляли доступ к камере/микрофону
- Privacy нарушения
- Adobe добавил защиту в Flash Player
- Один из факторов eventual death of Flash

**Урок:** Clickjacking может компрометировать device permissions.

#### Twitter "Don't Click" Worm (2009)

**Что произошло:**
Self-propagating clickjacking worm на Twitter.

**Механизм:**
1. Пользователь кликает на невидимую кнопку "Retweet"
2. Tweet содержит link на вредоносную страницу
3. Следующая жертва видит tweet, кликает
4. Цикл повторяется

**Результат:**
- Тысячи аккаунтов скомпрометированы за часы
- Автоматическое распространение
- Twitter временно отключил функционал
- Добавлена защита от frame embedding

**Урок:** Clickjacking + social media = viral spread.

### Технические детали эксплуатации

#### Bypass попытки frame-busting

**Старый frame-busting код (легко обойти):**
```javascript
// ❌ Устаревшая защита
if (top !== self) {
    top.location = self.location;
}

// Обход через sandbox attribute:
<iframe sandbox="allow-forms allow-scripts"
        src="https://victim.com">
</iframe>
// sandbox блокирует top.location изменения
```

**Другие bypasses:**
```html
<!-- Метод 1: 204 No Content -->
<iframe src="https://attacker.com/204.php">
    <!-- 204.php возвращает HTTP 204, блокирует redirect -->
</iframe>

<!-- Метод 2: onBeforeUnload -->
<script>
window.onbeforeunload = function() {
    return "Stay on this page!";  // Блокирует navigation
};
</script>
<iframe src="https://victim.com"></iframe>

<!-- Метод 3: Multiple frames -->
<iframe src="https://victim.com" style="opacity: 0;"></iframe>
<iframe src="https://victim.com" style="opacity: 0;"></iframe>
<!-- Некоторые frame-busting скрипты ломаются с multiple frames -->
```

#### Advanced positioning techniques

**Drag-and-drop clickjacking:**
```html
<style>
    #victim-iframe {
        position: absolute;
        top: -9999px;  /* Скрыт изначально */
        opacity: 0.01;
    }
</style>

<div draggable="true" ondragstart="startDrag(event)">
    Drag this file to upload!
</div>

<iframe id="victim-iframe" src="https://victim.com/upload"></iframe>

<script>
function startDrag(event) {
    // Когда пользователь начинает drag, двигаем iframe под курсор
    const iframe = document.getElementById('victim-iframe');
    iframe.style.top = (event.clientY - 50) + 'px';
    iframe.style.left = (event.clientX - 50) + 'px';
}
</script>
```

### Методы защиты

#### 1. X-Frame-Options Header

**Server-side настройка:**
```javascript
// Express.js
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    // Или: 'SAMEORIGIN' - разрешает только same domain
    next();
});

// Nginx
add_header X-Frame-Options "DENY";

// Apache
Header always set X-Frame-Options "DENY"
```

**Значения:**
```
DENY        - Нельзя отображать в frame вообще (самый строгий)
SAMEORIGIN  - Можно только с того же origin
ALLOW-FROM uri - (Deprecated) Разрешить конкретный origin
```

#### 2. Content Security Policy (frame-ancestors)

**Современная и более гибкая альтернатива:**
```javascript
// CSP (предпочтительно над X-Frame-Options)
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "frame-ancestors 'none'"  // Эквивалент DENY
    );
    next();
});

// Разрешить specific domains
res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://trusted.com"
);
```

**Преимущества CSP:**
- Поддержка multiple sources
- Более новый standard
- Лучше поддерживается современными браузерами

#### 3. JavaScript Frame-Busting (Defense in Depth)

**Современный frame-busting:**
```javascript
// ✅ Правильная защита
(function() {
    if (window !== window.top) {
        // Мы в iframe

        // Попытка выйти
        try {
            window.top.location.href = window.location.href;
        } catch(e) {
            // Если блокировано (sandbox), скрываем содержимое
            document.body.innerHTML =
                '<h1>This page cannot be displayed in a frame</h1>';

            // Или перенаправляем на страницу предупреждения
            window.location.href = '/frame-error.html';
        }
    }
})();
```

**CSS-based защита:**
```html
<style>
    /* По умолчанию скрыто */
    html {
        display: none;
    }
</style>

<script>
    // Показать только если не в iframe
    if (self === top) {
        document.documentElement.style.display = 'block';
    } else {
        top.location = self.location;
    }
</script>
```

#### 4. SameSite Cookies (для session hijacking prevention)

**Защита от clickjacking для authenticated actions:**
```javascript
res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict'  // Cookie не отправится в cross-site iframe
});
```

#### 5. UI-based Protection

**Confirmation для критичных действий:**
```javascript
// Для критичных действий требовать re-authentication
function deleteAccount() {
    // Показать modal с вводом пароля
    showModal({
        title: 'Confirm Account Deletion',
        content: 'Please enter your password to confirm',
        onConfirm: async (password) => {
            const verified = await verifyPassword(password);
            if (verified) {
                await performDeletion();
            }
        }
    });
}
```

**CAPTCHA для высокорисковых операций:**
```javascript
// Требовать CAPTCHA перед critical action
if (isCriticalAction) {
    await verifyCaptcha();
}
```

### Как тестировать

#### Ручное тестирование

**1. Проверка X-Frame-Options:**
```bash
# Curl для проверки headers
curl -I https://yoursite.com

# Должен быть:
# X-Frame-Options: DENY
# или
# Content-Security-Policy: frame-ancestors 'none'
```

**2. Попытка frame embedding:**
```html
<!-- test-clickjacking.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Clickjacking Test</title>
</head>
<body>
    <h1>Testing if site can be framed</h1>
    <iframe src="https://target-site.com"
            width="800"
            height="600">
    </iframe>
</body>
</html>
```

**Откройте в браузере:**
- Если iframe пустой или показывает ошибку → ✅ Защищено
- Если сайт отображается в iframe → ❌ Уязвимо

**3. DevTools проверка:**
```javascript
// В console целевого сайта
window.self === window.top
// true  - не в iframe
// false - в iframe (потенциально уязвимо если контент отображается)
```

#### Автоматизированное тестирование

**OWASP ZAP:**
```bash
zap-cli quick-scan https://target.com

# Искать: "X-Frame-Options Header Not Set"
```

**Burp Suite:**
```
1. Passive scan автоматически проверяет X-Frame-Options
2. Scanner → Issues → "Frameable response"
```

**Custom script:**
```python
import requests

def test_clickjacking(url):
    response = requests.get(url)

    # Проверка X-Frame-Options
    xfo = response.headers.get('X-Frame-Options', '')

    # Проверка CSP frame-ancestors
    csp = response.headers.get('Content-Security-Policy', '')

    if 'DENY' in xfo or 'SAMEORIGIN' in xfo:
        print(f"✅ {url} - Protected by X-Frame-Options")
    elif 'frame-ancestors' in csp:
        print(f"✅ {url} - Protected by CSP")
    else:
        print(f"❌ {url} - VULNERABLE to clickjacking!")
        return False

    return True

# Тест
test_clickjacking('https://yoursite.com')
```

### Контрольный чеклист

**Для разработчиков:**
- [ ] X-Frame-Options header установлен (минимум SAMEORIGIN)
- [ ] CSP frame-ancestors настроен
- [ ] JavaScript frame-busting как дополнительный слой
- [ ] Критичные действия требуют confirmation/re-auth
- [ ] SameSite cookies для sessions
- [ ] UI indicators для важных actions (модалы, не inline buttons)

**Для security review:**
- [ ] Все страницы защищены от framing
- [ ] Особое внимание к: delete, payment, settings pages
- [ ] Testing в разных browsers (Chrome, Firefox, Safari)
- [ ] Проверка bypass техник

**Для критичных приложений:**
- [ ] Re-authentication для high-risk operations
- [ ] CAPTCHA для automated action prevention
- [ ] Rate limiting на критичных endpoints
- [ ] Audit logging всех важных actions

