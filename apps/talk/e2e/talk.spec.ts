import { expect, test } from '@playwright/test'

test('opens the demo from the deck and returns to the same slide', async ({ page }) => {
  await page.goto('/talk')
  await page.getByRole('link', { name: /Введение/ }).click()
  await expect(page).toHaveURL(/\/talk\/intro\/0$/)
  await page.keyboard.press('ArrowRight')
  await expect(page).toHaveURL(/\/talk\/intro\/1$/)
  await page.keyboard.press('ArrowRight')
  await expect(page).toHaveURL(/\/talk\/intro\/2$/)
  await page.getByRole('button', { name: /Показать/ }).click()
  await expect(page).toHaveURL(/\/site\/comments$/)
  await expect(page.getByTestId('comment-input')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/talk\/intro\/2$/)
})

test('executes stored XSS only in vulnerable mode and resets comments', async ({ page }) => {
  await page.request.post('/api/site/reset')
  await page.request.post('/api/demo-mode', { data: { mode: 'vulnerable' } })
  try {
    await page.goto('/site/comments')
    await expect(page.getByTestId('comment')).toHaveCount(2)
    const payload = '<img src=x onerror="document.documentElement.dataset.xss = document.cookie">'
    await page.getByTestId('comment-input').fill(payload)
    await page.getByTestId('comment-submit').click()
    await expect(page.locator('html')).toHaveAttribute('data-xss', /session=sess_alex_7f3a9c/)

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-xss', /session=sess_alex_7f3a9c/)
    await page.getByText('Исправлено', { exact: true }).click()
    await expect(page.getByTestId('comment').last()).toContainText(payload)

    const response = await page.reload()
    expect(response?.headers()['x-frame-options']).toBe('DENY')
    await expect(page.getByTestId('comments-list').locator('img')).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveAttribute('data-xss')
    expect(await page.evaluate(() => document.cookie)).not.toContain('session=')
    expect((await page.context().cookies()).find((cookie) => cookie.name === 'session')?.httpOnly).toBe(true)

    await page.getByRole('button', { name: 'Сбросить' }).click()
    await expect(page.getByTestId('comment')).toHaveCount(2)
    await expect(page.getByTestId('comments-list')).not.toContainText(payload)
  } finally {
    await page.request.post('/api/site/reset')
  }
})
