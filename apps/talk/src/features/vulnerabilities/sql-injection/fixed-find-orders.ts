import type { DatabaseSync } from 'node:sqlite'

export function fixedFindOrders(db: DatabaseSync, userId: string, search: string) {
  // ИСПРАВЛЕНО: структура SQL неизменна. Значения передаются отдельно.
  const sql = 'SELECT * FROM orders WHERE customer_id = ? AND product LIKE ?'
  const parameters = [userId, `%${search}%`]
  return { sql, parameters, orders: db.prepare(sql).all(...parameters) }
}
