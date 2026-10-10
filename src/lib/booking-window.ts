const BOOKING_TIME_ZONE = "Europe/Lisbon";

export function isNighttimeBookingBlocked(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BOOKING_TIME_ZONE,
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);
  const hourPart = parts.find((p) => p.type === "hour");
  const hour = hourPart ? parseInt(hourPart.value, 10) : now.getHours();
  // Bloqueado da 01:00 às 08:00 (1 <= hour < 8)
  return hour >= 1 && hour < 8;
}

export const NIGHTTIME_BLOCK_MESSAGE =
  "🌙 As marcações estão em pausa durante a madrugada (01:00 às 08:00). A agenda reabre às 08:00 da manhã!";

function getCurrentBookingDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BOOKING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = new Map(parts.map(({ type, value }) => [type, value]));
  const year = values.get("year");
  const month = values.get("month");
  const day = values.get("day");
  if (!year || !month || !day) throw new Error("Não foi possível determinar a data local.");
  return `${year}-${month}-${day}`;
}

export function getMaxBookableDate(_isVip = false, now = new Date()): string {
  const [year, month, day] = getCurrentBookingDate(now).split("-").map(Number);
  // Agenda aberta até 30 dias para todos
  return new Date(Date.UTC(year, month - 1, day + 30)).toISOString().slice(0, 10);
}

export function isDateWithinBookingWindow(
  date: string,
  isVip = false,
  now = new Date()
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return false;
  }

  const today = getCurrentBookingDate(now);
  return date >= today && date <= getMaxBookableDate(isVip, now);
}

export function getTodayBookingDate(now = new Date()): string {
  return getCurrentBookingDate(now);
}

export function getBookingWindowMessage(): string {
  return "A data selecionada está fora do período disponível para marcações.";
}
