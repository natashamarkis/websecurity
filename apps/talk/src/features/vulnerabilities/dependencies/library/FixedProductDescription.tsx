// Автор исправил в 1.0.1: описание товара выводится текстом, а не HTML.
export function FixedProductDescription({ description }: { description: string }) {
  return <div>{description}</div>
}
