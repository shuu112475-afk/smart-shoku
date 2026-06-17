"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import CalorieDisplay from "@/components/CalorieDisplay";
import { UserProfile, ActivityLevel, Goal } from "@/types";
import { ACTIVITY_LABELS, GOAL_LABELS, calcCalories } from "@/lib/calorie";

const ACTIVITY_OPTIONS: ActivityLevel[] = [1.2, 1.375, 1.55, 1.725, 1.9];
const GOAL_OPTIONS: Goal[] = ["lose_slow", "lose", "lose_fast", "maintain"];

export default function ProfilePage() {
  const router = useRouter();
  const { setProfile, calorieResult, profile } = useUserStore();

  const [form, setForm] = useState({
    height: profile?.height ?? 165,
    weight: profile?.weight ?? 65,
    age: profile?.age ?? 30,
    gender: profile?.gender ?? "female",
    activityLevel: profile?.activityLevel ?? 1.375,
    goal: profile?.goal ?? "lose",
    weeklyBudget: profile?.weeklyBudget ?? 7000,
    excludedIngredients: profile?.excludedIngredients?.join("、") ?? "",
  });

  const preview = calcCalories(
    form.weight,
    form.height,
    form.age,
    form.gender as "male" | "female",
    form.activityLevel as ActivityLevel,
    form.goal as Goal
  );

  const handleSave = () => {
    const p: UserProfile = {
      height: form.height,
      weight: form.weight,
      age: form.age,
      gender: form.gender as "male" | "female",
      activityLevel: form.activityLevel as ActivityLevel,
      goal: form.goal as Goal,
      weeklyBudget: form.weeklyBudget,
      excludedIngredients: form.excludedIngredients
        .split(/[、,，\s]+/)
        .filter(Boolean),
    };
    setProfile(p);
    router.push("/menu");
  };

  const field = (label: string, node: React.ReactNode) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>
      {node}
    </div>
  );

  const numInput = (key: "height" | "weight" | "age" | "weeklyBudget", unit: string) => (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
        className="border border-gray-200 rounded-xl px-3 py-2 w-28 text-center focus:outline-none focus:ring-2 focus:ring-green-400"
      />
      <span className="text-sm text-gray-500">{unit}</span>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">プロフィール設定</h1>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
        {/* リアルタイムプレビュー */}
        <CalorieDisplay result={preview} goal={form.goal as Goal} />

        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
          <h2 className="font-bold text-gray-700">身体情報</h2>

          <div className="grid grid-cols-2 gap-4">
            {field("身長", numInput("height", "cm"))}
            {field("体重", numInput("weight", "kg"))}
            {field("年齢", numInput("age", "歳"))}
            {field(
              "性別",
              <div className="flex gap-2">
                {(["male", "female"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setForm({ ...form, gender: g })}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                      form.gender === g
                        ? "bg-green-500 text-white border-green-500"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {g === "male" ? "男性" : "女性"}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              活動レベル
            </label>
            {ACTIVITY_OPTIONS.map((level) => (
              <button
                key={level}
                onClick={() => setForm({ ...form, activityLevel: level })}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all ${
                  form.activityLevel === level
                    ? "bg-green-50 border-green-400 text-green-700 font-medium"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                {ACTIVITY_LABELS[level]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-700">目標設定</h2>

          <div className="space-y-2">
            {GOAL_OPTIONS.map((g) => (
              <button
                key={g}
                onClick={() => setForm({ ...form, goal: g })}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all ${
                  form.goal === g
                    ? "bg-green-50 border-green-400 text-green-700 font-medium"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                {GOAL_LABELS[g]}
              </button>
            ))}
          </div>

          {field(
            "週の食費予算",
            numInput("weeklyBudget", "円")
          )}

          {field(
            "除外食材（苦手・アレルギー）",
            <input
              type="text"
              value={form.excludedIngredients}
              onChange={(e) =>
                setForm({ ...form, excludedIngredients: e.target.value })
              }
              placeholder="例：えび、貝類、牛乳"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          )}
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-600 active:scale-95 transition-all"
        >
          保存してメニューを見る →
        </button>
      </div>
    </main>
  );
}
