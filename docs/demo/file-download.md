# Insecure File Download: IDOR и Path Traversal

Начало: `/talk/file-download/0`. Демо: `/site/backend/file-download`.

## Сценарий доклада

Основа: Cybersecurity.pptx, слайд 16. В первой вкладке запросить 1001: свой счёт доступен в обоих режимах. Затем 1002: vulnerable выдаёт счёт Марии, fixed 404. Во второй вкладке запросить manual.txt, затем ../internal.txt. Vulnerable действительно читает файл вне downloads, fixed запрещает. Сервер возвращает текст файла в JSON для обозримого сравнения, кнопка скачивания сохраняет именно полученные байты. Документы IDOR вымышленные в памяти, два файла traversal создаются в отдельной временной директории ОС. Дополнительный lab-reader разрешает только эти два файла даже в vulnerable: читать файлы проекта и компьютера нельзя. Исправление realpath/relative предполагает недоступное для записи атакующему хранилище, иначе возможна гонка между проверкой и чтением. IDOR и traversal требуют разных проверок. Zip Slip из PPTX относится к распаковке архивов, в данном endpoint архивов нет; отдельная демонстрация Zip Slip не реализована. Источник по traversal: https://owasp.org/www-community/attacks/Path_Traversal.

## Код

Серверная пара в `apps/talk/src/features/vulnerabilities/file-download`:
`get-document.ts` и `fixed-get-document.ts`.
Слайд читает эти же файлы. API: `POST /api/site/backend/file-download`.

Вторая пара `read-download.ts` / `fixed-read-download.ts` показывает другую границу: директорию, а не владельца.

## Общие границы лаборатории

- Только вымышленные данные. Не вводить реальные пароли, токены и адреса.
- Cookie `backend-lab` отделяет одну копию сценария от другой. Это инфраструктура стенда.
- Cookie `demo-mode` выбирает серверную реализацию. Параметр режима из JSON не принимается.
- Состояние существует до часа, максимум 200 активных копий на процесс. Перезапуск очищает его.
- При переключении режима и сбросе сервер начинает чистый сценарий. Ввод формы сохраняется для сравнения.
- Управляющие POST не принимают чужой Origin. JSON ограничен 4096 байтами.
- Кнопки сброса и выбора уязвимого режима не предназначены для production.
- Оболочка принимает только manual.txt и ../internal.txt до обращения к файловой системе, чтобы исключить обращения к UNC-путям и файлам машины. Временная папка websecurity-files-* содержит только два фикстурных файла.\n
## Проверки

`pnpm test`, `pnpm typecheck`, `pnpm validate:slides`.
Браузерные сценарии: `apps/talk/e2e/backend.spec.ts`, desktop и mobile.

## Источник

[OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html). Основной материал: Cybersecurity.pptx, слайд 16.
Непроверенные исторические суммы и привязки к инцидентам заменены воспроизводимым сценарием.
