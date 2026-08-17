export interface WikiEntry {
  id: string;
  title: string;
  cwe: string;
  owasp: string;
  severity: 'Высокая' | 'Средняя' | 'Критическая';
  what: string;
  where: string;
  howToAbuse: string[];
  payload?: string;
  impact: string;
  fix: string;
  liveHref: string;
  liveLabel: string;
}

export const WIKI: WikiEntry[] = [
  {
    id: 'reflected-xss',
    title: 'Reflected XSS',
    cwe: 'CWE-79',
    owasp: 'A03:2021 — Injection',
    severity: 'Высокая',
    what: 'Данные из запроса (например, строка поиска) возвращаются в разметку страницы без экранирования и исполняются в браузере жертвы.',
    where:
      'Экран «Заказы»: значение фильтра по коду заказа отображается как «чип» через dangerouslySetInnerHTML (в оригинале — эхо фильтра в TagsGroup через useFilterToTag).',
    howToAbuse: [
      'Откройте экран «Заказы».',
      'Введите в поиск payload вместо кода заказа.',
      'Значение отрисуется как чип — сработает JavaScript.',
    ],
    payload: '<img src=x onerror=alert(document.domain)>',
    impact:
      'Выполнение произвольного JS в сессии жертвы: кража куки/токенов, действия от её имени, фишинг.',
    fix: 'Никогда не вставлять пользовательский ввод как HTML. Рендерить как текст (React экранирует по умолчанию), а при необходимости HTML — санитайзить (DOMPurify) и включить CSP.',
    liveHref: '/orders',
    liveLabel: 'Открыть «Заказы»',
  },
  {
    id: 'stored-xss',
    title: 'Stored XSS',
    cwe: 'CWE-79',
    owasp: 'A03:2021 — Injection',
    severity: 'Критическая',
    what: 'Вредоносный скрипт сохраняется на сервере (комментарий, профиль, статья) и исполняется у каждого, кто открывает страницу.',
    where:
      'Экран «База знаний»: комментарии к статье сохраняются и рендерятся через dangerouslySetInnerHTML (в оригинале — ParsedArticle рендерит серверный HTML статьи).',
    howToAbuse: [
      'Откройте любую статью в «Базе знаний».',
      'Добавьте комментарий с payload и отправьте.',
      'Откройте статью заново — payload выполнится (и будет срабатывать у всех).',
    ],
    payload: '<img src=x onerror="alert(\'Сессия: \'+document.cookie)">',
    impact:
      'Массовая компрометация: кука session-id не HttpOnly, поэтому payload крадёт живую сессию любого читателя.',
    fix: 'Санитизация на входе и выходе (DOMPurify), экранирование при рендере, CSP, а куки сессии — HttpOnly.',
    liveHref: '/knowledge-base',
    liveLabel: 'Открыть «Базу знаний»',
  },
  {
    id: 'dom-xss',
    title: 'DOM-based XSS',
    cwe: 'CWE-79',
    owasp: 'A03:2021 — Injection',
    severity: 'Высокая',
    what: 'Уязвимость целиком на клиенте: скрипт формируется из данных и попадает в опасный DOM-sink (innerHTML / dangerouslySetInnerHTML) без санитизации.',
    where:
      'Экран «База знаний»: тело статьи (bodyHtml) вставляется в DOM через dangerouslySetInnerHTML — это тот самый sink.',
    howToAbuse: [
      'Тело статьи, пришедшее с сервера, вставляется как сырой HTML.',
      'Любой HTML/JS в этом поле исполнится при рендере статьи.',
    ],
    payload: '<svg onload=alert(1)>',
    impact:
      'То же, что у stored/reflected XSS, но источник — клиентский код и небезопасный sink.',
    fix: 'Избегать innerHTML/dangerouslySetInnerHTML; если HTML необходим — DOMPurify.sanitize() перед вставкой; Trusted Types.',
    liveHref: '/knowledge-base',
    liveLabel: 'Открыть «Базу знаний»',
  },
  {
    id: 'idor',
    title: 'IDOR / Broken Access Control',
    cwe: 'CWE-639',
    owasp: 'A01:2021 — Broken Access Control',
    severity: 'Критическая',
    what: 'Объект адресуется по идентификатору (uuid/id), но сервер не проверяет, что он принадлежит текущему пользователю.',
    where:
      'Экран «Факторинг»: GET/POST /api/job/:uuid не сверяет владельца (в оригинале — reports.saga GET ${api}/job/:uuid без проверки прав).',
    howToAbuse: [
      'Откройте свою факторинг-заявку.',
      'Замените uuid в адресной строке на чужой (см. раздел «Все заявки»).',
      'Вы видите и можете менять чужую заявку.',
    ],
    impact:
      'Доступ к данным и операциям других организаций: просмотр, изменение статуса, утечка ПДн/коммерческой тайны.',
    fix: 'Проверка владельца/прав на каждый доступ к объекту на сервере (object-level authorization), а не только «пользователь залогинен».',
    liveHref: '/factoring',
    liveLabel: 'Открыть «Факторинг»',
  },
  {
    id: 'csrf',
    title: 'CSRF',
    cwe: 'CWE-352',
    owasp: 'A01:2021 — Broken Access Control',
    severity: 'Высокая',
    what: 'Сторонний сайт заставляет браузер жертвы отправить изменяющий запрос с её кукой — без ведома пользователя.',
    where:
      'Экран «Факторинг»: POST /api/job/:uuid без CSRF-токена, кука SameSite=None (в оригинале CSRF-токенов нет ни на одном state-changing запросе).',
    howToAbuse: [
      'Откройте заявку и нажмите «Сформировать CSRF-PoC».',
      'Страница csrf-poc.html сама отправит POST с вашей кукой.',
      'Для «настоящего» кросс-сайта откройте csrf-poc.html с диска (file://).',
    ],
    impact:
      'Изменение состояния от имени жертвы: смена статуса заявки, разлогин, любые незащищённые POST/DELETE.',
    fix: 'Анти-CSRF токены (double-submit / synchronizer), проверка Origin/Referer, куки SameSite=Lax/Strict для сессии.',
    liveHref: '/factoring',
    liveLabel: 'Открыть «Факторинг»',
  },
  {
    id: 'open-redirect',
    title: 'Open Redirect',
    cwe: 'CWE-601',
    owasp: 'A01:2021 — Broken Access Control',
    severity: 'Средняя',
    what: 'Приложение перенаправляет на URL из параметра запроса без проверки — удобно для фишинга под доверенным доменом.',
    where:
      'Экран «Вход»: параметр returnUrl уходит в window.location.assign без allowlist (ровно как в оригинальном LoginForm).',
    howToAbuse: [
      'Откройте /login?returnUrl=https://example.com',
      'Выполните вход тестовым аккаунтом.',
      'После входа произойдёт переход на внешний адрес.',
    ],
    payload: '/login?returnUrl=https://example.com',
    impact:
      'Фишинг: жертва видит доверенную форму входа, но улетает на сайт атакующего; кража учётных данных, обход доверия.',
    fix: 'Разрешать только относительные пути или allowlist доменов; не редиректить на произвольный внешний URL.',
    liveHref: '/login?returnUrl=https://example.com',
    liveLabel: 'Открыть демо входа',
  },
];
