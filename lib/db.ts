/**
 * In-memory demo store.
 *
 * Никаких нативных зависимостей и внешних сервисов — сид генерируется при
 * старте процесса и живёт до перезапуска сервера (перезагрузки страницы его
 * не сбрасывают). Детерминированный seed => uuid факторинг-заявок стабильны
 * между запусками, поэтому на них можно ссылаться в вики (демо IDOR).
 *
 * ⚠️ Это учебное приложение. Хранилище намеренно наивное.
 */
import { fakerRU as faker } from '@faker-js/faker';

export interface Org {
  name: string;
  inn: string;
  kpp: string;
}

export interface User {
  id: string;
  login: string;
  password: string; // plaintext — намеренно (демо)
  fio: string;
  email: string;
  org: Org;
}

export interface FactoringJob {
  uuid: string;
  org: Org;
  fio: string;
  amount: number;
  status: string;
  ownerLogin: string; // кому принадлежит — но API это НЕ проверяет (IDOR)
}

export interface Order {
  orderCode: string;
  date: string;
  supplier: string;
  status: string;
  sum: number;
}

export interface ArticleComment {
  id: string;
  author: string;
  html: string; // рендерится СЫРЫМ (stored XSS)
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  bodyHtml: string; // рендерится через dangerouslySetInnerHTML (DOM XSS sink)
  comments: ArticleComment[];
}

export interface DemoDB {
  users: User[];
  sessions: Map<string, string>; // sessionId -> login
  jobs: FactoringJob[];
  orders: Order[];
  articles: Article[];
}

const ORDER_STATUSES = [
  'Новый',
  'В обработке',
  'Отгружен',
  'Доставлен',
  'Отменён',
];
const JOB_STATUSES = ['На проверке', 'Одобрена', 'Отклонена', 'Выплачена'];

function makeOrg(): Org {
  return {
    name: faker.company.name(),
    inn: faker.string.numeric({ length: 10 }),
    kpp: faker.string.numeric({ length: 9 }),
  };
}

function seed(): DemoDB {
  faker.seed(20260817);

  // Известные аккаунты для входа (демонстрируются на экране логина).
  const knownUsers: User[] = [
    {
      id: faker.string.uuid(),
      login: 'ivanov',
      password: 'qwerty123',
      fio: 'Иванов Иван Иванович',
      email: 'ivanov@vendor.example',
      org: { name: 'ООО «Электрокомплект»', inn: '7701234567', kpp: '770101001' },
    },
    {
      id: faker.string.uuid(),
      login: 'petrova',
      password: 'petrova2024',
      fio: 'Петрова Мария Сергеевна',
      email: 'petrova@vendor.example',
      org: { name: 'АО «СветоТехника»', inn: '7809876543', kpp: '780901001' },
    },
  ];

  const fakerUsers: User[] = Array.from({ length: 3 }, () => {
    const fio = faker.person.fullName();
    return {
      id: faker.string.uuid(),
      login: faker.internet.username().toLowerCase(),
      password: faker.internet.password({ length: 10 }),
      fio,
      email: faker.internet.email(),
      org: makeOrg(),
    };
  });

  const users = [...knownUsers, ...fakerUsers];

  // Факторинг-заявки: часть принадлежит ivanov, часть — другим (для IDOR).
  const jobs: FactoringJob[] = Array.from({ length: 8 }, (_, i) => {
    const owner = users[i % users.length];
    return {
      uuid: faker.string.uuid(),
      org: owner.org,
      fio: owner.fio,
      amount: faker.number.int({ min: 50_000, max: 5_000_000 }),
      status: faker.helpers.arrayElement(JOB_STATUSES),
      ownerLogin: owner.login,
    };
  });

  const orders: Order[] = Array.from({ length: 26 }, () => ({
    orderCode: `ЗК-${faker.string.numeric({ length: 6 })}`,
    date: faker.date
      .recent({ days: 90 })
      .toLocaleDateString('ru-RU'),
    supplier: faker.company.name(),
    status: faker.helpers.arrayElement(ORDER_STATUSES),
    sum: faker.number.int({ min: 1_000, max: 900_000 }),
  }));

  const articles: Article[] = [
    {
      id: 'onboarding',
      title: 'Как начать работу поставщиком в iPRO OneTeam',
      category: 'Начало работы',
      bodyHtml:
        '<p>Добро пожаловать в личный кабинет поставщика. Здесь вы управляете товарами, ценами, поставками и документами.</p><p>Для доступа ко всем разделам заключите договор через раздел <b>Профиль → Договоры</b>.</p>',
      comments: [
        {
          id: faker.string.uuid(),
          author: 'Петрова М.С.',
          html: 'Подскажите, где скачать шаблон прайс-листа?',
          createdAt: faker.date.recent({ days: 10 }).toLocaleString('ru-RU'),
        },
      ],
    },
    {
      id: 'pricing',
      title: 'Загрузка и обновление цен',
      category: 'Ценообразование',
      bodyHtml:
        '<p>Цены загружаются в разделе <b>Ценообразование → Цены</b>. Поддерживаются форматы XLSX и CSV.</p>',
      comments: [],
    },
    {
      id: 'logistics',
      title: 'Сроки поставки и логистические данные',
      category: 'Логистика',
      bodyHtml:
        '<p>Укажите сроки поставки для каждой товарной позиции в разделе <b>Логистические данные</b>.</p>',
      comments: [],
    },
  ];

  return {
    users,
    sessions: new Map<string, string>(),
    jobs,
    orders,
    articles,
  };
}

// Singleton, переживающий HMR в dev.
const globalRef = globalThis as unknown as { __IPRO_DEMO_DB__?: DemoDB };
export const db: DemoDB = globalRef.__IPRO_DEMO_DB__ ?? (globalRef.__IPRO_DEMO_DB__ = seed());
