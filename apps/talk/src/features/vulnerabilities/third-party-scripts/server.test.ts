// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { createHash, randomUUID } from 'node:crypto'
import { createThirdPartyHandler } from './server.mjs'
import { TRUSTED_ANALYTICS_INTEGRITY } from './integrity'
import demoData from './demo-data.json'

describe('local third-party CDN and collector', () => {
  let server: Server
  let origin: string
  beforeAll(async () => {
    const handle = await createThirdPartyHandler()
    server = createServer(async (request, response) => {
      if (!await handle(request, response, new URL(request.url!, origin))) response.writeHead(404).end()
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('No test port')
    origin = `http://127.0.0.1:${address.port}`
  })
  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())))

  it('serves the original bytes matching the pinned hash, unlike the compromised file', async () => {
    for (const variant of ['original', 'compromised']) {
      const response = await fetch(`${origin}/third-party/checkout-analytics.js?variant=${variant}`)
      expect(response.status).toBe(200)
      expect(response.headers.get('access-control-allow-origin')).toBe('*')
      const hash = 'sha384-' + createHash('sha384').update(await response.text()).digest('base64')
      expect(hash === TRUSTED_ANALYTICS_INTEGRITY).toBe(variant === 'original')
    }
  })

  it('isolates captures by run and accepts only the predefined demo data', async () => {
    const run = randomUUID()
    const send = (data: unknown) => fetch(`${origin}/third-party/collect`, { method: 'POST', body: JSON.stringify({ run, data }) })
    expect((await send({ ...demoData, email: 'real@example.com' })).status).toBe(400)
    expect((await send({ ...demoData, extra: 'secret' })).status).toBe(400)
    expect((await send(demoData)).status).toBe(204)
    expect(await (await fetch(`${origin}/third-party/captures?run=${run}`)).json()).toEqual({ data: demoData })
    expect(await (await fetch(`${origin}/third-party/captures?run=${randomUUID()}`)).json()).toEqual({ data: null })
  })

  it('rejects malformed, oversized and invalid requests', async () => {
    expect((await fetch(`${origin}/third-party/collect`, { method: 'POST', body: '{' })).status).toBe(400)
    expect((await fetch(`${origin}/third-party/collect`, { method: 'POST', body: 'x'.repeat(2049) })).status).toBe(413)
    expect((await fetch(`${origin}/third-party/captures?run=wrong`)).status).toBe(400)
    expect((await fetch(`${origin}/third-party/checkout-analytics.js?variant=unknown`)).status).toBe(400)
    expect((await fetch(`${origin}/third-party/unknown`)).status).toBe(404)
  })
})
