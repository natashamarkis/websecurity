## 7. Prototype Pollution

### Что это такое

Prototype Pollution — это уязвимость в JavaScript, при которой злоумышленник может модифицировать прототип базовых JavaScript объектов (`Object.prototype`, `Array.prototype`, и т.д.). Так как все объекты в JavaScript наследуют свойства от прототипов, загрязнение прототипа может повлиять на все объекты в приложении, приводя к XSS, обходу security checks, или Denial of Service.

**CVSS Score:** 5.6 - 9.8 (в зависимости от exploit-ability)
**CWE ID:** CWE-1321, CWE-915
**OWASP Top 10:** A08:2021 – Software and Data Integrity Failures

### Как работает механизм атаки

Prototype Pollution эксплуатирует динамическую природу JavaScript:

1. **Vulnerable Code:** Приложение принимает user input и использует его для установки свойств объекта
2. **__proto__ Manipulation:** Злоумышленник использует специальные ключи (`__proto__`, `constructor`, `prototype`)
3. **Prototype Modified:** Прототип базового объекта модифицируется
4. **Global Impact:** Все новые и существующие объекты наследуют загрязненные свойства
5. **Security Bypass / XSS:** Приложение использует загрязненное свойство для security check или rendering

**Визуализация:**
```javascript
const user = {};
console.log(user.isAdmin); // undefined

// Prototype pollution:
Object.prototype.isAdmin = true;

// Теперь ВСЕ объекты имеют isAdmin: true
const newUser = {};
console.log(newUser.isAdmin); // true ⚠️

const admin = {};
console.log(admin.isAdmin); // true ⚠️
```

### Типы Prototype Pollution

#### 7.1 Client-Side Prototype Pollution

**Характеристики:**
- Происходит в браузере через unsafe merge/extend functions
- Часто ведет к DOM XSS
- Может использоваться для обхода sanitization

**Уязвимый код:**
```javascript
// ❌ Опасная функция merge
function merge(target, source) {
    for (let key in source) {
        if (typeof source[key] === 'object') {
            target[key] = merge(target[key] || {}, source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

// Эксплуатация:
const userInput = JSON.parse('{"__proto__": {"isAdmin": true}}');
const config = {};
merge(config, userInput);

// Теперь ВСЕ объекты загрязнены:
const newObj = {};
console.log(newObj.isAdmin); // true
```

**Impact:** ВЫСОКИЙ - может вести к XSS или security bypass

#### 7.2 Server-Side Prototype Pollution (Node.js)

**Характеристики:**
- Происходит на Node.js server
- Более критично из-за shared memory между requests
- Может привести к RCE в некоторых случаях

**Уязвимый код:**
```javascript
// Express.js endpoint
app.post('/update-settings', (req, res) => {
    const settings = {};

    // ❌ Небезопасно - merge user input
    Object.assign(settings, req.body);

    // Если req.body = {"__proto__": {"isAdmin": true}}
    // Все последующие объекты будут иметь isAdmin: true!

    const user = {};
    if (user.isAdmin) {
        // Grant admin access - SECURITY BYPASS!
    }
});
```

**Impact:** КРИТИЧЕСКИЙ - security bypass, potential RCE

#### 7.3 Prototype Pollution via Dependencies

**Характеристики:**
- Уязвимости в популярных библиотеках (lodash, jQuery, minimist)
- Часто не патчатся быстро
- Массовый impact

**Примеры vulnerable libraries:**
```javascript
// lodash <= 4.17.19
_.merge({}, JSON.parse('{"__proto__": {"polluted": true}}'));

// jQuery <= 3.3.1
$.extend(true, {}, JSON.parse('{"__proto__": {"polluted": true}}'));

// minimist (command line parser)
// node app.js --__proto__.polluted=true
```

**Impact:** ВЫСОКИЙ - widespread vulnerability

### Реальные кейсы с финансовым impact

#### Lodash (CVE-2019-10744) - CVSS 9.1

**Что произошло:**
Критическая Prototype Pollution уязвимость в функциях `merge`, `mergeWith`, `defaultsDeep` библиотеки lodash.

**Механизм:**
```javascript
// Lodash version <= 4.17.11
const _ = require('lodash');

// Эксплуатация:
const payload = JSON.parse('{"__proto__": {"polluted": "Yes"}}');
_.merge({}, payload);

// Проверка:
console.log({}.polluted); // "Yes" - все объекты загрязнены!

// Более опасный payload для RCE:
const rcePayload = {
    "__proto__": {
        "shell": "/bin/bash",
        "execPath": "/usr/bin/node",
        "argv0": "console.log('RCE')"
    }
};
```

**Результат:**
- Затронуто: 4+ миллиона npm packages зависят от lodash
- CVSS Score: 9.1 (Critical)
- Exploit в дикой природе обнаружен
- GitHub 600,000+ зависимых репозиториев
- Patched в версии 4.17.12

**Урок:** Даже самые популярные библиотеки могут иметь критические уязвимости.

#### jQuery (CVE-2019-11358) - Mass Impact

**Что произошло:**
Prototype Pollution в `$.extend()` функции jQuery.

**Механизм:**
```javascript
// jQuery <= 3.3.1
$.extend(true, {}, {
    "__proto__": {
        "polluted": "true"
    }
});

// Все объекты теперь имеют polluted property
console.log({}.polluted); // "true"
```

**Результат:**
- Затронуто: Миллионы сайтов использующих jQuery
- CVSS Score: 6.1 (Medium, но massive scale)
- jQuery используется на ~75% всех сайтов (на момент уязвимости)
- Patched в версии 3.4.0
- Многие сайты до сих пор уязвимы (не обновились)

**Урок:** Legacy код и slow updates = prolonged exposure.

#### Node.js Express - RCE через Prototype Pollution (2022)

**Что произошло:**
Цепочка уязвимостей: Prototype Pollution → Template Engine exploitation → RCE.

**Механизм:**
```javascript
// Шаг 1: Prototype Pollution через body-parser
app.post('/update', (req, res) => {
    Object.assign({}, req.body); // Загрязнение прототипа
});

// POST /update
// {"__proto__": {"outputFunctionName": "console.log(global.process.mainModule.require('child_process').execSync('whoami').toString());x"}}

// Шаг 2: Template rendering использует загрязненное свойство
app.get('/render', (req, res) => {
    res.render('template'); // EJS template engine
    // EJS reads outputFunctionName from options
    // Которое было загрязнено, ведет к code execution
});
```

**Результат:**
- RCE на множестве Node.js приложений
- Combination attack (pollution + template injection)
- Bug bounties: $10,000 - $30,000 на различных platforms

**Урок:** Prototype Pollution может быть звеном в цепочке атак к RCE.

### Методы защиты

#### 1. Object.create(null) для безопасных объектов

**Создание объектов без prototype:**
```javascript
// ✅ Безопасный объект - не имеет prototype
const safeObj = Object.create(null);
safeObj.data = 'value';

console.log(safeObj.__proto__); // undefined
console.log(safeObj.constructor); // undefined

// Загрязнение не повлияет на этот объект
Object.prototype.polluted = true;
console.log(safeObj.polluted); // undefined ✅
```

#### 2. Безопасная функция merge

**Правильная реализация:**
```javascript
// ✅ Безопасный merge
function safeMerge(target, source) {
    const BLOCKED_KEYS = ['__proto__', 'constructor', 'prototype'];

    for (let key in source) {
        // Проверка 1: собственное свойство
        if (!Object.prototype.hasOwnProperty.call(source, key)) {
            continue;
        }

        // Проверка 2: blacklist опасных ключей
        if (BLOCKED_KEYS.includes(key)) {
            continue;
        }

        // Проверка 3: тип значения
        if (typeof source[key] === 'object' && source[key] !== null) {
            target[key] = safeMerge(target[key] || {}, source[key]);
        } else {
            target[key] = source[key];
        }
    }

    return target;
}

// Тест:
const malicious = JSON.parse('{"__proto__": {"polluted": true}}');
const config = {};
safeMerge(config, malicious);

console.log({}.polluted); // undefined ✅ защищено
```

#### 3. Freeze критичных прототипов

**Заморозка Object.prototype:**
```javascript
// ✅ Защита через freezing
Object.freeze(Object.prototype);
Object.freeze(Array.prototype);

// Попытка загрязнения теперь не работает:
Object.prototype.polluted = true;
console.log({}.polluted); // undefined ✅

// В strict mode это выбросит ошибку
'use strict';
Object.prototype.polluted = true; // TypeError!
```

**Осторожно:** Freezing может сломать некоторые библиотеки, которые модифицируют прототипы.

#### 4. Используйте Map вместо plain objects

**Map безопасен от pollution:**
```javascript
// ✅ Map не имеет prototype pollution проблем
const safeMap = new Map();
safeMap.set('__proto__', 'value');

console.log(safeMap.get('__proto__')); // 'value'
console.log({}.hasOwnProperty('__proto__')); // false ✅

// WeakMap для приватных данных
const privateData = new WeakMap();
privateData.set(user, { sensitive: 'data' });
```

#### 5. JSON Schema Validation

**Валидация перед merge:**
```javascript
const Ajv = require('ajv');
const ajv = new Ajv();

// ✅ Определяем строгую schema
const schema = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        age: { type: 'number' }
    },
    additionalProperties: false  // Блокирует неожиданные ключи
};

const validate = ajv.compile(schema);

app.post('/update', (req, res) => {
    if (!validate(req.body)) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    // Безопасно merge после валидации
    const config = {};
    Object.assign(config, req.body);
});
```

#### 6. Обновление зависимостей

**Regular updates:**
```bash
# Проверка на известные уязвимости
npm audit

# Lodash: обновить до >= 4.17.21
npm install lodash@latest

# jQuery: обновить до >= 3.4.0
npm install jquery@latest

# Автоматизация через Dependabot/Snyk/Renovate
```

### Как тестировать

#### Ручное тестирование

**1. Базовый тест:**
```javascript
// Тестовый payload
const testPayload = {
    "__proto__": {
        "testPolluted": "yes"
    }
};

// Попытка загрязнения
yourMergeFunction({}, testPayload);

// Проверка
if ({}.testPolluted === "yes") {
    console.log("❌ VULNERABLE to Prototype Pollution!");
} else {
    console.log("✅ Protected");
}
```

**2. HTTP Request тест:**
```bash
# POST request с pollution payload
curl -X POST https://target.com/api/update \
  -H "Content-Type: application/json" \
  -d '{"__proto__": {"polluted": true}}'

# Затем проверить response или поведение приложения
```

**3. Query string pollution:**
```
https://target.com/search?__proto__[polluted]=true
https://target.com/api?constructor[prototype][polluted]=true
```

#### Автоматизированное тестирование

**Custom scanner:**
```javascript
// prototype-pollution-scanner.js
const pollutionPayloads = [
    '{"__proto__": {"polluted": true}}',
    '{"constructor": {"prototype": {"polluted": true}}}',
    '{"__proto__": {"toString": "polluted"}}',
];

async function scanForPollution(url, endpoint) {
    for (const payload of pollutionPayloads) {
        const response = await fetch(url + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
        });

        // Проверить если prototype загрязнен
        const testObj = {};
        if (testObj.polluted === true) {
            console.log(`[VULN] ${endpoint} - Prototype Pollution detected`);
            return true;
        }
    }
    return false;
}
```

**Использование специализированных инструментов:**
```bash
# PPScan - Prototype Pollution Scanner
npm install -g ppscan
ppscan --url https://target.com --wordlist payloads.txt

# Burp Extension: Server-side Prototype Pollution Scanner
# https://portswigger.net/bappstore
```

#### Runtime Detection

**Мониторинг prototype changes:**
```javascript
// ✅ Детектирование загрязнения в runtime
const originalProto = Object.getPrototypeOf({});

setInterval(() => {
    const currentProto = Object.getPrototypeOf({});

    for (let key in currentProto) {
        if (!originalProto.hasOwnProperty(key)) {
            console.error(`🚨 Prototype Pollution detected! Key: ${key}`);
            // Alert security team
            // Можно даже kill процесс для защиты
        }
    }
}, 5000); // Проверка каждые 5 секунд
```

### Контрольный чеклист

**Для разработчиков:**
- [ ] Используется `Object.create(null)` для config objects
- [ ] Safe merge functions реализованы (проверка __proto__, constructor, prototype)
- [ ] `Object.freeze(Object.prototype)` для критичных приложений
- [ ] Input validation через JSON Schema
- [ ] Map/WeakMap используется вместо plain objects где возможно
- [ ] Dependencies (lodash, jquery) обновлены до безопасных версий
- [ ] Нет использования `eval()` или `Function()` с user input
- [ ] Deep merge функции проверены на безопасность

**Для security review:**
- [ ] Code review всех merge/extend/assign операций
- [ ] Проверка на использование vulnerable libraries (lodash <4.17.21, jquery <3.4.0)
- [ ] Testing с Prototype Pollution payloads
- [ ] Runtime monitoring для production environment

**Для critical applications:**
- [ ] Object.freeze() на всех базовых прототипах
- [ ] CSP configured to prevent inline script execution
- [ ] Regular penetration testing включая Prototype Pollution
- [ ] Incident response plan для случая pollution

