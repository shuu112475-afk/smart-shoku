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
    setUserPos(null);
    setStores([]);

    if (!navigator.geolocation) {
      setGeoError(true);
      setGeoReady(true);
      return;
    }

    let watchId: number;
    let bestPos: GeolocationPosition | null = null;
    let done = false;

    const finish = (forceError = false) => {
      if (done) return;
      done = true;
      navigator.geolocation.clearWatch(watchId);

      // 精度が1000m超は「ネットワーク位置情報（不正確）」なので拒否
      if (bestPos && bestPos.coords.accuracy <= 1000) {
        setUserPos({ lat: bestPos.coords.latitude, lng: bestPos.coords.longitude });
        setGeoError(false);
      } else {
        setGeoError(true);
      }
      if (forceError) setGeoError(true);
      setGeoReady(true);
    };

    // 20秒後に強制終了（GPS未取得のまま待ち続けない）
    const timer = setTimeout(() => finish(), 20000);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        bestPos = pos;
        // GPS精度200m以内が取れたら即確定
        if (pos.coords.accuracy <= 200) {
          clearTimeout(timer);
          finish();
        }
      },
      () => {
        clearTimeout(timer);
        finish(true);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
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
                  <p className="text-sm font-medium">GPS信号を取得中...</p>
                  <p className="text-xs mt-1">屋外だと取得が速くなります</p>
                </div>
              </div>
            )}

            {/* 位置情報エラー */}
            {geoReady && geoError && (
              <div className="rounded-2xl bg-orange-50 border border-orange-200 p-6 text-center">
                <div className="text-4xl mb-3">📍</div>
                <p className="text-orange-800 font-semibold mb-1">位置情報が取得できませんでした</p>
                <p className="text-orange-600 text-sm mb-4">
                  GPS信号が弱い、または位置情報の許可が必要です
                </p>
                <div className="text-left bg-white rounded-xl p-4 text-xs text-gray-600 mb-4 space-y-2">
                  <p className="font-semibold text-gray-700">よくある原因と対処法</p>
                  <p>📡 <span className="font-medium">屋内・地下</span>はGPS電波が届きにくいため、<strong>屋外</strong>で試してください</p>
                  <p>🔒 <span className="font-medium">iPhone</span>：設定 → Safari → 位置情報 →「このアプリの使用中」</p>
                  <p>🔒 <span className="font-medium">Android</span>：設定 → アプリ → Chrome → 権限 → 位置情報 → 許可</p>
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
