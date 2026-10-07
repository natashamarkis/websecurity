import { expect, test, type Request } from '@playwright/test'
import demoData from '../src/features/vulnerabilities/third-party-scripts/demo-data.json' with { type: 'json' }
import { TRUSTED_CHAT_INTEGRITY } from '../src/features/vulnerabilities/third-party-scripts/integrity'

for (const width of [1440, 390]) {
  test(`checks script integrity on home and checkout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    const integrityErrors: string[] = []
    const leaks: Request[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() !== 'error' || message.location().url.endsWith('/favicon.ico')) return
      if (/integrity|valid digest/i.test(message.text())) integrityErrors.push(message.text())
      else errors.push(message.text())
    })
    page.on('request', (request) => {
      if (request.url().endsWith('/third-party/collect')) leaks.push(request)
    })
    await page.goto('/talk/third-party-scripts/0')
    await expect(page.getByRole('heading', { name: 'Сторонние скрипты', exact: true })).toBeVisible()
    await expect(page.getByText('Сайт подключает чужой JavaScript:', { exact: false })).toContainText('аналитику, рекламу, виджет или библиотеку с CDN')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    await page.screenshot({ path: `test-results/third-party-overview-${width}.png`, fullPage: true, animations: 'disabled' })
    await page.getByRole('button', { name: 'Следующий слайд', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Сторонние скрипты: границы защиты' })).toBeVisible()
    await expect(page.getByText('Отключить скрипт только на checkout недостаточно:', { exact: false })).toBeVisible()
    await page.getByRole('button', { name: 'Следующий слайд', exact: true }).click()
    const ourCode = page.getByRole('tabpanel').locator('.backend-code')
    const vendorCode = page.getByRole('region', { name: 'В файле поставщика: чтение и отправка данных покупателя' })
    await expect(ourCode).toContainText('createSupportChatScript')
    await expect(ourCode).not.toContainText('script.integrity')
    const unchangedVendor = await vendorCode.textContent()
    await page.getByRole('tab', { name: 'Исправлено', exact: true }).click()
    await expect(ourCode).toContainText('script.integrity = TRUSTED_CHAT_INTEGRITY')
    await expect(ourCode).not.toContainText('pathname')
    await expect(vendorCode).toHaveText(unchangedVendor!)
    await page.screenshot({ path: `test-results/third-party-code-${width}.png`, fullPage: true, animations: 'disabled' })
    await page.getByRole('button', { name: 'Следующий слайд', exact: true }).click()
    await page.getByRole('button', { name: 'Открыть демонстрацию' }).click()
    await expect(page).toHaveURL(/\/site$/)

    for (const location of ['home', 'checkout']) {
      if (location === 'checkout') {
        // Полная навигация сохраняет fixed и проверяет файл на следующей странице.
        const navigation = page.waitForResponse((response) => response.request().isNavigationRequest() && response.url().endsWith('/site/checkout'))
        await page.getByRole('link', { name: 'К оформлению заказа' }).click()
        expect((await navigation).headers()['content-security-policy']).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval' http://127.0.0.1:")
        await expect(page.getByTestId('script-status')).toHaveText('Скрипт не выполнен')
        await expect(page.getByTestId('capture-empty')).toHaveText('Данных этого запуска нет')
        const previousLeaks = leaks.length
        await page.getByText('Уязвимо', { exact: true }).click()
        await expect.poll(() => leaks.length).toBe(previousLeaks + 1)
      }
      await expect(page.getByTestId('captured-data')).toContainText(demoData.email)
      await expect(page.getByTestId('script-status')).toHaveText('Чат загружен')
      const lastLeak = leaks.at(-1)!
      expect(lastLeak.postDataJSON().data).toEqual(demoData)
      expect(new URL(lastLeak.url()).origin).not.toBe(new URL(page.url()).origin)
      expect((await lastLeak.allHeaders()).cookie).toBeUndefined()
      await expect(page.getByLabel('Email покупателя')).toHaveAttribute('readonly', '')
      await expect(page.getByText('Учебный заказ оформлен', { exact: true })).toHaveCount(0)
      await page.getByRole('button', { name: 'Когда доставят заказ?' }).click()
      await expect(page.getByText('Доставка займёт 1–2 рабочих дня.', { exact: false })).toBeVisible()
      if (location === 'checkout') {
        await page.getByRole('button', { name: 'Оформить заказ' }).click()
        await expect(page.getByText('Учебный заказ оформлен', { exact: true })).toBeVisible()
      }
      await expect.poll(() => page.getByRole('img', { name: 'Каталог электротехнической продукции' }).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
      await page.screenshot({ path: `test-results/third-party-${location}-vulnerable-${width}.png`, fullPage: true, animations: 'disabled' })

      const previousLeaks = leaks.length
      await page.getByText('Исходный', { exact: true }).click()
      await expect(page.getByTestId('capture-empty')).toHaveText('Данных этого запуска нет')
      await expect(page.getByTestId('script-status')).toHaveText('Чат загружен')
      expect(leaks).toHaveLength(previousLeaks)

      const previousIntegrityErrors = integrityErrors.length
      await page.getByText('Исправлено', { exact: true }).click()
      await expect(page.getByTestId('script-status')).toHaveText('Скрипт не выполнен')
      await expect(page.getByTestId('capture-empty')).toHaveText('Данных этого запуска нет')
      await expect(page.getByRole('region', { name: 'Чат поддержки', exact: true })).toHaveCount(0)
      await expect(page.locator('script[src*="/third-party/support-chat.js"]')).toHaveAttribute('integrity', TRUSTED_CHAT_INTEGRITY)
      await expect.poll(() => integrityErrors.length).toBeGreaterThan(previousIntegrityErrors)
      expect(leaks).toHaveLength(previousLeaks)
      if (location === 'checkout') {
        await page.getByRole('button', { name: 'Оформить заказ' }).click()
        await expect(page.getByText('Учебный заказ оформлен', { exact: true })).toBeVisible()
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
      await page.screenshot({ path: `test-results/third-party-${location}-fixed-${width}.png`, fullPage: true, animations: 'disabled' })

      const response = await page.reload()
      const csp = response?.headers()['content-security-policy'] ?? ''
      expect(csp).toContain(`script-src 'self' 'unsafe-inline' 'unsafe-eval' http://127.0.0.1:${process.env.CSRF_ATTACKER_PORT ?? 3001}`)
      await expect(page.getByTestId('capture-empty')).toHaveText('Данных этого запуска нет')
      await expect(page.getByTestId('script-status')).toHaveText('Скрипт не выполнен')
      await page.getByText('Исходный', { exact: true }).click()
      await expect(page.getByTestId('script-status')).toHaveText('Чат загружен')
      await expect(page.getByTestId('capture-empty')).toHaveText('Данных этого запуска нет')
      await page.getByRole('button', { name: 'Когда доставят заказ?' }).click()
      await expect(page.getByText('Доставка займёт 1–2 рабочих дня.', { exact: false })).toBeVisible()
      await page.getByRole('button', { name: 'Сбросить', exact: true }).click()
      await expect(page.getByTestId('capture-empty')).toHaveText('Данных этого запуска нет')
      await expect(page.getByTestId('script-status')).toHaveText('Чат загружен')
      expect(leaks).toHaveLength(previousLeaks)
    }
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/talk\/third-party-scripts\/3$/)
    await page.goto('/site/delivery')
    await page.getByRole('button', { name: 'К слайду' }).click()
    await expect(page).toHaveURL(/\/talk\/csrf\/3$/)
    expect(errors).toEqual([])
  })
}
