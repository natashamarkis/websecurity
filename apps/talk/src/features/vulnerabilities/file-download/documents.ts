export const documents = [
  { id: '1001', ownerId: 'alex', name: 'Счёт Алекса', content: 'СЧЁТ 1001\nПокупатель: Алекс\nКабель ВВГ: 12 000 руб.\nАдрес: ул. Лесная, 10' },
  { id: '1002', ownerId: 'maria', name: 'Счёт Марии', content: 'СЧЁТ 1002\nПокупатель: Мария\nСветильники: 38 000 руб.\nАдрес: ул. Садовая, 25' },
]
export type Document = typeof documents[number]
