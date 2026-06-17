"use client";
import { Supermarket, WeekDay } from "@/types";

interface Props {
  store: Supermarket;
  today: WeekDay;
}

export default function SupermarketCard({ store, today }: Props) {
  const todaySales = store.saleDays[today] ?? [];
  const hasSale = todaySales.length > 0;

  return (
    <div
      className={`rounded-2xl p-4 border transition-all ${
        hasSale
          ? "bg-amber-50 border-amber-200 shadow-md"
          : "bg-white border-gray-100 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-bold text-gray-800">{store.name}</h3>
          {store.distance !== undefined && (
            <p className="text-xs text-gray-500 mt-0.5">
              {store.distance >= 1000
                ? `${(store.distance / 1000).toFixed(1)}km`
                : `${store.distance}m`}
            </p>
          )}
        </div>
        {hasSale && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            本日特売
          </span>
        )}
      </div>

      {store.openingHours && (
        <p className="text-xs text-gray-500 mb-2">
          営業時間: {store.openingHours}
        </p>
      )}

      {hasSale && (
        <div className="space-y-1">
          {todaySales.map((sale, i) => (
            <div
              key={i}
              className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-lg font-medium"
            >
              {sale}
            </div>
          ))}
        </div>
      )}

      {!hasSale && (
        <p className="text-xs text-gray-400">今日の特売情報なし</p>
      )}
    </div>
  );
}
