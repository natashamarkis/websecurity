# Программа доклада

Основной источник: предоставленный `Cybersecurity.pptx`, прочитан 7 октября 2026.
В файле 17 слайдов: обложка, план, два разделителя, 12 тем и заключение.
PPTX хранится у автора, его исходный файл в рамках уборки не менялся.

## Темы в порядке презентации

| Слайд PPTX | Раздел | Тема | Состояние проекта |
| --- | --- | --- | --- |
| 4 | Frontend | XSS | Модуль `/talk/xss/0`: теория, stored XSS в комментариях, код и исправленный рендер |
| 5 | Frontend | CSRF | `/talk/csrf/0`: суть, другие защиты, код и демо доставки |
| 6 | Frontend | Уязвимые npm-зависимости | `/talk/dependencies/0`: суть, действия потребителя, package.json и демо двух версий |
| 7 | Frontend | Сторонние скрипты / Magecart | `/talk/third-party-scripts/0`: общие риски, защита, код, демо SRI на главной и в заказе |
| 8 | Frontend | Open Redirect | `/talk/open-redirects/0`: суть, фронтенд-код, демо письма с переходом на другой origin |
| 9 | Frontend | Clickjacking | `/talk/clickjacking/0`: суть, серверные заголовки и демо прозрачного iframe |
| 10 | Frontend | Prototype Pollution | Демо нет; материалы в `security-guide/module/07-prototype-pollution.md` |
| 12 | Backend | SSRF | Демо нет; материалы в `security-guide/module/08-ssrf.md` |
| 13 | Backend | Session Management | Учебные cookie и отдельная сессия CSRF-профиля; полноценного входа и демо этой темы нет |
| 14 | Backend | SQL Injection | Демо и отдельного раздела гайда нет |
| 15 | Backend | Brute Force / Credential Stuffing | Демо и отдельного раздела гайда нет |
| 16 | Backend | Insecure File Download | Демо и отдельного раздела гайда нет |

Все темы доступны как теоретические слайды. Веб-презентация содержит 15 модулей,
32 экрана: 17 исходных слайдов, по два дополнительных экрана XSS, Open Redirect и Clickjacking,
по три CSRF, зависимостей и сторонних скриптов.
XSS, CSRF, зависимости, сторонние скрипты, Open Redirect и Clickjacking содержат живые демо;
у других тем кнопок запуска атак нет.
Data Exposure из старого гайда не является отдельной темой нового PPTX.

## Основа реализации

XSS связывает демонстрацию, механизм атаки, уязвимый код, исправление
и переключение на режим `fixed` прямо в том же демо. Серверная часть сейчас находится
в Route Handlers приложения Next.js. Отдельного Express-приложения нет.

CSRF использует отдельный origin: локальный сервер `scripts/csrf-attacker.mjs`
на порту 3001. Форма меняет адрес доставки на основном сайте (3000).
Защита проверяется на сервере, реализации находятся рядом в `features/vulnerabilities/csrf`.
Clickjacking использует тот же локальный сервер: прозрачный iframe с настоящей формой
отключает уведомления. Исправленный сервер магазина запрещает встраивание заголовками.
Сценарий: `docs/demo/clickjacking.md`. Старые заготовки `apps/evil`
не возвращались. Тот же локальный сервер отдаёт сторонний чат и принимает
только предопределённые данные покупателя. Реализация модуля находится
в `features/vulnerabilities/third-party-scripts`, сценарий — в `docs/demo/third-party-scripts.md`.

## Замечания к источникам

- Clickjacking: непроверенный исторический кейс заменён локальным сценарием.
  Показываем iframe-based атаку; корректный CSRF-токен не подтверждает смысл клика.
  Заголовки должны приходить от встраиваемого сайта, не от страницы атакующего.
  [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html).

- Open Redirect: непроверенный исторический кейс Shopify заменён локальным сценарием
  письма. Уязвимость помогает фишингу, но сама по себе не крадёт пароль или cookie.
  Проверка origin находится на фронтенде; серверный редирект требует проверки на сервере.
  [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html).

- Сторонние скрипты: сценарий вдохновлён Ticketmaster / Inbenta (2018), но не является
  точной реконструкцией. Чат продолжает работать, а добавленный код читает форму.
  Исправление подмены: SRI с заранее проверенным хешем при каждом подключении,
  в том числе на главной. Это не защита от любого вредоносного поведения одобренного кода.
  [Решение ICO](https://ico.org.uk/media/action-weve-taken/mpns/2618599/ticketmaster-uk-limited-mpn.pdf),
  [SRI](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity),
  [CSP script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src).

- Модуль зависимостей демонстрирует ошибку в локальной учебной библиотеке
  `product-description-renderer`, а не реальный опубликованный npm-пакет или CVE. Исторический
  кейс event-stream заменён на этот воспроизводимый пример. Команды audit и update:
  [pnpm audit](https://pnpm.io/cli/audit), [pnpm update](https://pnpm.io/cli/update).

- Слайд 4 и старый гайд используют сумму штрафа British Airways как итоговую.
  В официальном решении ICO от 16 октября 2020 итоговый штраф составляет
  20 млн фунтов; предварительное уведомление предусматривало 183,39 млн.
  В веб-версии сумма исправлена, ссылка добавлена на слайд.
  [Решение ICO](https://ico.org.uk/media2/migrated/2618421/ba-penalty-20201016.pdf).
- История о форме комментариев в `security-guide/vulnerability-story.md` не
  подтверждена как описание инцидента British Airways. Не переносить её в доклад
  как установленный факт. Остальные исторические кейсы перенесены из авторского
  PPTX без отдельного фактчекинга; это отмечено в заметках докладчика.
- `fixed` сейчас демонстрирует экранирование комментария и `HttpOnly`, а не
  полноценную защищённую аутентификацию или строгую CSP.
- Для текущего XSS-демо cookie использует `SameSite=Lax` в обоих режимах:
  `SameSite=None` без `Secure` браузер отвергает. В CSRF используется та же политика
  `Lax`, но отдельная HttpOnly-cookie случайной сессии. Два порта одного хоста
  относятся к одному site, поэтому SameSite не блокирует эту cross-origin форму.
  [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).

Старый гайд сохранён как дополнительный материал. Он не определяет состав нового
доклада. Устаревшие рецепты сборки React/Vite + Express и неработающий CSRF PoC
для удалённого API постов убраны. Историю этих файлов можно найти в Git.
