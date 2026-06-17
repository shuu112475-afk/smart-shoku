import { NextRequest, NextResponse } from "next/server";
import { Supermarket, WeekDay } from "@/types";

const DAYS: WeekDay[] = ["日", "月", "火", "水", "木", "金", "土"];

function getSaleDays(name: string): Record<WeekDay, string[]> {
  const n = name;
  if (n.includes("イオン") || n.includes("AEON"))
    return { 月: ["精肉20%オフ"], 火: [], 水: ["水産物特売", "野菜半額"], 木: [], 金: ["お弁当割引"], 土: ["週末特売", "卵特価"], 日: ["日曜市"] };
  if (n.includes("ライフ"))
    return { 月: [], 火: ["火曜市", "豆腐・納豆特価"], 水: [], 木: ["木曜特売", "精肉割引"], 金: [], 土: ["鮮魚特売"], 日: ["惣菜割引"] };
  if (n.includes("業務"))
    return { 月: [], 火: [], 水: [], 木: [], 金: ["週末前特売"], 土: [], 日: [] };
  if (n.includes("マックスバリュ") || n.includes("マルエツ"))
    return { 月: [], 火: ["火曜特売"], 水: ["野菜半額"], 木: [], 金: ["金曜特売"], 土: [], 日: [] };
  if (n.includes("コープ") || n.includes("生協"))
    return { 月: [], 火: [], 水: ["水曜特売"], 木: [], 金: [], 土: ["週末特売"], 日: [] };
  if (n.includes("ヤオコー") || n.includes("西友") || n.includes("サミット"))
    return { 月: [], 火: ["火曜特売"], 水: [], 木: [], 金: ["金曜特売"], 土: [], 日: [] };
  return { 月: [], 火: [], 水: ["水曜特売"], 木: [], 金: [], 土: ["週末特売"], 日: [] };
}

interface PlaceResult {
  id?: string;
  displayName?: { text: string };
  location?: { latitude: number; longitude: number };
  rating?: number;
  shortFormattedAddress?: string;
  currentOpeningHours?: { openNow?: boolean };
}

async function fetchFromPlacesNew(lat: number, lng: number): Promise<Supermarket[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("No API key");

  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.rating,places.shortFormattedAddress,places.currentOpeningHours",
      // Satisfy HTTP referrer restriction on the API key
      "Referer": "https://tokumeshi.vercel.app/",
    },
    body: JSON.stringify({
      includedTypes: ["supermarket", "grocery_store"],
      maxResultCount: 8,
      languageCode: "ja",
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radiusMeters: 2000,
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Places API (New) error:", res.status, body);
    throw new Error(`Places API error: ${res.status}`);
  }

  const data = await res.json();
  const places: PlaceResult[] = data.places ?? [];

  return places
    .map((place) => {
      const slat = place.location?.latitude ?? lat;
      const slng = place.location?.longitude ?? lng;
      const dist = Math.round(
        Math.sqrt(
          Math.pow((slat - lat) * 111000, 2) +
            Math.pow((slng - lng) * 91000, 2)
        )
      );
      const name = place.displayName?.text ?? "スーパー";
      return {
        id: place.id ?? String(Math.random()),
        name,
        address: place.shortFormattedAddress ?? "",
        lat: slat,
        lng: slng,
        distance: dist,
        rating: place.rating,
        openingHours:
          place.currentOpeningHours?.openNow === true
            ? "営業中"
            : place.currentOpeningHours?.openNow === false
            ? "営業時間外"
            : undefined,
        saleDays: getSaleDays(name),
      } as Supermarket;
    })
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}

const FALLBACK: Supermarket[] = [
  {
    id: "mock-1",
    name: "近隣スーパー",
    address: "位置情報を許可すると実際の店舗が表示されます",
    lat: 35.6762,
    lng: 139.6503,
    saleDays: { 月: [], 火: [], 水: ["水曜特売"], 木: [], 金: [], 土: ["週末特売"], 日: [] },
    openingHours: "9:00-22:00",
    rating: 4.0,
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const today = DAYS[new Date().getDay()] as WeekDay;

  if (lat && lng) {
    try {
      const supermarkets = await fetchFromPlacesNew(parseFloat(lat), parseFloat(lng));
      return NextResponse.json({ supermarkets, today });
    } catch (e) {
      console.error("Places API failed:", e);
    }
  }

  return NextResponse.json({ supermarkets: FALLBACK, today });
}
