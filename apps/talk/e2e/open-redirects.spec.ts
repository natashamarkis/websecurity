import { expect, test } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`demonstrates and blocks a real open redirect at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    const navigations: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) errors.push(message.text())
    })
    page.on('request', (request) => {
      if (request.isNavigationRequest()) navigations.push(request.url())
    })
    await page.goto('/talk/open-redirects/0')
    await expect(page.getByRole('heading', { name: 'Open Redirect', exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    await page.screenshot({ path: `test-results/open-redirect-overview-${width}.png`, fullPage: true, animations: 'disabled' })
    await page.getByRole('button', { name: 'Следующий слайд', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Open Redirect: фронтенд-код' })).toBeVisible()
    await expect(page.getByRole('tabpanel')).toContainText('return new URL(next, origin).href')
    await page.getByRole('tab', { name: 'Исправлено', exact: true }).click()
    await expect(page.getByRole('tabpanel')).toContainText('if (target.origin !== origin) return null')
    await page.screenshot({ path: `test-results/open-redirect-code-${width}.png`, fullPage: true, animations: 'disabled' })
    await page.getByRole('button', { name: 'Следующий слайд', exact: true }).click()
    await page.getByRole('button', { name: 'Открыть демонстрацию' }).click()
    await expect(page).toHaveURL(/\/site\/redirect$/)
    const origin = new URL(page.url()).origin
    await expect(page.getByLabel('Параметр next')).not.toHaveValue('')
    const target = await page.getByLabel('Параметр next').inputValue()
    const externalOrigin = new URL(target).origin
    const entry = await page.getByTestId('redirect-link').getAttribute('href')
    expect(new URL(entry!).origin).toBe(origin)
    expect(new URL(entry!).searchParams.get('next')).toBe(target)
    expect(externalOrigin).not.toBe(origin)
    await expect(page.getByRole('button', { name: 'Скопировать payload' })).toHaveCount(0)
    await expect.poll(() => page.getByRole('img', { name: 'Каталог электротехнической продукции' }).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    await page.screenshot({ path: `test-results/open-redirect-mail-${width}.png`, fullPage: true, animations: 'disabled' })

    await page.getByRole('link', { name: 'Посмотреть заказ' }).click()
    await expect(page).toHaveURL(target)
    expect(navigations).toContain(entry)
    await expect(page.getByRole('heading', { name: 'Войдите, чтобы посмотреть заказ' })).toBeVisible()
    await expect(page.getByText('Вы на внешнем сайте', { exact: true })).toBeVisible()
    await expect(page.locator('input, form')).toHaveCount(0)
    await expect.poll(() => page.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    await page.screenshot({ path: `test-results/open-redirect-external-${width}.png`, fullPage: true, animations: 'disabled' })
    await page.getByRole('link', { name: 'Вернуться к письму' }).click()
    await expect(page).toHaveURL(`${origin}/site/redirect`)

    await page.getByText('Исправлено', { exact: true }).click()
    await expect.poll(async () => (await context.cookies()).find((cookie) => cookie.name === 'demo-mode')?.value).toBe('fixed')
    const externalVisits = () => navigations.filter((url) => new URL(url).origin === externalOrigin).length
    const before = externalVisits()
    for (const next of [target, target.replace(/^http:/, '')]) {
      await page.getByLabel('Параметр next').fill(next)
      await page.getByRole('link', { name: 'Посмотреть заказ' }).click()
      await expect(page.getByRole('heading', { name: 'Переход заблокирован' })).toBeVisible()
      expect(new URL(page.url()).origin).toBe(origin)
      expect(new URL(page.url()).pathname).toBe('/site/redirect/go')
      await expect(page.getByTestId('requested-target')).toHaveText(next)
      expect(externalVisits()).toBe(before)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
      await page.screenshot({ path: `test-results/open-redirect-fixed-${width}.png`, fullPage: true, animations: 'disabled' })
      await page.getByRole('link', { name: 'Вернуться к письму' }).click()
    }

    // Обычная функция магазина остаётся рабочей в обоих режимах.
    for (const mode of ['fixed', 'vulnerable']) {
      if (mode === 'vulnerable') {
        await page.getByText('Уязвимо', { exact: true }).click()
        await expect.poll(async () => (await context.cookies()).find((cookie) => cookie.name === 'demo-mode')?.value).toBe('vulnerable')
      }
      await page.getByRole('combobox', { name: 'Вариант ссылки' }).click()
      await page.getByText('Заказ внутри магазина', { exact: true }).click()
      await page.getByRole('link', { name: 'Посмотреть заказ' }).click()
      await expect(page).toHaveURL(`${origin}/site/redirect/order`)
      await expect(page.getByRole('heading', { name: 'Заказ №48216' })).toBeVisible()
      await page.getByRole('link', { name: 'Вернуться к письму' }).click()
    }
    await page.getByLabel('Параметр next').fill('https://outside.example.test/')
    await page.getByRole('link', { name: 'Посмотреть заказ' }).click()
    await expect(page.getByRole('heading', { name: 'Переход заблокирован' })).toBeVisible()
    await expect(page.getByText('В учебном стенде доступны только две подготовленные страницы.', { exact: false })).toBeVisible()
    expect(navigations.some((url) => url.startsWith('https://outside.example.test/'))).toBe(false)
    await page.getByRole('link', { name: 'Вернуться к письму' }).click()
    await page.getByLabel('Параметр next').fill('/site/redirect/order')
    await page.getByRole('button', { name: 'Сбросить', exact: true }).click()
    await expect(page.getByLabel('Параметр next')).toHaveValue(target)
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/talk\/open-redirects\/2$/)
    await page.goto('/site/delivery')
    await page.getByRole('button', { name: 'К слайду' }).click()
    await expect(page).toHaveURL(/\/talk\/csrf\/3$/)
    expect((await page.request.get(`${externalOrigin}/redirect-offer?shopPort=invalid`)).status()).toBe(400)
    expect((await page.request.post(target, { data: 'no credentials' })).status()).toBe(403)
    expect(errors).toEqual([])
  })
}
