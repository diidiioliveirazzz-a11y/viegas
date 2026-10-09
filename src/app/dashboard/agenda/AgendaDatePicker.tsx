"use client";

import { useRouter } from "next/navigation";

function shiftDate(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

export default function AgendaDatePicker({
  selectedDate,
  today,
}: {
  selectedDate: string;
  today: string;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-label="Dia anterior"
        onClick={() =>
          router.push(`/dashboard/agenda?date=${shiftDate(selectedDate, -1)}`)
        }
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:border-red-500"
      >
        ←
      </button>
      <input
        aria-label="Escolher dia da agenda"
        type="date"
        value={selectedDate}
        onChange={(event) => {
          if (event.target.value) {
            router.push(`/dashboard/agenda?date=${event.target.value}`);
          }
        }}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white accent-red-600"
      />
      <button
        type="button"
        aria-label="Dia seguinte"
        onClick={() =>
          router.push(`/dashboard/agenda?date=${shiftDate(selectedDate, 1)}`)
        }
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:border-red-500"
      >
        →
      </button>
      {selectedDate !== today && (
        <button
          type="button"
          onClick={() => router.push(`/dashboard/agenda?date=${today}`)}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"
        >
          Hoje
        </button>
      )}
    </div>
  );
}
