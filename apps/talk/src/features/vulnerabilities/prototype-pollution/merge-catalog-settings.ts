export function mergeCatalogSettings(target: Record<string, unknown>, input: Record<string, unknown>) {
  for (const [key, value] of Object.entries(input)) {
    if (value !== null && typeof value === 'object') {
      // УЯЗВИМО: target['__proto__'] уже указывает на Object.prototype.
      target[key] ??= {}
      mergeCatalogSettings(target[key] as Record<string, unknown>, value as Record<string, unknown>)
    } else {
      target[key] = value
    }
  }
  return target
}
