// Исправление внутри библиотеки: контракт принимает обычный текст, не HTML.
export function FixedProductDescription({ text }: { text: string }) {
  return <div>{text}</div>
}
