export const version = '1.0.1'

// Исправление внутри библиотеки: контракт принимает обычный текст, не HTML.
export function FixedProductDescription({ text }: { text: string }) {
  return <div>{text}</div>
}
