import { expect, test, type Page } from '@playwright/test'

test.use({ actionTimeout: 15_000 })
const pageErrors = new WeakMap<Page, string[]>()
test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  pageErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(error.message))
})
test.afterEach(async ({ page }) => { expect(pageErrors.get(page)).toEqual([]) })

async function ready(page: Page, mode = 'vulnerable') {
  await expect(page.getByTestId('backend-demo')).toHaveAttribute('data-mode', mode)
  await expect(page.getByTestId('backend-demo')).toHaveAttribute('aria-busy', 'false')
}
async function fixed(page: Page) {
  await page.getByText('Исправлено', { exact: true }).click()
  await ready(page, 'fixed')
}
async function openDemo(page: Page, topic: string, width: number) {
  await page.setViewportSize({ width, height: 950 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`/talk/${topic}/0`)
  await page.screenshot({ path: `test-results/backend-${topic}-theory-${width}.png`, fullPage: true })
  await page.getByRole('button', { name: 'Следующий слайд', exact: true }).click()
  await expect(page.getByRole('heading', { name: /бэкенд/ })).toBeVisible()
  await page.getByRole('tab', { name: 'Исправлено', exact: true }).click()
  await expect(page.getByRole('tabpanel')).toContainText('ИСПРАВЛЕНО')
  await expect(page.getByRole('tabpanel')).toContainText('fetch(')
  await page.screenshot({ path: `test-results/backend-${topic}-code-${width}.png`, fullPage: true })
  if (topic === 'file-download') {
    await page.getByRole('button', { name: 'Следующий слайд', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Path Traversal: бэкенд проверяет путь' })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Следующий слайд', exact: true }).click()
  await page.getByRole('button', { name: 'Открыть демонстрацию' }).click()
  await expect(page).toHaveURL(new RegExp(`/site/backend/${topic}$`), { timeout: 15_000 })
  await ready(page)
}
async function finish(page: Page, topic: string, width: number) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  await page.screenshot({ path: `test-results/backend-${topic}-fixed-${width}.png`, fullPage: true })
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(new RegExp(`/talk/${topic}/${topic === 'file-download' ? 3 : 2}$`))
}

for (const width of [1440, 390]) {
  test(`SSRF sends backend HTTP and blocks internal targets and redirects at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000)
    await openDemo(page, 'ssrf', width)
    await page.getByRole('button', { name: 'Загрузить на сервере' }).click()
    await expect(page.getByTestId('ssrf-body')).toContainText('Кабель')
    await page.getByText('Внутренняя бухгалтерия', { exact: true }).click()
    await page.getByRole('button', { name: 'Загрузить на сервере' }).click()
    await expect(page.getByTestId('ssrf-body')).toContainText('salary')
    await page.screenshot({ path: `test-results/backend-ssrf-vulnerable-${width}.png`, fullPage: true })
    await page.getByText('Редирект поставщика во внутреннюю сеть', { exact: true }).click()
    await page.getByRole('button', { name: 'Загрузить на сервере' }).click()
    await expect(page.getByTestId('ssrf-body')).toContainText('salary')
    await expect(page.locator('.backend-trace li')).toHaveCount(2)
    await fixed(page)
    await page.getByRole('button', { name: 'Загрузить на сервере' }).click()
    await expect(page.getByText(/HTTP 403:.*редиректом/)).toBeVisible()
    await page.getByText('Внутренняя бухгалтерия', { exact: true }).click()
    await page.getByRole('button', { name: 'Загрузить на сервере' }).click()
    await expect(page.getByText(/HTTP 403:.*список источников/)).toBeVisible()
    await page.getByText('Каталог поставщика', { exact: true }).click()
    await page.getByRole('button', { name: 'Загрузить на сервере' }).click()
    await expect(page.getByTestId('ssrf-body')).toContainText('Кабель')
    expect(await page.getByRole('img', { name: 'Каталог поставщика' }).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    await finish(page, 'ssrf', width)
  })
  test(`session ID rotation revokes attacker access at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000)
    await openDemo(page, 'sessions', width)
    for (const mode of ['vulnerable', 'fixed']) {
      if (mode === 'fixed') await fixed(page)
      await page.getByRole('button', { name: '1. Навязать анонимную сессию' }).click()
      await ready(page, mode)
      const oldId = await page.getByTestId('attacker-session').innerText()
      await expect(page.getByTestId('victim-session')).toHaveText(oldId)
      await page.getByRole('button', { name: '2. Войти как Алекс' }).click()
      await ready(page, mode)
      if (mode === 'fixed') await expect(page.getByTestId('victim-session')).not.toHaveText(oldId)
      else await expect(page.getByTestId('victim-session')).toHaveText(oldId)
      await page.getByRole('button', { name: '3. Запросить профиль со старым ID' }).click()
      if (mode === 'fixed') {
        await expect(page.getByText(/HTTP 401:.*не даёт доступа/)).toBeVisible()
        await expect(page.getByTestId('stolen-profile')).toHaveCount(0)
      } else {
        await expect(page.getByTestId('stolen-profile')).toContainText('alex@example.test')
        await page.screenshot({ path: `test-results/backend-sessions-vulnerable-${width}.png`, fullPage: true })
      }
    }
    await page.getByRole('button', { name: 'Выйти из аккаунта' }).click()
    await expect(page.getByText(/Сессия отозвана/)).toBeVisible()
    await finish(page, 'sessions', width)
  })
  test(`SQL parameters preserve customer filtering at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000)
    await openDemo(page, 'sql-injection', width)
    await page.getByRole('button', { name: 'Найти заказы' }).click()
    await expect(page.getByText('HTTP 200: Найдено заказов: 1')).toBeVisible()
    await page.getByText('SQL-инъекция', { exact: true }).click()
    await page.getByRole('button', { name: 'Найти заказы' }).click()
    await expect(page.getByText('HTTP 200: Найдено заказов: 4')).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Мария', exact: true })).toBeVisible()
    await page.screenshot({ path: `test-results/backend-sql-vulnerable-${width}.png`, fullPage: true })
    await fixed(page)
    await page.getByRole('button', { name: 'Найти заказы' }).click()
    await expect(page.getByText('HTTP 200: Найдено заказов: 0')).toBeVisible()
    await expect(page.getByTestId('executed-sql')).toContainText('customer_id = ?')
    await page.getByLabel('Название товара').fill('')
    await page.getByRole('button', { name: 'Найти заказы' }).click()
    await expect(page.getByText('HTTP 200: Найдено заказов: 2')).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Мария', exact: true })).toHaveCount(0)
    await finish(page, 'sql-injection', width)
  })
  test(`server limits password attempts and reset restores legitimate login at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000)
    await openDemo(page, 'brute-force', width)
    await page.getByRole('button', { name: 'Проверить список' }).click()
    await expect(page.getByTestId('brute-account')).toBeVisible()
    await ready(page)
    await page.screenshot({ path: `test-results/backend-brute-vulnerable-${width}.png`, fullPage: true })
    await fixed(page)
    await page.getByRole('button', { name: 'Проверить список' }).click()
    await expect(page.getByRole('cell', { name: '429', exact: true })).toHaveCount(5)
    await ready(page, 'fixed')
    await expect(page.getByTestId('brute-account')).toHaveCount(0)
    await page.screenshot({ path: `test-results/backend-brute-blocked-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: 'Сбросить', exact: true }).click()
    await expect(page.getByText('HTTP 200: Готово к новому запуску.')).toBeVisible()
    await ready(page, 'fixed')
    await page.getByLabel('Пароль', { exact: true }).fill('Cable2026!')
    await page.getByRole('button', { name: 'Войти', exact: true }).click()
    await expect(page.getByTestId('brute-account')).toBeVisible()
    await finish(page, 'brute-force', width)
  })
  test(`ownership and traversal checks protect actual document contents at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000)
    await openDemo(page, 'file-download', width)
    for (const mode of ['vulnerable', 'fixed']) {
      if (mode === 'fixed') {
        await fixed(page)
        await page.getByRole('tab', { name: 'IDOR · чужой документ' }).click()
        await ready(page, mode)
      }
      await page.getByLabel('ID документа').fill('1001')
      await page.getByRole('button', { name: 'Запросить документ' }).click()
      await expect(page.getByTestId('file-content')).toContainText('Покупатель: Алекс')
      await page.getByLabel('ID документа').fill('1002')
      await page.getByRole('button', { name: 'Запросить документ' }).click()
      if (mode === 'fixed') await expect(page.getByText(/HTTP 404: Документ/)).toBeVisible()
      else await expect(page.getByTestId('file-content')).toContainText('Покупатель: Мария')
      await page.getByRole('tab', { name: 'Path Traversal · путь к файлу' }).click()
      await ready(page, mode)
      await page.getByLabel('Имя файла').fill('manual.txt')
      await page.getByRole('button', { name: 'Запросить файл' }).click()
      await expect(page.getByTestId('file-content')).toContainText('Инструкция')
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Скачать полученный файл' }).click()
      expect((await downloadPromise).suggestedFilename()).toBe('document.txt')
      await page.getByLabel('Имя файла').fill('../internal.txt')
      await page.getByRole('button', { name: 'Запросить файл' }).click()
      if (mode === 'fixed') await expect(page.getByText(/HTTP 403: Файл находится вне/)).toBeVisible()
      else {
        await expect(page.getByTestId('file-content')).toContainText('DEMO_SERVICE_TOKEN')
        await page.screenshot({ path: `test-results/backend-files-vulnerable-${width}.png`, fullPage: true })
      }
    }
    await finish(page, 'file-download', width)
  })
}
