const BOOKING_TIME_ZONE = "Europe/Lisbon";

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

export function getMaxBookableDate(isVip: boolean, now = new Date()): string {
  const [year, month, day] = getCurrentBookingDate(now).split("-").map(Number);
  const daysAhead = isVip ? 8 : 7;
  return new Date(Date.UTC(year, month - 1, day + daysAhead)).toISOString().slice(0, 10);
}

export function isDateWithinBookingWindow(
  date: string,
  isVip: boolean,
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
  return "A agenda está aberta até 7 dias para clientes regulares e até 8 dias para clientes VIP.";
}
