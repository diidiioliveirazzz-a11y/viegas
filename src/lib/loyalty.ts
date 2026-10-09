export function loyaltyTierForVisits(visits: number) {
  if (visits >= 25) return "VIP";
  if (visits >= 12) return "Ouro";
  if (visits >= 5) return "Prata";
  return "Bronze";
}
