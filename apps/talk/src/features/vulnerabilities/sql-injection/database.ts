import { DatabaseSync } from 'node:sqlite'

export function createOrderDatabase() {
  const db = new DatabaseSync(':memory:')
  db.exec(`CREATE TABLE orders (id INTEGER, customer_id TEXT, customer TEXT, product TEXT, address TEXT);
    INSERT INTO orders VALUES
    (101, 'alex', 'Алекс', 'Кабель ВВГ', 'ул. Лесная, 10'),
    (102, 'alex', 'Алекс', 'Автомат 16А', 'ул. Лесная, 10'),
    (201, 'maria', 'Мария', 'Светильник', 'ул. Садовая, 25'),
    (301, 'ivan', 'Иван', 'Розетка', 'ул. Новая, 7');
    PRAGMA query_only = ON;`)
  return db
}
