/* global document */
;(() => {
  const root = document.querySelector('#support-chat-root')
  if (!root || root.dataset.run !== document.currentScript.dataset.run) return

  root.innerHTML = `
    <section class="support-chat" aria-label="Чат поддержки">
      <header><strong>Помочь с заказом?</strong><span>Поддержка магазина</span></header>
      <div class="support-chat-messages">
        <p>Здравствуйте! Подскажу по доставке.</p>
        <button type="button">Когда доставят заказ?</button>
        <p class="support-chat-reply" hidden>Доставка займёт 1–2 рабочих дня. Уведомление придёт на вашу почту.</p>
      </div>
    </section>`
  root.querySelector('button').onclick = () => {
    root.querySelector('.support-chat-reply').hidden = false
  }
})()
