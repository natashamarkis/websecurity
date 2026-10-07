import { ProductDescription } from './library/ProductDescription'
import { FixedProductDescription } from './library/FixedProductDescription'

export function ProductPreview({ text, vulnerable }: { text: string; vulnerable: boolean }) {
  return vulnerable ? <ProductDescription description={text} /> : <FixedProductDescription description={text} />
}
