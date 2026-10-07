import type { DatabaseSync } from 'node:sqlite'

export function findOrders(db: DatabaseSync, userId: string, search: string) {
  // УЯЗВИМО: строка поиска становится частью SQL, включая кавычки и операторы.
  const sql = `SELECT * FROM orders WHERE customer_id = '${userId}' AND product LIKE '%${search}%'`
  return { sql, parameters: [], orders: db.prepare(sql).all() }
}
