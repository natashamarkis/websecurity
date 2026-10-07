export function demoDestinations(origin: string, attackerPort: number) {
  if (!Number.isInteger(attackerPort) || attackerPort < 1 || attackerPort > 65535) throw new Error('Invalid local port')
  const shop = new URL(origin)
  const external = new URL('/redirect-offer', shop)
  external.port = String(attackerPort)
  external.searchParams.set('shopPort', shop.port || '80')
  return {
    internal: new URL('/site/redirect/order', shop).href,
    external: external.href,
  }
}

// Ограничение учебного стенда, отдельно от показываемого исправления.
export function isDemoDestination(target: string, origin: string, attackerPort: number) {
  return Object.values(demoDestinations(origin, attackerPort)).includes(target)
}
