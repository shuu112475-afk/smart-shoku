"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import WeeklyMenuView from "@/components/WeeklyMenuView";
import { WeeklyMenu, ShoppingItem } from "@/types";

function extractShoppingList(menu: WeeklyMenu): ShoppingItem[] {
  const ingredientMap: Record<string, ShoppingItem> = {};

  Object.values(menu).forEach((day) => {
    (["breakfast", "lunch", "dinner"] as const).forEach((mealKey) => {
      const meal = day[mealKey];
      if (!meal) return;
      meal.ingredients.forEach((ing) => {
        const name = typeof ing === "string" ? ing : ing.name;
        const amount = typeof ing === "string" ? "適量" : ing.amount;
        if (!ingredientMap[name]) {
          ingredientMap[name] = { name, amount };
        }
      });
    });
  });

  return Object.values(ingredientMap);
}

export default function MenuPage() {
  const router = useRouter();
  const { profile, calorieResult, weeklyMenu, setWeeklyMenu, setShoppingList } =
    useUserStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile || !calorieResult) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
        <div className="text-center">
          <p className="text-gray-600 mb-4">プロフィールを設定してください</p>
          <button
            onClick={() => router.push("/profile")}
            className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold"
          >
            プロフィールを設定する
          </button>
        </div>
      </main>
    );
  }

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCalories: calorieResult.targetCalories,
          excludedIngredients: profile.excludedIngredients,
          weeklyBudget: profile.weeklyBudget,
          saleInfo: {},
        }),
      });

      if (!res.ok) throw new Error("メニューの生成に失敗しました");

      const { menu } = await res.json();
      setWeeklyMenu(menu as WeeklyMenu);
      setShoppingList(extractShoppingList(menu as WeeklyMenu));
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">週間メニュー</h1>
          <span className="text-sm text-green-600 font-semibold">
            目標 {calorieResult.targetCalories.toLocaleString()} kcal/日
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
        {!weeklyMenu ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍱</div>
            <p className="text-gray-600 mb-6">
              AIが最適な1週間の献立を提案します
            </p>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-green-500 text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:bg-green-600 active:scale-95 transition-all disabled:opacity-60"
            >
              {loading ? "生成中..." : "献立を生成する"}
            </button>
          </div>
        ) : (
          <>
            <WeeklyMenuView menu={weeklyMenu} />
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 border-2 border-green-500 text-green-600 font-bold py-3 rounded-2xl hover:bg-green-50 transition-all disabled:opacity-60"
              >
                {loading ? "生成中..." : "再生成"}
              </button>
              <button
                onClick={() => router.push("/shopping")}
                className="flex-1 bg-green-500 text-white font-bold py-3 rounded-2xl shadow hover:bg-green-600 transition-all"
              >
                買い物リスト →
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
