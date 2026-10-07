export const SUPPLIER_URL = 'http://supplier.example.test/catalog.json'
export const INTERNAL_URL = 'http://accounting.internal.test/export'
export const REDIRECT_URL = 'http://supplier.example.test/redirect'
export type RequestText = (url: string, options: { redirect: 'follow' | 'error' }) => Promise<{ body: string; trace: string[] }>
