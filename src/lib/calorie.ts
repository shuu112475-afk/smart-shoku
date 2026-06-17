import { Gender, ActivityLevel, Goal, CalorieResult } from "@/types";

export function calcBMR(
  weight: number,
  height: number,
  age: number,
  gender: Gender
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

export function calcTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * activityLevel);
}

export function calcTargetCalories(tdee: number, goal: Goal): number {
  const adjustments: Record<Goal, number> = {
    lose_slow: -275,
    lose: -550,
    lose_fast: -1100,
    maintain: 0,
  };
  const target = tdee + adjustments[goal];
  return Math.max(1200, Math.round(target));
}

export function calcCalories(
  weight: number,
  height: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel,
  goal: Goal
): CalorieResult {
  const bmr = calcBMR(weight, height, age, gender);
  const tdee = calcTDEE(bmr, activityLevel);
  const targetCalories = calcTargetCalories(tdee, goal);
  return { bmr: Math.round(bmr), tdee, targetCalories };
}

export const GOAL_LABELS: Record<Goal, string> = {
  lose_slow: "緩やか減量（週-0.25kg）",
  lose: "標準減量（週-0.5kg）",
  lose_fast: "積極的減量（週-1kg）",
  maintain: "体重維持",
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  1.2: "座りがち（運動なし）",
  1.375: "軽い運動（週1-3回）",
  1.55: "中程度の運動（週3-5回）",
  1.725: "ハードな運動（週6-7回）",
  1.9: "非常にハード（肉体労働等）",
};
