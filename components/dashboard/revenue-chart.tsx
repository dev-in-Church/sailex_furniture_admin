import { formatPrice } from "@/lib/utils";

type Day = { date: string; revenue: number; orders: number };

// "2026-11-17" -> "17 Nov" (parsed as a plain date so time zones can't shift it)
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short" }).format(
    new Date(`${iso}T00:00:00`),
  );

const longDate = (iso: string) =>
  new Intl.DateTimeFormat("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${iso}T00:00:00`));

export function RevenueChart({ data }: { data: Day[] }) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((day) => day.revenue), 0);
  const total = data.reduce((sum, day) => sum + day.revenue, 0);
  const orders = data.reduce((sum, day) => sum + day.orders, 0);

  const middle = data[Math.floor(data.length / 2)];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <p className="text-2xl font-semibold">{formatPrice(total)}</p>
        <p className="text-sm text-muted-foreground">
          from {orders} paid {orders === 1 ? "order" : "orders"} in the last{" "}
          {data.length} days
        </p>
      </div>

      <div
        role="img"
        aria-label={`Daily revenue for the last ${data.length} days. Total ${formatPrice(total)} from ${orders} paid orders.`}
        className="relative"
      >
        <span className="absolute -top-1 left-0 text-[10px] text-muted-foreground">
          {formatPrice(max)}
        </span>

        <div className="flex h-44 items-end gap-1 border-b border-border pt-4">
          {data.map((day) => {
            const height = max > 0 ? (day.revenue / max) * 100 : 0;
            return (
              <div
                key={day.date}
                title={`${longDate(day.date)}: ${formatPrice(day.revenue)} (${day.orders} ${day.orders === 1 ? "order" : "orders"})`}
                className="group flex h-full flex-1 items-end"
              >
                <div
                  className="w-full rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                  style={{ height: `${Math.max(height, day.revenue > 0 ? 3 : 1)}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex justify-between text-xs text-muted-foreground" aria-hidden="true">
        <span>{shortDate(data[0].date)}</span>
        <span>{shortDate(middle.date)}</span>
        <span>{shortDate(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}
