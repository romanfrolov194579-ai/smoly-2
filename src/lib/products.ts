import type { Category, ProductItem, Subcategory, Variant } from "./types";

export const CATEGORIES: Category[] = [
  { id: "accounts", label: "Аккаунты", accent: "blue" },
  { id: "sims", label: "Симки ЛК", accent: "amber" },
  { id: "banks", label: "Банки ЛК", accent: "violet" },
];

const warranty: Variant[] = [
  { id: "std", label: "Без гарантии", delta: 0 },
  { id: "w14", label: "Гарантия 14 дней", delta: 120 },
  { id: "w30", label: "Гарантия 30 дней", delta: 250 },
];

const std: Variant[] = [{ id: "std", label: "Стандарт", delta: 0 }];

/**
 * Catalogue. Each subcategory holds one or more `ProductItem`s.
 * `photo` is intentionally `null` everywhere — paste a direct image URL from
 * your image host into the matching field and the card / product page will
 * render it automatically (see `PhotoSlot` in components/primitives.tsx).
 */
export const SUBCATEGORIES: Subcategory[] = [
  /* ---------------------------- Аккаунты ---------------------------- */
  {
    id: "yandex-split",
    categoryId: "accounts",
    name: "Яндекс.Сплит",
    emoji: "🟡",
    badge: "Хит",
    items: [
      {
        id: "ys-10k",
        name: "Сплит · лимит 10 000 ₽",
        price: 490,
        photo: null, // <-- ссылка на фото товара
        short: "Базовый лимит, почта в комплекте, без привязки карты.",
        description:
          "Учётная запись Яндекс с активированным Сплитом на 10 000 ₽. Подходит для первых покупок и тестовых заказов. Почта для восстановления передаётся вместе с аккаунтом, карта не привязана.",
        perks: ["Лимит 10 000 ₽", "Почта в комплекте", "Без привязки карты"],
        variants: warranty,
      },
      {
        id: "ys-30k",
        name: "Сплит · лимит 30 000 ₽",
        price: 890,
        photo: null, // <-- ссылка на фото товара
        short: "Расширенный лимит + прогретая история профиля.",
        description:
          "Аккаунт со Сплитом на 30 000 ₽ и историей использования 2+ месяца. Прошёл первичный прогрев, подходит для регулярных покупок и разделения средних чеков.",
        perks: ["Лимит 30 000 ₽", "История 2+ мес.", "Вериф. почта"],
        variants: warranty,
      },
      {
        id: "ys-50k",
        name: "Сплит · лимит 50 000 ₽",
        price: 1390,
        photo: null, // <-- ссылка на фото товара
        short: "Полный лимит, верифицированная почта, чистая история.",
        description:
          "Флагманский вариант Сплита на 50 000 ₽. Полностью верифицированный профиль, чистая платёжная история, стабильный доступ. Оптимален для крупных покупок с разделением.",
        perks: ["Лимит 50 000 ₽", "Вериф. почта", "Чистая история"],
        variants: warranty,
      },
      {
        id: "ys-100k",
        name: "Сплит · Премиум 100 000 ₽",
        price: 2490,
        photo: null, // <-- ссылка на фото товара
        short: "Максимальный лимит + расширенная гарантия 30 дней.",
        description:
          "Премиум-аккаунт со Сплитом на 100 000 ₽. Максимальный доступный лимит, длинная история операций, приоритетная замена в рамках гарантии 30 дней.",
        perks: ["Лимит 100 000 ₽", "Длинная история", "Приоритет замены"],
        variants: warranty,
      },
    ],
  },
  {
    id: "avito",
    categoryId: "accounts",
    name: "Авито",
    emoji: "🟢",
    items: [
      {
        id: "avito-std",
        name: "Авито · прогретый профиль",
        price: 249,
        photo: null, // <-- ссылка на фото товара
        short: "Профиль с рейтингом и историей объявлений 6+ мес.",
        description:
          "Учётная запись Авито с живой историей объявлений и положительным рейтингом. Верификация по почте, без действующих блокировок, возраст профиля от 6 месяцев.",
        perks: ["Возраст 6+ мес.", "Вериф. по почте", "Без блоков"],
        variants: warranty,
      },
    ],
  },
  {
    id: "gosuslugi",
    categoryId: "accounts",
    name: "Госуслуги",
    emoji: "🔵",
    badge: "Премиум",
    items: [
      {
        id: "gosu-confirmed",
        name: "Госуслуги · подтверждённая ЕСИА",
        price: 1490,
        photo: null, // <-- ссылка на фото товара
        short: "Подтверждённая учётка с паспортом и СНИЛС.",
        description:
          "Полностью подтверждённая учётная запись Госуслуг (ЕСИА). Привязаны паспорт и СНИЛС, доступен весь функционал портала: штрафы, документы, записи, справки.",
        perks: ["ЕСИА подтверждён", "Паспорт + СНИЛС", "Полный доступ"],
        variants: std,
      },
    ],
  },
  {
    id: "max",
    categoryId: "accounts",
    name: "MAX",
    emoji: "🟣",
    items: [
      {
        id: "max-sub",
        name: "MAX · активная подписка",
        price: 199,
        photo: null, // <-- ссылка на фото товара
        short: "Стриминг без ограничений, 4K + оффлайн, до 5 устройств.",
        description:
          "Аккаунт стримингового сервиса MAX с активной подпиской. Поддержка 4K, загрузка в оффлайн, одновременный просмотр до 5 устройств.",
        perks: ["Подписка активна", "4K + оффлайн", "До 5 устройств"],
        variants: warranty,
      },
    ],
  },
  {
    id: "wb-limit",
    categoryId: "accounts",
    name: "ВБ Лимит",
    emoji: "🟪",
    items: [
      {
        id: "wb-wallet",
        name: "WB Кошелёк · расширенный лимит",
        price: 790,
        photo: null, // <-- ссылка на фото товара
        short: "Кошелёк WB с лимитом до 100 000 ₽ и кэшбеком.",
        description:
          "WB Кошелёк с расширенным лимитом до 100 000 ₽. Самовывоз без паспорта, активный кэшбек, стабильный доступ в приложение Wildberries.",
        perks: ["Лимит 100 000 ₽", "Самовывоз без паспорта", "Кэшбек активен"],
        variants: warranty,
      },
    ],
  },

  /* ----------------------------- Симки ЛК ---------------------------- */
  {
    id: "sim-t2",
    categoryId: "sims",
    name: "Т2",
    emoji: "📱",
    items: [
      {
        id: "t2-lk",
        name: "Т2 · личный кабинет",
        price: 320,
        photo: null, // <-- ссылка на фото товара
        short: "Полный доступ в ЛК, регион МСК, баланс 0 ₽.",
        description:
          "Сим-карта Т2 с полным доступом в личный кабинет на оформленного номинала. Баланс нулевой, регион — Москва, без задолженностей.",
        perks: ["Полный ЛК", "Баланс 0 ₽", "Регион МСК"],
        variants: warranty,
      },
    ],
  },
  {
    id: "sim-mega",
    categoryId: "sims",
    name: "Мегафон",
    emoji: "📶",
    badge: "Стабильно",
    items: [
      {
        id: "mega-lk",
        name: "Мегафон · ЛК + Госключ",
        price: 360,
        photo: null, // <-- ссылка на фото товара
        short: "Личный кабинет с Госключом, возраст симки 3+ мес.",
        description:
          "Сим-карта Мегафон с доступом в приложение и подключённым Госключом. Возраст симки от 3 месяцев, без долгов, стабильная регистрация.",
        perks: ["ЛК + Госключ", "Без долгов", "Возраст 3+ мес."],
        variants: warranty,
      },
    ],
  },
  {
    id: "sim-beeline",
    categoryId: "sims",
    name: "Билайн",
    emoji: "📲",
    items: [
      {
        id: "bee-lk",
        name: "Билайн · активная регистрация",
        price: 340,
        photo: null, // <-- ссылка на фото товара
        short: "Номер с активной регистрацией и паспортом номинала.",
        description:
          "Сим-карта Билайн с активной регистрацией и доступом в личный кабинет. Паспорт номинала передаётся по запросу, без действующих блокировок.",
        perks: ["Доступ в ЛК", "Паспорт номинала", "Без блокировок"],
        variants: warranty,
      },
    ],
  },
  {
    id: "sim-mts",
    categoryId: "sims",
    name: "MTS",
    emoji: "📞",
    items: [
      {
        id: "mts-lk",
        name: "MTS · ЛК + eSIM по запросу",
        price: 390,
        photo: null, // <-- ссылка на фото товара
        short: "Полный личный кабинет, выпуск eSIM по запросу.",
        description:
          "Сим-карта MTS с полным доступом в личный кабинет. Выпуск eSIM и подключение МТС Деньги — по запросу. Регион согласуется отдельно.",
        perks: ["Полный ЛК", "eSIM по запросу", "Регион на выбор"],
        variants: warranty,
      },
    ],
  },

  /* ---------------------------- Банки ЛК ----------------------------- */
  {
    id: "bank-ozon",
    categoryId: "banks",
    name: "Ozon Банк",
    emoji: "🏦",
    items: [
      {
        id: "ozon-lk",
        name: "Ozon Банк · виртуальная карта",
        price: 890,
        photo: null, // <-- ссылка на фото товара
        short: "Личный кабинет с выпущенной виртуальной картой и СБП.",
        description:
          "Личный кабинет Ozon Банка с выпущенной виртуальной картой и подключённым СБП. Баланс нулевой, история операций чистая.",
        perks: ["Карта выпущена", "Баланс 0 ₽", "СБП подключён"],
        variants: warranty,
      },
    ],
  },
  {
    id: "bank-t",
    categoryId: "banks",
    name: "Т-Банк",
    emoji: "💳",
    badge: "Топ",
    items: [
      {
        id: "t-lk",
        name: "Т-Банк · дебетовый + брокер",
        price: 1790,
        photo: null, // <-- ссылка на фото товара
        short: "Полноценный ЛК с дебетовой картой и брокерским счётом.",
        description:
          "Личный кабинет Т-Банка с активной дебетовой картой и открытым брокерским счётом. Живая история операций, полный функционал приложения.",
        perks: ["Дебетовая карта", "Брокерский счёт", "История операций"],
        variants: warranty,
      },
    ],
  },
  {
    id: "bank-alfa",
    categoryId: "banks",
    name: "Alfa Bank",
    emoji: "🔴",
    items: [
      {
        id: "alfa-lk",
        name: "Alfa · ЛК + Alfa-Mobile",
        price: 1490,
        photo: null, // <-- ссылка на фото товара
        short: "Личный кабинет с картой и кэшбек-категориями.",
        description:
          "Личный кабинет Alfa Bank с активной картой в Alfa-Mobile, настроенными кэшбек-категориями и переводами без лимита внутри банка.",
        perks: ["Карта в приложении", "Кэшбек-категории", "Переводы без лимита"],
        variants: warranty,
      },
    ],
  },
  {
    id: "bank-sber",
    categoryId: "banks",
    name: "Сбербанк",
    emoji: "🟩",
    badge: "Премиум",
    items: [
      {
        id: "sber-lk",
        name: "Сбер · СберБанк Онлайн",
        price: 2190,
        photo: null, // <-- ссылка на фото товара
        short: "СберБанк Онлайн с активным Сбер ID и историей 6+ мес.",
        description:
          "Полная учётная запись СберБанк Онлайн с активным Сбер ID, подключённым СБП и переводами. История операций от 6 месяцев, стабильный вход.",
        perks: ["Сбер ID активен", "СБП + переводы", "История 6+ мес."],
        variants: warranty,
      },
    ],
  },
];

export function subsByCategory(id: Category["id"]): Subcategory[] {
  return SUBCATEGORIES.filter((s) => s.categoryId === id);
}

export function getSubcategory(id: string): Subcategory | undefined {
  return SUBCATEGORIES.find((s) => s.id === id);
}

export function findItem(itemId: string): { sub: Subcategory; item: ProductItem } | undefined {
  for (const sub of SUBCATEGORIES) {
    const item = sub.items.find((i) => i.id === itemId);
    if (item) return { sub, item };
  }
  return undefined;
}
