"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import SupermarketCard from "@/components/SupermarketCard";
import { Supermarket, WeekDay } from "@/types";

const DAYS: WeekDay[] = ["日", "月", "火", "水", "木", "金", "土"];

export default function HomePage() {
  const { profile, calorieResult, weeklyMenu } = useUserStore();
  const [stores, setStores] = useState<Supermarket[]>([]);
  const [today, setToday] = useState<WeekDay>("月");

  useEffect(() => {
    const d = DAYS[new Date().getDay()];
    setToday(d);

    const fetchStores = (lat?: number, lng?: number) => {
      const url =
        lat && lng
          ? `/api/supermarkets?lat=${lat}&lng=${lng}`
          : "/api/supermarkets";
      fetch(url)
        .then((r) => r.json())
        .then(({ supermarkets }) => setStores(supermarkets.slice(0, 3)))
        .catch(console.error);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => fetchStores(p.coords.latitude, p.coords.longitude),
        () => fetchStores()
      );
    } else {
      fetchStores();
    }
  }, []);

  const todaySaleStores = stores.filter(
    (s) => (s.saleDays[today] ?? []).length > 0
  );

  const todayMenu = weeklyMenu?.[today];

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-5 pt-10 pb-8">
        <p className="text-green-100 text-sm">今日は{today}曜日</p>
        <h1 className="text-2xl font-bold text-white mt-1">
          トクメシ
        </h1>
        {calorieResult && (
          <div className="bg-white/20 rounded-xl px-4 py-2 mt-3 inline-block">
            <span className="text-white text-sm font-medium">
              目標 {calorieResult.targetCalories.toLocaleString()} kcal/日
            </span>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-5 py-5 space-y-6">
        {!profile && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">👤</div>
            <p className="text-amber-800 font-medium mb-3">
              身体情報を登録してカロリー目標を設定しましょう
            </p>
            <Link
              href="/profile"
              className="bg-amber-500 text-white font-bold px-6 py-2.5 rounded-xl inline-block"
            >
              プロフィールを設定する
            </Link>
          </div>
        )}

        {todaySaleStores.length > 0 && (
          <section>
            <h2 className="font-bold text-gray-700 mb-3">
              今日（{today}曜日）の特売スーパー
            </h2>
            <div className="space-y-3">
              {todaySaleStores.map((s) => (
                <SupermarketCard key={s.id} store={s} today={today} />
              ))}
            </div>
          </section>
        )}

        {todayMenu ? (
          <section>
            <h2 className="font-bold text-gray-700 mb-3">今日の献立</h2>
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
              {(["breakfast", "lunch", "dinner"] as const).map((k) => {
                const labels = { breakfast: "朝", lunch: "昼", dinner: "夜" };
                const meal = todayMenu[k];
                return (
                  <div key={k} className="flex items-center gap-3">
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg w-8 text-center">
                      {labels[k]}
                    </span>
                    <span className="flex-1 text-sm text-gray-700">
                      {meal.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {meal.kcal} kcal
                    </span>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-gray-50 text-right text-sm text-gray-500">
                合計:{" "}
                <span className="font-bold text-green-600">
                  {todayMenu.totalKcal} kcal
                </span>
              </div>
            </div>
          </section>
        ) : (
          profile && (
            <section>
              <h2 className="font-bold text-gray-700 mb-3">週間献立</h2>
              <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                <div className="text-3xl mb-2">🍽️</div>
                <p className="text-gray-500 text-sm mb-3">
                  AIが最適な1週間の献立を提案します
                </p>
                <Link
                  href="/menu"
                  className="bg-green-500 text-white font-bold px-6 py-2.5 rounded-xl inline-block"
                >
                  献立を生成する
                </Link>
              </div>
            </section>
          )
        )}

        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/profile", icon: "👤", label: "プロフィール" },
            { href: "/menu", icon: "📅", label: "週間メニュー" },
            { href: "/shopping", icon: "🛒", label: "買い物リスト" },
          ].map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-xs text-gray-600 font-medium">{label}</div>
            </Link>
          ))}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        {[
          { href: "/", icon: "🏠", label: "ホーム" },
          { href: "/profile", icon: "👤", label: "プロフィール" },
          { href: "/menu", icon: "📅", label: "メニュー" },
          { href: "/shopping", icon: "🛒", label: "買い物" },
        ].map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center py-3 text-gray-400 hover:text-green-500 transition-colors"
          >
            <span className="text-xl">{icon}</span>
            <span className="text-xs mt-0.5">{label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
