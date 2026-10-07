// Учебная библиотека: строка из данных товара ошибочно становится HTML.
export function ProductDescription({ text }: { text: string }) {
  return <div dangerouslySetInnerHTML={{ __html: text }} />
}
