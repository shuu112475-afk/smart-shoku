"use client";
import { useEffect, useState, useCallback } from "react";
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
  const [geoError, setGeoError] = useState(false);

  const requestLocation = useCallback(() => {
    setGeoReady(false);
    setGeoError(false);
    setStores([]);

    if (!navigator.geolocation) {
      setGeoError(true);
      setGeoReady(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoError(false);
        setGeoReady(true);
      },
      () => {
        setGeoError(true);
        setGeoReady(true);
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    setToday(DAYS[new Date().getDay()]);
    requestLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

            {/* 位置情報取得中 */}
            {!geoReady && (
              <div className="rounded-2xl bg-gray-100 flex items-center justify-center" style={{ height: 320 }}>
                <div className="text-center text-gray-400">
                  <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm">位置情報を取得中...</p>
                </div>
              </div>
            )}

            {/* 位置情報エラー */}
            {geoReady && geoError && (
              <div className="rounded-2xl bg-orange-50 border border-orange-200 p-6 text-center">
                <div className="text-4xl mb-3">📍</div>
                <p className="text-orange-800 font-semibold mb-1">位置情報が取得できませんでした</p>
                <p className="text-orange-600 text-sm mb-4">
                  スマホの設定でブラウザの位置情報アクセスを許可してください
                </p>
                <div className="text-left bg-white rounded-xl p-4 text-xs text-gray-600 mb-4 space-y-1">
                  <p className="font-semibold text-gray-700">許可する手順（iPhone）</p>
                  <p>① 設定 → Safari → 位置情報</p>
                  <p>② 「確認」または「許可」に変更</p>
                  <p className="font-semibold text-gray-700 pt-1">許可する手順（Android）</p>
                  <p>① 設定 → アプリ → Chrome → 権限</p>
                  <p>② 「位置情報」→ 許可</p>
                </div>
                <button
                  onClick={requestLocation}
                  className="bg-green-500 text-white font-bold px-6 py-3 rounded-xl w-full"
                >
                  もう一度試す
                </button>
              </div>
            )}

            {/* マップ表示 */}
            {geoReady && !geoError && (
              <StoreMap
                today={today}
                userLat={userPos?.lat}
                userLng={userPos?.lng}
                onStoresLoaded={setStores}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
