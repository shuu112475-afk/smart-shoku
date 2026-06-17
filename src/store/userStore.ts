"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile, CalorieResult, WeeklyMenu, ShoppingItem } from "@/types";
import { calcCalories } from "@/lib/calorie";

interface UserStore {
  profile: UserProfile | null;
  calorieResult: CalorieResult | null;
  weeklyMenu: WeeklyMenu | null;
  shoppingList: ShoppingItem[];
  setProfile: (profile: UserProfile) => void;
  setWeeklyMenu: (menu: WeeklyMenu) => void;
  setShoppingList: (items: ShoppingItem[]) => void;
  clearMenu: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      profile: null,
      calorieResult: null,
      weeklyMenu: null,
      shoppingList: [],

      setProfile: (profile) => {
        const calorieResult = calcCalories(
          profile.weight,
          profile.height,
          profile.age,
          profile.gender,
          profile.activityLevel,
          profile.goal
        );
        // プロフィール変更時は既存メニューをクリアして再生成を促す
        set({ profile, calorieResult, weeklyMenu: null, shoppingList: [] });
      },

      setWeeklyMenu: (menu) => set({ weeklyMenu: menu }),

      setShoppingList: (items) => set({ shoppingList: items }),

      clearMenu: () => set({ weeklyMenu: null, shoppingList: [] }),
    }),
    { name: "smart-shoku-store" }
  )
);
