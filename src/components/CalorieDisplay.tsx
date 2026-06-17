"use client";
import { CalorieResult, Goal } from "@/types";
import { GOAL_LABELS } from "@/lib/calorie";

interface Props {
  result: CalorieResult;
  goal: Goal;
}

export default function CalorieDisplay({ result, goal }: Props) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
      <h3 className="text-lg font-bold text-green-800 mb-4">
        あなたのカロリー目標
      </h3>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700">
            {result.bmr.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">基礎代謝 (kcal)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700">
            {result.tdee.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">消費カロリー (kcal)</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">
            {result.targetCalories.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">目標カロリー (kcal)</div>
        </div>
      </div>
      <div className="bg-white rounded-xl px-4 py-2 text-sm text-green-700 font-medium text-center">
        目標：{GOAL_LABELS[goal]}
      </div>
    </div>
  );
}
