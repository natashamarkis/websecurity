export interface Comment {
  id: string
  author: string
  text: string
  createdAt: string
}

interface State {
  comments: Comment[]
}

/** Стартовое состояние: с ним демо всегда начинается одинаково. */
function seed(): State {
  const now = Date.now()
  return {
    comments: [
      { id: 'c-1', author: 'Мария', text: 'Отличный продукт, пользуюсь каждый день!', createdAt: new Date(now - 3_600_000).toISOString() },
      { id: 'c-2', author: 'Иван', text: 'Есть вопрос по тарифам — куда писать?', createdAt: new Date(now - 1_800_000).toISOString() },
    ],
  }
}

let state: State = seed()
let counter = 100

/**
 * In-memory стор демо-сайта. Живёт в процессе Next: без БД, без миграций,
 * «Сбросить» в тулбаре возвращает seed. Модульный синглтон — один на процесс.
 */
export const store = {
  listComments(): Comment[] {
    return state.comments
  },
  addComment(input: { author: string; text: string }): Comment {
    counter += 1
    const comment: Comment = {
      id: `c-${counter}`,
      author: input.author,
      text: input.text,
      createdAt: new Date().toISOString(),
    }
    state.comments = [...state.comments, comment]
    return comment
  },
  reset(): State {
    state = seed()
    return state
  },
}
