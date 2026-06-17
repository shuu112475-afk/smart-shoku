import { NextRequest, NextResponse } from "next/server";
import { Supermarket, WeekDay } from "@/types";

const DAYS: WeekDay[] = ["日", "月", "火", "水", "木", "金", "土"];

// チェーン名から曜日特売情報を返す（簡易ルールベース）
function getSaleDays(name: string): Record<WeekDay, string[]> {
  const n = name;
  if (n.includes("イオン") || n.includes("AEON")) {
    return { 月: ["精肉20%オフ"], 火: [], 水: ["水産物特売", "野菜半額"], 木: [], 金: ["お弁当割引"], 土: ["週末特売", "卵特価"], 日: ["日曜市"] };
  }
  if (n.includes("ライフ")) {
    return { 月: [], 火: ["火曜市", "豆腐・納豆特価"], 水: [], 木: ["木曜特売", "精肉割引"], 金: [], 土: ["鮮魚特売"], 日: ["惣菜割引"] };
  }
  if (n.includes("業務")) {
    return { 月: [], 火: [], 水: [], 木: [], 金: ["週末前特売"], 土: [], 日: [] };
  }
  if (n.includes("マックスバリュ") || n.includes("マクスバリュ")) {
    return { 月: [], 火: ["火曜特売"], 水: ["野菜半額"], 木: [], 金: ["金曜特売"], 土: [], 日: [] };
  }
  if (n.includes("コープ") || n.includes("生協")) {
    return { 月: [], 火: [], 水: ["水曜特売"], 木: [], 金: [], 土: ["週末特売"], 日: [] };
  }
  if (n.includes("ヤオコー") || n.includes("西友") || n.includes("サミット")) {
    return { 月: [], 火: ["火曜特売"], 水: [], 木: [], 金: ["金曜特売"], 土: [], 日: [] };
  }
  // デフォルト
  return { 月: [], 火: [], 水: ["水曜特売"], 木: [], 金: [], 土: ["週末特売"], 日: [] };
}

async function fetchFromGooglePlaces(lat: number, lng: number): Promise<Supermarket[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("No API key");

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=2000&type=supermarket&language=ja&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Places API error: ${data.status}`);
  }

  return (data.results ?? []).slice(0, 6).map((place: {
    place_id: string;
    name: string;
    vicinity: string;
    geometry: { location: { lat: number; lng: number } };
    rating?: number;
    opening_hours?: { open_now?: boolean };
  }) => {
    const storeLat = place.geometry.location.lat;
    const storeLng = place.geometry.location.lng;
    const distance = Math.round(
      Math.sqrt(
        Math.pow((storeLat - lat) * 111000, 2) +
        Math.pow((storeLng - lng) * 91000, 2)
      )
    );

    return {
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      lat: storeLat,
      lng: storeLng,
      distance,
      rating: place.rating,
      openingHours: place.opening_hours?.open_now !== undefined
        ? (place.opening_hours.open_now ? "営業中" : "営業時間外")
        : undefined,
      saleDays: getSaleDays(place.name),
    } as Supermarket;
  }).sort((a: Supermarket, b: Supermarket) => (a.distance ?? 0) - (b.distance ?? 0));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const today = DAYS[new Date().getDay()] as WeekDay;

  if (lat && lng) {
    try {
      const supermarkets = await fetchFromGooglePlaces(
        parseFloat(lat),
        parseFloat(lng)
      );
      return NextResponse.json({ supermarkets, today });
    } catch (e) {
      console.error("Places API failed:", e);
      // フォールバック：位置だけ使ったモックデータ
    }
  }

  // 位置情報なし or API失敗時のフォールバック
  const fallback: Supermarket[] = [
    {
      id: "mock-1", name: "近隣スーパー", address: "位置情報を許可すると実際の店舗が表示されます",
      lat: 35.6762, lng: 139.6503,
      saleDays: { 月: [], 火: [], 水: ["水曜特売"], 木: [], 金: [], 土: ["週末特売"], 日: [] },
      openingHours: "9:00-22:00", rating: 4.0,
    },
  ];
  return NextResponse.json({ supermarkets: fallback, today });
}
