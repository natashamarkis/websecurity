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
| 7 | Frontend | Сторонние скрипты / Magecart | `/talk/third-party-scripts/0`: чат поставщика, защита, код, живое демо checkout |
| 8 | Frontend | Open Redirects | Демо нет; материалы в `security-guide/module/06-open-redirects.md` |
| 9 | Frontend | Clickjacking | Есть заголовки в fixed; сценария с внешним iframe нет |
| 10 | Frontend | Prototype Pollution | Демо нет; материалы в `security-guide/module/07-prototype-pollution.md` |
| 12 | Backend | SSRF | Демо нет; материалы в `security-guide/module/08-ssrf.md` |
| 13 | Backend | Session Management | Учебные cookie и отдельная сессия CSRF-профиля; полноценного входа и демо этой темы нет |
| 14 | Backend | SQL Injection | Демо и отдельного раздела гайда нет |
| 15 | Backend | Brute Force / Credential Stuffing | Демо и отдельного раздела гайда нет |
| 16 | Backend | Insecure File Download | Демо и отдельного раздела гайда нет |

Все темы доступны как теоретические слайды. Веб-презентация содержит 15 модулей,
28 экранов: 17 исходных слайдов, два дополнительных экрана XSS и по три CSRF, зависимостей и сторонних скриптов.
XSS, CSRF, зависимости и сторонние скрипты содержат живые демо; у других тем кнопок запуска атак нет.
Data Exposure из старого гайда не является отдельной темой нового PPTX.

## Основа реализации

XSS связывает демонстрацию, механизм атаки, уязвимый код, исправление
и переключение на режим `fixed` прямо в том же демо. Серверная часть сейчас находится
в Route Handlers приложения Next.js. Отдельного Express-приложения нет.

CSRF использует отдельный origin: локальный сервер `scripts/csrf-attacker.mjs`
на порту 3001. Форма меняет адрес доставки на основном сайте (3000).
Защита проверяется на сервере, реализации находятся рядом в `features/vulnerabilities/csrf`.
Для clickjacking отдельного сценария пока нет. Старые заготовки `apps/evil`
не возвращались. Тот же локальный сервер отдаёт сторонний чат и принимает
только предопределённые данные checkout-демо. Реализация модуля находится
в `features/vulnerabilities/third-party-scripts`, сценарий — в `docs/demo/third-party-scripts.md`.

## Замечания к источникам

- Сторонние скрипты: сценарий вдохновлён Ticketmaster / Inbenta (2018), но не является
  точной реконструкцией. Чат продолжает работать, а добавленный код читает форму.
  Исправление: не загружать сторонний скрипт на checkout. SRI остаётся дополнительной темой.
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
