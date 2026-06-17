"use client";
import { useState } from "react";
import { ShoppingItem } from "@/types";

interface Props {
  items: ShoppingItem[];
}

export default function ShoppingListView({ items }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const totalEstimate = items.reduce(
    (sum, item) => sum + (item.estimatedPrice ?? 0),
    0
  );

  const grouped = items.reduce<Record<string, { item: ShoppingItem; idx: number }[]>>(
    (acc, item, idx) => {
      const key = item.store ?? "その他";
      if (!acc[key]) acc[key] = [];
      acc[key].push({ item, idx });
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-4">
      {totalEstimate > 0 && (
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <span className="text-sm text-blue-600">
            合計概算：
            <span className="font-bold text-lg ml-1">
              ¥{totalEstimate.toLocaleString()}
            </span>
          </span>
        </div>
      )}

      {Object.entries(grouped).map(([store, storeItems]) => (
        <div key={store} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
            <span className="font-semibold text-sm text-gray-700">{store}</span>
          </div>
          <ul className="divide-y divide-gray-50">
            {storeItems.map(({ item, idx }) => (
              <li key={idx} className="px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => toggle(idx)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    checked.has(idx)
                      ? "bg-green-500 border-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {checked.has(idx) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    checked.has(idx) ? "line-through text-gray-400" : "text-gray-700"
                  }`}
                >
                  {item.name}
                </span>
                <span className="text-xs text-gray-500">{item.amount}</span>
                {item.estimatedPrice && (
                  <span className="text-xs text-gray-400">¥{item.estimatedPrice}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          買い物リストがありません。<br />メニューを生成してください。
        </div>
      )}
    </div>
  );
}
