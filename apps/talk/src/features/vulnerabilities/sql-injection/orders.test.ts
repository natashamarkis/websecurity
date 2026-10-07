// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { createOrderDatabase } from './database'
import { findOrders } from './find-orders'
import { fixedFindOrders } from './fixed-find-orders'

describe('real SQLite injection', () => {
  it('leaks all four orders through the vulnerable WHERE clause', () => {
    const db = createOrderDatabase()
    try {
      expect(findOrders(db, 'alex', 'Кабель').orders).toHaveLength(1)
      const result = findOrders(db, 'alex', "' OR 1=1 --")
      expect(result.orders).toHaveLength(4)
      expect(result.orders.map((row) => row.customer_id)).toContain('maria')
    } finally { db.close() }
  })
  it('binds values without changing the SQL structure', () => {
    const db = createOrderDatabase()
    try {
      for (const search of ["' OR 1=1 --", "O'Reilly", "'; DROP TABLE orders; --"]) {
        expect(fixedFindOrders(db, 'alex', search).orders).toEqual([])
      }
      expect(fixedFindOrders(db, 'alex', '').orders).toHaveLength(2)
      expect(fixedFindOrders(db, 'alex', 'Кабель').orders).toHaveLength(1)
      expect(fixedFindOrders(db, "alex' OR 1=1 --", '').orders).toEqual([])
      expect(() => db.exec('DELETE FROM orders')).toThrow()
    } finally { db.close() }
  })
})
