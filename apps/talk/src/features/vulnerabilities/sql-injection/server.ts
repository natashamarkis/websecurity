import { z } from 'zod'
import { LabError, labHandler } from '@/features/backend-lab/server'
import { createOrderDatabase } from './database'
import { findOrders } from './find-orders'
import { fixedFindOrders } from './fixed-find-orders'

export const handleSql = labHandler('sql-injection', (input, context) => {
  const { search } = z.object({ search: z.string().max(200) }).strict().parse(input)
  // Страховка стенда: произвольные тяжёлые SQL-программы здесь не запускаем.
  if (search !== "' OR 1=1 --" && !/^[\p{L}\p{N}\s._%-]{0,80}$/u.test(search)) {
    throw new LabError(400, 'Для стенда доступны обычный поиск и подготовленный SQL payload.')
  }
  const db = createOrderDatabase()
  try {
    // Пользователь выбран сервером лаборатории, не параметром поискового запроса.
    const result = context.mode === 'vulnerable' ? findOrders(db, 'alex', search) : fixedFindOrders(db, 'alex', search)
    return { status: 200, message: `Найдено заказов: ${result.orders.length}`, ...result }
  } finally { db.close() }
})
