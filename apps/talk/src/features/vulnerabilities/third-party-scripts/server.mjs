import { readFile } from 'node:fs/promises'
import { URL } from 'node:url'
import { Buffer } from 'node:buffer'

const directory = new URL('./', import.meta.url)
const read = async (file) => (await readFile(new URL(file, directory), 'utf8')).replace(/\r\n/g, '\n')
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i

export async function createThirdPartyHandler() {
  const original = await read('vendor/support-chat.js')
  const compromised = original + '\n' + await read('vendor/steal-checkout-fields.js')
  const demoData = JSON.parse(await read('demo-data.json'))
  const captures = new Map()

  return async function handle(request, response, url) {
    if (!url.pathname.startsWith('/third-party/')) return false
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    for (const [run, record] of captures) {
      if (Date.now() - record.time > 10 * 60_000) captures.delete(run)
    }
    if (request.method === 'GET' && url.pathname === '/third-party/health') {
      response.writeHead(200, { 'Content-Type': 'text/plain' }).end('ready')
      return true
    }
    if (request.method === 'GET' && url.pathname === '/third-party/support-chat.js') {
      const variant = url.searchParams.get('variant')
      if (!['original', 'compromised'].includes(variant)) {
        response.writeHead(400).end('Invalid variant')
      } else {
        response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }).end(variant === 'original' ? original : compromised)
      }
      return true
    }
    if (request.method === 'GET' && url.pathname === '/third-party/captures') {
      const run = url.searchParams.get('run') ?? ''
      if (!uuid.test(run)) {
        response.writeHead(400).end('Invalid run')
      } else {
        response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ data: captures.get(run)?.data ?? null }))
      }
      return true
    }
    if (request.method === 'POST' && url.pathname === '/third-party/collect') {
      const chunks = []
      let size = 0
      for await (const chunk of request) {
        size += chunk.length
        if (size <= 2048) chunks.push(chunk)
      }
      if (size > 2048) {
        response.writeHead(413).end('Body too large')
        return true
      }
      try {
        const { run, data } = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        // Учебный получатель принципиально не хранит произвольные личные данные.
        if (typeof run !== 'string' || !uuid.test(run) || !data ||
            Object.keys(data).length !== 2 || data.email !== demoData.email || data.address !== demoData.address) {
          response.writeHead(400).end('Only predefined demo data accepted')
          return true
        }
        if (captures.size >= 500) captures.delete(captures.keys().next().value)
        captures.set(run, { data: { ...demoData }, time: Date.now() })
        response.writeHead(204).end()
      } catch {
        response.writeHead(400).end('Invalid JSON')
      }
      return true
    }
    response.writeHead(404).end('Not found')
    return true
  }
}
