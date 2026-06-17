"use client";
import { useState } from "react";
import { WeeklyMenu, WeekDay, Ingredient } from "@/types";

interface Props {
  menu: WeeklyMenu;
}

interface RecipeData {
  steps: string[];
  tips: string;
}

const DAYS: WeekDay[] = ["月", "火", "水", "木", "金", "土", "日"];
const MEAL_LABELS = { breakfast: "朝", lunch: "昼", dinner: "夜" } as const;
const MEAL_COLORS = {
  breakfast: "bg-orange-100 text-orange-700",
  lunch: "bg-blue-100 text-blue-700",
  dinner: "bg-purple-100 text-purple-700",
} as const;

export default function WeeklyMenuView({ menu }: Props) {
  const [selectedDay, setSelectedDay] = useState<WeekDay>("月");
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Record<string, RecipeData>>({});
  const [loadingRecipe, setLoadingRecipe] = useState<string | null>(null);

  const dayMenu = menu[selectedDay];

  const handleToggle = async (
    id: string,
    mealName: string,
    ingredients: Ingredient[]
  ) => {
    if (expandedMeal === id) {
      setExpandedMeal(null);
      return;
    }
    setExpandedMeal(id);

    if (recipes[id]) return;

    setLoadingRecipe(id);
    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealName, ingredients }),
      });
      if (res.ok) {
        const { recipe } = await res.json();
        setRecipes((prev) => ({ ...prev, [id]: recipe }));
      }
    } catch {
      // レシピ取得失敗は無視してUIは表示
    } finally {
      setLoadingRecipe(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 曜日タブ */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => {
              setSelectedDay(day);
              setExpandedMeal(null);
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedDay === day
                ? "bg-white shadow text-green-600 font-bold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* 合計カロリー */}
      <div className="text-center text-sm text-gray-600">
        {selectedDay}曜日の合計：
        <span className="font-bold text-green-600 ml-1">
          {dayMenu?.totalKcal?.toLocaleString() ?? "—"} kcal
        </span>
      </div>

      {/* 食事カード */}
      {(["breakfast", "lunch", "dinner"] as const).map((mealKey) => {
        const meal = dayMenu?.[mealKey];
        const id = `${selectedDay}-${mealKey}`;
        const isOpen = expandedMeal === id;
        const recipe = recipes[id];
        const isLoadingThis = loadingRecipe === id;

        if (!meal) return null;

        return (
          <div
            key={mealKey}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* ヘッダー行 */}
            <button
              onClick={() =>
                handleToggle(id, meal.name, meal.ingredients)
              }
              className="w-full px-5 py-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-lg w-8 text-center ${MEAL_COLORS[mealKey]}`}
                >
                  {MEAL_LABELS[mealKey]}食
                </span>
                <span className="font-medium text-gray-800">{meal.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-500">
                  {meal.kcal} kcal
                </span>
                <span className="text-gray-400 text-xs">
                  {isOpen ? "▲" : "▼"}
                </span>
              </div>
            </button>

            {/* 展開エリア */}
            {isOpen && (
              <div className="border-t border-gray-50">
                {/* 食材 */}
                <div className="px-5 py-4 bg-gray-50">
                  <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                    食材（1人分）
                  </div>
                  <div className="space-y-1.5">
                    {meal.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{ing.name}</span>
                        <span className="text-sm font-medium text-gray-500 bg-white px-2 py-0.5 rounded-lg border border-gray-200">
                          {ing.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* レシピ */}
                <div className="px-5 py-4">
                  <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
                    作り方
                  </div>

                  {isLoadingThis ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                      <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                      レシピを取得中...
                    </div>
                  ) : recipe ? (
                    <>
                      <ol className="space-y-2">
                        {recipe.steps.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm text-gray-700">
                            <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                              {i + 1}
                            </span>
                            <span className="leading-relaxed">
                              {step.replace(/^[①②③④⑤⑥⑦⑧⑨⑩\d]+[\.、．]?\s*/, "")}
                            </span>
                          </li>
                        ))}
                      </ol>
                      {recipe.tips && (
                        <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700">
                          💡 {recipe.tips}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">
                      レシピの取得に失敗しました
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
