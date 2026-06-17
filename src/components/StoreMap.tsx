"use client";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMapsLibrary,
  useMap,
} from "@vis.gl/react-google-maps";
import { useState, useEffect, useCallback } from "react";
import { Supermarket, WeekDay } from "@/types";

function getSaleDays(name: string): Record<WeekDay, string[]> {
  if (name.includes("イオン") || name.includes("AEON"))
    return { 月: ["精肉20%オフ"], 火: [], 水: ["水産物特売", "野菜半額"], 木: [], 金: ["お弁当割引"], 土: ["週末特売", "卵特価"], 日: ["日曜市"] };
  if (name.includes("ライフ"))
    return { 月: [], 火: ["火曜市", "豆腐・納豆特価"], 水: [], 木: ["木曜特売", "精肉割引"], 金: [], 土: ["鮮魚特売"], 日: ["惣菜割引"] };
  if (name.includes("業務"))
    return { 月: [], 火: [], 水: [], 木: [], 金: ["週末前特売"], 土: [], 日: [] };
  if (name.includes("マックスバリュ") || name.includes("マルエツ"))
    return { 月: [], 火: ["火曜特売"], 水: ["野菜半額"], 木: [], 金: ["金曜特売"], 土: [], 日: [] };
  if (name.includes("コープ") || name.includes("生協"))
    return { 月: [], 火: [], 水: ["水曜特売"], 木: [], 金: [], 土: ["週末特売"], 日: [] };
  return { 月: [], 火: [], 水: ["水曜特売"], 木: [], 金: [], 土: ["週末特売"], 日: [] };
}

// 全ピンが収まるようにboundsを調整するコンポーネント
function BoundsFitter({
  stores,
  userLat,
  userLng,
}: {
  stores: Supermarket[];
  userLat?: number;
  userLng?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || stores.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    if (userLat && userLng) bounds.extend({ lat: userLat, lng: userLng });
    stores.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
    map.fitBounds(bounds, 60); // padding 60px
  }, [map, stores, userLat, userLng]);

  return null;
}

// Places API (New) で近隣スーパーを検索
function NearbySearch({
  lat,
  lng,
  onLoad,
}: {
  lat: number;
  lng: number;
  onLoad: (stores: Supermarket[]) => void;
}) {
  const placesLib = useMapsLibrary("places");

  useEffect(() => {
    if (!placesLib) return;

    const run = async () => {
      try {
        const { Place } = placesLib as typeof google.maps.places;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { places } = await (Place as any).searchNearby({
          fields: ["id", "displayName", "location", "rating", "shortFormattedAddress", "formattedAddress"],
          locationRestriction: new google.maps.Circle({
            center: { lat, lng },
            radius: 2000,
          }),
          includedPrimaryTypes: ["supermarket", "grocery_store"],
          maxResultCount: 8,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stores: Supermarket[] = places.map((place: any) => {
          const slat = place.location?.lat() ?? lat;
          const slng = place.location?.lng() ?? lng;
          const dist = Math.round(
            Math.sqrt(Math.pow((slat - lat) * 111000, 2) + Math.pow((slng - lng) * 91000, 2))
          );
          return {
            id: place.id ?? String(Math.random()),
            name: place.displayName ?? "スーパー",
            address: place.shortFormattedAddress ?? place.formattedAddress ?? "",
            lat: slat, lng: slng, distance: dist,
            rating: place.rating ?? undefined,
            openingHours: undefined,
            saleDays: getSaleDays(place.displayName ?? ""),
          };
        }).sort((a: Supermarket, b: Supermarket) => (a.distance ?? 0) - (b.distance ?? 0));

        onLoad(stores);
      } catch (e) {
        console.error("Places API (New) error:", e);
      }
    };

    run();
  }, [placesLib, lat, lng, onLoad]);

  return null;
}

// ズームイン制御コンポーネント
function ZoomController({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !target) return;
    map.panTo(target);
    map.setZoom(17);
  }, [map, target]);
  return null;
}

interface Props {
  today: WeekDay;
  userLat?: number;
  userLng?: number;
  onStoresLoaded?: (stores: Supermarket[]) => void;
}

export default function StoreMap({ today, userLat, userLng, onStoresLoaded }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stores, setStores] = useState<Supermarket[]>([]);
  const [zoomTarget, setZoomTarget] = useState<{ lat: number; lng: number } | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const center = userLat && userLng
    ? { lat: userLat, lng: userLng }
    : { lat: 35.6762, lng: 139.6503 };

  const handleStoresLoaded = useCallback((s: Supermarket[]) => {
    setStores(s);
    onStoresLoaded?.(s);
  }, [onStoresLoaded]);

  const handlePinClick = (store: Supermarket) => {
    if (selectedId === store.id) {
      setSelectedId(null);
      setZoomTarget(null);
    } else {
      setSelectedId(store.id);
      setZoomTarget({ lat: store.lat, lng: store.lng });
    }
  };

  const selectedStore = stores.find((s) => s.id === selectedId);

  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
      {/* マップ本体 */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 320 }}>
        <Map
          defaultCenter={center}
          defaultZoom={14}
          mapId="smart-shoku-map"
          gestureHandling="greedy"
        >
          {userLat && userLng && (
            <NearbySearch lat={userLat} lng={userLng} onLoad={handleStoresLoaded} />
          )}
          <BoundsFitter stores={stores} userLat={userLat} userLng={userLng} />
          <ZoomController target={zoomTarget} />

          {/* 現在地 */}
          {userLat && userLng && (
            <AdvancedMarker position={{ lat: userLat, lng: userLng }} zIndex={200}>
              <div className="flex flex-col items-center">
                <div className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full shadow mb-1 font-bold border border-blue-600">
                  現在地
                </div>
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
              </div>
            </AdvancedMarker>
          )}

          {/* 店舗ピン */}
          {stores.map((store) => {
            const hasSale = (store.saleDays[today] ?? []).length > 0;
            const isSelected = selectedId === store.id;
            return (
              <AdvancedMarker
                key={store.id}
                position={{ lat: store.lat, lng: store.lng }}
                onClick={() => handlePinClick(store)}
                zIndex={isSelected ? 100 : hasSale ? 10 : 1}
              >
                <div className="flex flex-col items-center cursor-pointer">
                  <div className={`text-xs font-bold px-2 py-0.5 rounded-full shadow mb-1 whitespace-nowrap border transition-transform ${
                    isSelected ? "scale-110" : ""
                  } ${hasSale
                    ? "bg-amber-400 text-white border-amber-500"
                    : "bg-white text-gray-700 border-gray-300"
                  }`}>
                    {hasSale ? "🏷️ " : ""}{store.name}
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg ${
                    hasSale ? "bg-amber-400" : "bg-green-500"
                  }`} />
                  <div className={`w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent ${
                    hasSale ? "border-t-amber-400" : "border-t-green-500"
                  }`} />
                </div>
              </AdvancedMarker>
            );
          })}

          {/* 吹き出し */}
          {selectedStore && (
            <InfoWindow
              position={{ lat: selectedStore.lat, lng: selectedStore.lng }}
              onCloseClick={() => { setSelectedId(null); setZoomTarget(null); }}
              pixelOffset={[0, -65]}
            >
              <div className="min-w-[160px] p-1">
                <p className="font-bold text-gray-800 text-sm">{selectedStore.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{selectedStore.address}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {selectedStore.distance !== undefined && (
                    <span className="text-xs text-gray-400">
                      {selectedStore.distance >= 1000
                        ? `${(selectedStore.distance / 1000).toFixed(1)}km`
                        : `${selectedStore.distance}m`}
                    </span>
                  )}
                  {selectedStore.rating && <span className="text-xs text-amber-500">★ {selectedStore.rating}</span>}
                  {selectedStore.openingHours && (
                    <span className={`text-xs font-medium ${selectedStore.openingHours === "営業中" ? "text-green-600" : "text-red-500"}`}>
                      {selectedStore.openingHours}
                    </span>
                  )}
                </div>
                {(selectedStore.saleDays[today] ?? []).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {selectedStore.saleDays[today].map((sale, i) => (
                      <div key={i} className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded font-medium">
                        🏷️ {sale}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>

      {/* 凡例 */}
      <div className="flex gap-4 text-xs text-gray-500 mt-2 px-1">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />本日特売あり
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />通常営業
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />現在地
        </span>
      </div>

      {/* 店舗カードリスト */}
      {stores.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500">近隣のスーパー（{stores.length}件）</p>
          {stores.map((store) => {
            const hasSale = (store.saleDays[today] ?? []).length > 0;
            const isSelected = selectedId === store.id;
            return (
              <button
                key={store.id}
                onClick={() => handlePinClick(store)}
                className={`w-full text-left rounded-2xl p-4 border transition-all ${
                  isSelected
                    ? "border-green-400 bg-green-50 shadow-md"
                    : hasSale
                    ? "border-amber-200 bg-amber-50 shadow-sm"
                    : "border-gray-100 bg-white shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 text-sm">{store.name}</span>
                      {hasSale && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          本日特売
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{store.address}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {store.distance !== undefined && (
                        <span className="text-xs text-gray-400">
                          📍 {store.distance >= 1000
                            ? `${(store.distance / 1000).toFixed(1)}km`
                            : `${store.distance}m`}
                        </span>
                      )}
                      {store.rating && <span className="text-xs text-amber-500">★ {store.rating}</span>}
                      {store.openingHours && (
                        <span className={`text-xs font-medium ${store.openingHours === "営業中" ? "text-green-600" : "text-red-400"}`}>
                          {store.openingHours}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-300 text-lg">›</span>
                </div>
                {hasSale && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {store.saleDays[today].map((sale, i) => (
                      <span key={i} className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        {sale}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </APIProvider>
  );
}
