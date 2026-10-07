import { createServer, type Server } from 'node:http'
import { LabError } from '@/features/backend-lab/server'
import { SUPPLIER_URL, INTERNAL_URL, REDIRECT_URL, type RequestText } from './targets'

const fixtures = new Map([
  [SUPPLIER_URL, '/supplier'], [INTERNAL_URL, '/internal'], [REDIRECT_URL, '/redirect'],
])
type Network = { origin: string; server: Server }
const globalNetwork = globalThis as unknown as { __ssrfNetwork?: Promise<Network> }

export function getLabNetwork(): Promise<Network> {
  // Изолированный сетевой стенд: имена .test заменяют DNS только трёх учебных адресов.
  return globalNetwork.__ssrfNetwork ??= new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', 'no-store')
      if (request.url === '/redirect') {
        response.writeHead(302, { Location: INTERNAL_URL }).end()
      } else if (request.url === '/supplier') {
        response.end(JSON.stringify({ source: 'Каталог поставщика', product: 'Кабель ВВГ', price: 120 }))
      } else if (request.url === '/internal') {
        response.end(JSON.stringify({ source: 'Внутренняя бухгалтерия', document: 'Зарплатная ведомость (учебная)', employees: [{ name: 'Иван', salary: 95000 }] }))
      } else response.writeHead(404).end('{}')
    })
    server.once('error', (error) => { delete globalNetwork.__ssrfNetwork; reject(error) })
    server.listen(0, '127.0.0.1', () => {
      server.unref()
      const address = server.address()
      if (!address || typeof address === 'string') { server.close(); reject(new Error('No lab port')); return }
      resolve({ server, origin: `http://127.0.0.1:${address.port}` })
    })
  })
}

export const labRequestText: RequestText = async (input, options) => {
  const trace: string[] = []
  let url = input
  for (let hop = 0; hop < 3; hop++) {
    const path = fixtures.get(url)
    if (!path) throw new LabError(400, 'Стенд разрешает только три подготовленных адреса .test. Внешние запросы отключены.')
    const { origin } = await getLabNetwork()
    trace.push(`Бэкенд → GET ${url}`)
    const response = await fetch(`${origin}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(2000) })
    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel()
      if (options.redirect === 'error') throw new LabError(403, 'Поставщик ответил редиректом. Переход запрещён до запроса во внутреннюю сеть.')
      url = response.headers.get('location') ?? ''
      continue
    }
    if (!response.ok) { await response.body?.cancel(); throw new LabError(502, 'Источник недоступен.') }
    // Ответы принадлежат только локальному fixture-серверу и имеют фиксированный размер.
    const body = await response.text()
    if (Buffer.byteLength(body) > 4096) throw new LabError(502, 'Ответ превышает лимит стенда.')
    return { body, trace }
  }
  throw new LabError(502, 'Слишком много редиректов.')
}
