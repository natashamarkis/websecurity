export const DEFAULT_SETTINGS = '{\n  "view": {\n    "sort": "price",\n    "pageSize": 20\n  }\n}'

export const PROTOTYPE_PAYLOAD = '{\n  "view": { "sort": "price", "pageSize": 20 },\n  "__proto__": { "deliveryFee": 0 }\n}'

export const CONSTRUCTOR_PAYLOAD = '{\n  "view": { "sort": "price", "pageSize": 20 },\n  "constructor": {\n    "prototype": { "deliveryFee": 0 }\n  }\n}'

export const MAX_SETTINGS_LENGTH = 8000

export interface PollutionResult {
  accepted: boolean
  error: string | null
  sort: 'name' | 'price'
  pageSize: number
  afterParse: string
  prototypeFee: string
  newObjectFee: string
  hasOwnFee: boolean
  deliveryFee: number | null
}
