# Демо-сценарии: XSS и CSRF

Пошаговые сценарии для живой демонстрации на tech talk.
Перед началом запустите backend (`http://localhost:3000`) и frontend (`http://localhost:5173`).

---

## 1. Reflected XSS (поиск)

1. Откройте `http://localhost:5173`
2. В поле поиска введите:
   ```html
   <img src=x onerror=alert('XSS')>
   ```
3. Нажмите Enter — сработает `alert`.

**Почему:** поисковый запрос отражается в разметке без санитизации.

---

## 2. Stored XSS (комментарии)

1. Войдите как `alice` / `alice123`
2. Откройте любой пост
3. Добавьте комментарий:
   ```html
   <img src=x onerror=alert('Stored XSS')>
   ```
4. Перезагрузите страницу — XSS выполнится снова (payload сохранён в БД).

**Почему:** комментарии рендерятся через `dangerouslySetInnerHTML`.

---

## 3. Цепочка XSS → CSRF (без изменений в бэкенде)

В комментарий или в поле `bio` профиля вставьте:

```html
<img src=x onerror="fetch('http://localhost:3000/api/posts/1',{method:'DELETE',credentials:'include'})">
```

При открытии страницы жертвой пост удалится: сохранённый XSS выполняет
действие от имени пользователя. Это демонстрирует эффект XSS → CSRF.

См. также standalone PoC: [`csrf-poc.html`](csrf-poc.html).
