import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { URL } from 'node:url'
import process from 'node:process'
import console from 'node:console'
import { createThirdPartyHandler } from '../apps/talk/src/features/vulnerabilities/third-party-scripts/server.mjs'

const port = Number(process.env.CSRF_ATTACKER_PORT ?? 3001)
const html = await readFile(new URL('../apps/talk/src/features/vulnerabilities/csrf/attacker.html', import.meta.url), 'utf8')
const redirectHtml = await readFile(new URL('../apps/talk/src/features/vulnerabilities/open-redirects/attacker.html', import.meta.url), 'utf8')
const clickjackingHtml = await readFile(new URL('../apps/talk/src/features/vulnerabilities/clickjacking/attacker.html', import.meta.url), 'utf8')
const attackLayer = await readFile(new URL('../apps/talk/src/features/vulnerabilities/clickjacking/attack-layer.html', import.meta.url), 'utf8')
const catalog = await readFile(new URL('../apps/talk/public/presentation/catalog.png', import.meta.url))
const thirdParty = await createThirdPartyHandler()

// Локальный учебный сервер: cookie не читаются и не записываются в логи.
const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`)
  const host = (request.headers.host ?? '').split(':')[0]
  if (!['127.0.0.1', 'localhost'].includes(host)) {
    response.writeHead(403).end('Forbidden')
    return
  }
  try {
    if (await thirdParty(request, response, url)) return
  } catch {
    response.writeHead(500).end('Local demo server error')
    return
  }
  if (request.method !== 'GET') {
    response.writeHead(403).end('Forbidden')
    return
  }
  if (url.pathname === '/catalog.png') {
    response.writeHead(200, { 'Content-Type': 'image/png' }).end(catalog)
    return
  }
  if (url.pathname === '/redirect-offer') {
    const shopPort = Number(url.searchParams.get('shopPort') ?? 3000)
    if (!Number.isInteger(shopPort) || shopPort < 1 || shopPort > 65535 || shopPort === port) {
      response.writeHead(400).end('Invalid local port')
      return
    }
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'",
    }).end(redirectHtml.replace('{{SHOP_ORIGIN}}', `http://${host}:${shopPort}`))
    return
  }
  if (url.pathname === '/clickjacking') {
    const shopPort = Number(url.searchParams.get('shopPort') ?? 3000)
    if (!Number.isInteger(shopPort) || shopPort < 1 || shopPort > 65535 || shopPort === port) {
      response.writeHead(400).end('Invalid local port')
      return
    }
    const shopOrigin = `http://${host}:${shopPort}`
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': `default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; frame-src ${shopOrigin}; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`,
    }).end(clickjackingHtml.replace('{{ATTACK_LAYER}}', attackLayer).replaceAll('{{SHOP_ORIGIN}}', shopOrigin))
    return
  }
  if (!['/', '/offer'].includes(url.pathname)) {
    response.writeHead(404).end('Not found')
    return
  }
  const victimPort = Number(url.searchParams.get('victimPort') ?? 3000)
  if (!Number.isInteger(victimPort) || victimPort < 1 || victimPort > 65535 || victimPort === port) {
    response.writeHead(400).end('Invalid local port')
    return
  }
  const victim = `http://${host}:${victimPort}`
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Security-Policy': `default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; form-action ${victim}; frame-ancestors 'none'; base-uri 'none'`,
  }).end(html.replace('{{VICTIM_ORIGIN}}', victim))
})

server.on('error', (error) => { console.error(error.message); process.exit(1) })
server.listen(port, '127.0.0.1', () => console.log(`CSRF offer: http://127.0.0.1:${port}/offer`))
