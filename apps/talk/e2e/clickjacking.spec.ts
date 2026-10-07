import { expect, test } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`a real overlaid click changes settings, while server headers block framing at ${width}px`, async ({ page, context }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    const blocked: string[] = []
    context.on('page', (opened) => {
      opened.on('pageerror', (error) => errors.push(error.message))
      opened.on('console', (message) => {
        if (message.type() !== 'error' || message.location().url.endsWith('/favicon.ico')) return
        if (message.text().includes('frame-ancestors')) blocked.push(message.text())
        else errors.push(message.text())
      })
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/talk/clickjacking/0')
    await expect(page.getByRole('heading', { name: 'Clickjacking (UI Redressing)' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    await page.screenshot({ path: `test-results/clickjacking-overview-${width}.png`, fullPage: true, animations: 'disabled' })
    await page.getByRole('button', { name: 'Следующий слайд', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Clickjacking: бэкенд, HTTP-заголовки' })).toBeVisible()
    await expect(page.getByRole('tabpanel')).toContainText('return {}')
    await page.getByRole('tab', { name: 'Исправлено', exact: true }).click()
    await expect(page.getByRole('tabpanel')).toContainText("frame-ancestors 'none'")
    await expect(page.getByRole('tabpanel')).toContainText('opacity: 0.001')
    await page.screenshot({ path: `test-results/clickjacking-code-${width}.png`, fullPage: true, animations: 'disabled' })
    await page.getByRole('button', { name: 'Следующий слайд', exact: true }).click()
    await page.getByRole('button', { name: 'Открыть демонстрацию' }).click()
    await expect(page).toHaveURL(/\/site\/notifications$/)
    const origin = new URL(page.url()).origin
    const actionUrl = `${origin}/site/notifications/action`
    await expect(page.getByTestId('notifications-status')).toHaveText('Включены')
    await expect(page.getByRole('button', { name: 'Скопировать payload' })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    await page.screenshot({ path: `test-results/clickjacking-profile-${width}.png`, fullPage: true, animations: 'disabled' })

    const popupPromise = page.waitForEvent('popup')
    await page.getByRole('link', { name: 'Открыть предложение' }).click()
    const popup = await popupPromise
    await popup.setViewportSize({ width, height: 900 })
    const attackerOrigin = new URL(popup.url()).origin
    expect(attackerOrigin).not.toBe(origin)
    const frame = popup.frameLocator('iframe')
    await expect(frame.getByRole('button', { name: 'Отключить уведомления' })).toBeEnabled()
    const vulnerableHeaders = (await page.request.get(actionUrl)).headers()
    expect(vulnerableHeaders['x-frame-options']).toBeUndefined()
    expect(vulnerableHeaders['content-security-policy']).toBeUndefined()
    expect(await popup.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    await expect.poll(() => popup.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    await popup.locator('#bonus').scrollIntoViewIfNeeded()
    const bait = (await popup.locator('#bonus').boundingBox())!
    const real = (await frame.getByRole('button', { name: 'Отключить уведомления' }).boundingBox())!
    expect(Math.abs(bait.x - real.x)).toBeLessThan(1)
    expect(Math.abs(bait.y - real.y)).toBeLessThan(1)
    expect(bait.width).toBe(real.width)
    await popup.screenshot({ path: `test-results/clickjacking-bait-${width}.png`, fullPage: true })
    await popup.getByLabel('Показать скрытый iframe').check()
    await expect(popup.locator('iframe')).toHaveCSS('opacity', '1')
    await popup.screenshot({ path: `test-results/clickjacking-revealed-${width}.png`, fullPage: true })
    await popup.getByLabel('Показать скрытый iframe').uncheck()

    // A physical click on the bait's coordinates, not a programmatic click in the frame.
    const submission = popup.waitForRequest((request) => request.url() === actionUrl && request.method() === 'POST')
    await popup.mouse.click(bait.x + bait.width / 2, bait.y + bait.height / 2)
    const request = await submission
    expect(request.headers().origin).toBe(origin)
    expect(new URLSearchParams(request.postData()!).get('csrfToken')).toMatch(/^[a-f0-9]{64}$/)
    await expect(frame.getByRole('status')).toHaveText('Отключены')
    expect((await (await page.request.get('/api/site/notifications')).json()).enabled).toBe(false)
    await popup.close()
    await page.bringToFront()
    await page.getByRole('button', { name: 'Обновить настройки', exact: true }).click()
    await expect(page.getByTestId('notifications-status')).toHaveText('Отключены')
    await page.screenshot({ path: `test-results/clickjacking-result-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: 'Сбросить', exact: true }).click()
    await expect(page.getByTestId('notifications-status')).toHaveText('Включены')
    await page.getByText('Исправлено', { exact: true }).click()
    await expect.poll(async () => (await context.cookies()).find((cookie) => cookie.name === 'demo-mode')?.value).toBe('fixed')
    const fixedHeaders = (await page.request.get(actionUrl)).headers()
    expect(fixedHeaders['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(fixedHeaders['x-frame-options']).toBe('DENY')

    const fixedPromise = page.waitForEvent('popup')
    await page.getByRole('link', { name: 'Открыть предложение' }).click()
    const fixedPopup = await fixedPromise
    await fixedPopup.setViewportSize({ width, height: 900 })
    const posts: string[] = []
    fixedPopup.on('request', (request) => { if (request.method() === 'POST') posts.push(request.url()) })
    await expect.poll(() => blocked.length).toBeGreaterThan(0)
    await fixedPopup.locator('#bonus').scrollIntoViewIfNeeded()
    const fixedBait = (await fixedPopup.locator('#bonus').boundingBox())!
    await fixedPopup.mouse.click(fixedBait.x + fixedBait.width / 2, fixedBait.y + fixedBait.height / 2)
    await fixedPopup.getByLabel('Показать скрытый iframe').check()
    await expect(fixedPopup.locator('iframe')).toHaveCSS('opacity', '1')
    await fixedPopup.screenshot({ path: `test-results/clickjacking-fixed-${width}.png`, fullPage: true })
    expect((await (await page.request.get('/api/site/notifications')).json()).enabled).toBe(true)
    expect(posts).toEqual([])
    await fixedPopup.close()

    // The same protected document still works when opened normally.
    const normalPromise = page.waitForEvent('popup')
    await page.getByRole('link', { name: 'Настройки уведомлений' }).click()
    const normal = await normalPromise
    await expect(normal.getByRole('button', { name: 'Отключить уведомления' })).toBeEnabled()
    await normal.getByRole('button', { name: 'Отключить уведомления' }).click()
    await expect(normal.getByRole('status')).toHaveText('Отключены')
    expect((await (await page.request.get('/api/site/notifications')).json()).enabled).toBe(false)
    await normal.close()
    await page.bringToFront()
    await page.getByRole('button', { name: 'Сбросить', exact: true }).click()
    await expect(page.getByTestId('notifications-status')).toHaveText('Включены')
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/talk\/clickjacking\/2$/)
    expect((await page.request.get(`${attackerOrigin}/clickjacking?shopPort=invalid`)).status()).toBe(400)
    expect(errors).toEqual([])
  })
}
