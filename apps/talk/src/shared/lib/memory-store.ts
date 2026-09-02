export interface Comment {
  id: string
  author: string
  text: string
  createdAt: string
}

interface State {
  comments: Comment[]
  counter: number
}

/** Стартовое состояние: с ним демо всегда начинается одинаково. */
function seed(): State {
  const now = Date.now()
  return {
    counter: 100,
    comments: [
      { id: 'c-1', author: 'Мария', text: 'Отличный продукт, пользуюсь каждый день!', createdAt: new Date(now - 3_600_000).toISOString() },
      { id: 'c-2', author: 'Иван', text: 'Есть вопрос по тарифам — куда писать?', createdAt: new Date(now - 1_800_000).toISOString() },
    ],
  }
}

/**
 * Состояние держим на globalThis: в dev Next/Turbopack собирает route handlers
 * и страницы в разные модульные графы, и обычный модульный синглтон у них разный.
 */
const g = globalThis as unknown as { __wsDemoStore?: State }
g.__wsDemoStore ??= seed()

function state(): State {
  return g.__wsDemoStore!
}

/** In-memory стор демо-сайта. Без БД; «Сбросить» в тулбаре возвращает seed. */
export const store = {
  listComments(): Comment[] {
    return state().comments
  },
  addComment(input: { author: string; text: string }): Comment {
    const s = state()
    s.counter += 1
    const comment: Comment = {
      id: `c-${s.counter}`,
      author: input.author,
      text: input.text,
      createdAt: new Date().toISOString(),
    }
    s.comments = [...s.comments, comment]
    return comment
  },
  reset(): { comments: Comment[] } {
    g.__wsDemoStore = seed()
    return { comments: g.__wsDemoStore.comments }
  },
}
