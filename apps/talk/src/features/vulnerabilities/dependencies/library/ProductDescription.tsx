// Версия 1.0.0: выводит описание товара, но ошибочно доверяет HTML из каталога.
export function ProductDescription({ description }: { description: string }) {
  return <div dangerouslySetInnerHTML={{ __html: description }} />
}
