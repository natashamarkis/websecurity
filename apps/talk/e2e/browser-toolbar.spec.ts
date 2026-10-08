import { expect, test } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`demo toolbar keeps controls without the address at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const [route, module] of [['/site/comments', 'xss'], ['/site/backend/ssrf', 'ssrf']]) {
      await page.goto(route!)
      await expect(page.locator('.site-content')).toHaveCSS('padding-left', width === 390 ? '16px' : '36px')
      const toolbar = page.locator('.browser-toolbar')
      await expect(toolbar.getByRole('textbox')).toHaveCount(0)
      await expect(toolbar.locator('.ant-tag')).toHaveCount(0)
      await expect(page.getByLabel('Адрес демонстрации')).toHaveCount(0)
      await expect(toolbar.getByRole('radio', { name: 'Уязвимо', exact: true })).toBeAttached()
      await expect(toolbar.getByRole('radio', { name: 'Исправлено', exact: true })).toBeAttached()
      await expect(toolbar.getByRole('button', { name: 'Сбросить', exact: true })).toBeVisible()
      await expect(toolbar.getByRole('button', { name: /К слайду/ })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
      await page.screenshot({ path: `test-results/toolbar-${module}-${width}.png`, fullPage: true, animations: 'disabled' })
      await toolbar.getByRole('button', { name: /К слайду/ }).click()
      await expect(page).toHaveURL(new RegExp(`/talk/${module}/2$`))
    }
  })
}
