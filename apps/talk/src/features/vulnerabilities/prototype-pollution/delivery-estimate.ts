export function estimateDelivery(deliveryOptions: { deliveryFee?: number }) {
  // Если своего deliveryFee нет, JavaScript ищет его в прототипе.
  return deliveryOptions.deliveryFee ?? 490
}
