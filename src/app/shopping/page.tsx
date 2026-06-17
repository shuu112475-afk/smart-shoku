"use client";
import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import ShoppingListView from "@/components/ShoppingListView";
import StoreMap from "@/components/StoreMap";
import { Supermarket, WeekDay } from "@/types";

const DAYS: WeekDay[] = ["日", "月", "火", "水", "木", "金", "土"];

export default function ShoppingPage() {
  const { shoppingList } = useUserStore();
  const [stores, setStores] = useState<Supermarket[]>([]);
  const [today, setToday] = useState<WeekDay>("月");
  const [tab, setTab] = useState<"list" | "stores">("list");
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoReady, setGeoReady] = useState(false);

  useEffect(() => {
    setToday(DAYS[new Date().getDay()]);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGeoReady(true);
        },
        () => setGeoReady(true)
      );
    } else {
      setGeoReady(true);
    }
  }, []);

  const todaySaleCount = stores.filter((s) => (s.saleDays[today] ?? []).length > 0).length;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">買い物</h1>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mt-3">
          {([["list", "買い物リスト"], ["stores", "近隣スーパー"]] as const).map(
            ([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === key ? "bg-white shadow text-green-600 font-bold" : "text-gray-500"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">
        {tab === "list" ? (
          <ShoppingListView items={shoppingList} />
        ) : (
          <>
            {todaySaleCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-700 font-medium mb-4">
                🏷️ 今日（{today}曜日）は{todaySaleCount}店舗で特売！
              </div>
            )}

            {!geoReady ? (
              <div className="rounded-2xl bg-gray-100 flex items-center justify-center" style={{ height: 320 }}>
                <div className="text-center text-gray-400">
                  <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm">位置情報を取得中...</p>
                </div>
              </div>
            ) : (
              <StoreMap
                today={today}
                userLat={userPos?.lat}
                userLng={userPos?.lng}
                onStoresLoaded={setStores}
              />
            )}

            {geoReady && !userPos && stores.length === 0 && (
              <p className="text-center text-gray-400 py-4 text-sm mt-4">
                位置情報を許可すると近隣のスーパーをマップに表示します
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
