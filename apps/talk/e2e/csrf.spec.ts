import { expect, test } from '@playwright/test'

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`explains CSRF before the demo at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('console', (message) => {
      // В проекте пока нет favicon; проверяем ошибки содержимого слайдов.
      if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) {
        errors.push(`${message.location().url}: ${message.text()}`)
      }
    })
    const titles = [
      'CSRF: действие без согласия пользователя',
      'Как «скидка» меняет адрес',
      'Откуда берётся CSRF-токен',
      'Что ещё защищает от CSRF',
    ]
    await page.goto('/talk/csrf/0')
    for (const [index, title] of titles.entries()) {
      await expect(page).toHaveURL(new RegExp(`/talk/csrf/${index}$`))
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
      if (index === 2) {
        await expect(page.getByText(/randomBytes\(32\)/)).toBeVisible()
        await expect(page.getByText(/HTTP 403, адрес прежний/)).toBeVisible()
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width)
      if (viewport.width > 600) {
        expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(viewport.height)
      }
      await page.screenshot({ path: `test-results/csrf-slide-${index}-${viewport.width}.png`, fullPage: true, animations: 'disabled' })
      await page.getByRole('button', { name: 'Следующий слайд', exact: true }).click()
    }
    await expect(page.getByRole('heading', { name: 'CSRF: бэкенд-код (Node.js)' })).toBeVisible()
    await page.getByRole('button', { name: 'Следующий слайд', exact: true }).click()
    await expect(page).toHaveURL(/\/talk\/csrf\/5$/)
    await expect(page.getByRole('button', { name: 'Открыть демонстрацию' })).toBeVisible()

    await page.goto('/site/delivery')
    await page.getByRole('button', { name: 'К слайду' }).click()
    await expect(page).toHaveURL(/\/talk\/csrf\/5$/)
    expect(errors).toEqual([])
  })
}

test('demonstrates a real cross-origin form and blocks it after switching to fixed', async ({ page, context }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/talk/csrf/4')
  await expect(page.getByRole('heading', { name: 'CSRF: бэкенд-код (Node.js)' })).toBeVisible()
  await page.getByRole('tab', { name: 'Исправлено', exact: true }).click()
  await expect(page.getByRole('tabpanel')).toContainText('fixedChangeDelivery')
  await page.getByRole('button', { name: 'Следующий слайд', exact: true }).click()
  await page.getByRole('button', { name: 'Открыть демонстрацию' }).click()
  await expect(page).toHaveURL(/\/site\/delivery$/)
  await expect(page.getByTestId('delivery-address')).toContainText('Лесная')
  await expect(page.getByRole('button', { name: 'Скопировать payload' })).toHaveCount(0)

  const offerPromise = context.waitForEvent('page')
  await page.getByRole('link', { name: 'Открыть акцию' }).click()
  const offer = await offerPromise
  offer.on('pageerror', (error) => errors.push(error.message))
  await expect(offer.getByRole('button', { name: 'Получить скидку' })).toBeVisible()
  await expect.poll(() => offer.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  const offerUrl = offer.url()
  expect(new URL(offerUrl).origin).not.toBe(new URL(page.url()).origin)
  expect(new URL(offerUrl).hostname).toBe(new URL(page.url()).hostname)
  await offer.screenshot({ path: 'test-results/csrf-offer-desktop.png', fullPage: true })
  const attack = offer.waitForResponse((response) => response.url().endsWith('/api/site/delivery') && response.request().method() === 'POST')
  await offer.getByRole('button', { name: 'Получить скидку' }).click()
  const accepted = await attack
  expect(accepted.status()).toBe(200)
  const sentHeaders = await accepted.request().allHeaders()
  expect(sentHeaders.origin).toBe(new URL(offerUrl).origin)
  expect(sentHeaders.cookie).toContain('csrf-session=')
  expect(accepted.request().postData()).not.toContain('csrfToken')
  await expect(offer.getByRole('heading', { name: 'Адрес доставки изменён' })).toBeVisible()

  await page.bringToFront()
  await page.getByRole('button', { name: 'Обновить профиль' }).click()
  await expect(page.getByTestId('delivery-address')).toContainText('Подставная')
  await expect(page.getByTestId('delivery-origin')).toHaveText(new URL(offerUrl).origin)
  await page.getByText('Исправлено', { exact: true }).click()
  await expect(page.getByRole('radio', { name: 'Исправлено', exact: true })).toBeChecked()
  // Дождаться серверной cookie, а не только оптимистичного состояния переключателя.
  await expect.poll(async () => (await context.cookies()).find((cookie) => cookie.name === 'demo-mode')?.value).toBe('fixed')
  await page.getByRole('button', { name: 'Сбросить', exact: true }).click()
  await expect(page.getByTestId('delivery-address')).toContainText('Лесная')

  await offer.goto(offerUrl)
  const blocked = offer.waitForResponse((response) => response.url().endsWith('/api/site/delivery') && response.request().method() === 'POST')
  await offer.getByRole('button', { name: 'Получить скидку' }).click()
  expect((await blocked).status()).toBe(403)
  await expect(offer.getByRole('heading', { name: 'Запрос отклонён' })).toBeVisible()
  await page.bringToFront()
  await page.getByRole('button', { name: 'Обновить профиль' }).click()
  await expect(page.getByText('Запрос отклонён', { exact: true })).toBeVisible()
  await expect(page.getByTestId('delivery-address')).toContainText('Лесная')

  await page.getByLabel('Новый адрес').fill('Москва, ул. Новая, 25')
  await page.getByRole('button', { name: 'Сохранить адрес' }).click()
  await expect(page.getByTestId('delivery-address')).toContainText('Новая, 25')
  await expect.poll(() => page.locator('.delivery-offer img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  await page.screenshot({ path: 'test-results/csrf-profile-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('button', { name: 'Сохранить адрес' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  await page.screenshot({ path: 'test-results/csrf-profile-mobile.png', fullPage: true })
  await offer.setViewportSize({ width: 390, height: 844 })
  await offer.goto(offerUrl)
  expect(await offer.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  await offer.screenshot({ path: 'test-results/csrf-offer-mobile.png', fullPage: true })
  await offer.close()
  await page.getByRole('button', { name: 'Сбросить', exact: true }).click()
  await expect(page.getByTestId('delivery-address')).toContainText('Лесная')
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/talk\/csrf\/5$/)
  expect(errors).toEqual([])
})
