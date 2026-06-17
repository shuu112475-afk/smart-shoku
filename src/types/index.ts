export type Gender = "male" | "female";
export type ActivityLevel = 1.2 | 1.375 | 1.55 | 1.725 | 1.9;
export type Goal = "lose_slow" | "lose" | "lose_fast" | "maintain";

export interface UserProfile {
  height: number;
  weight: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: Goal;
  excludedIngredients: string[];
  weeklyBudget: number;
}

export interface CalorieResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
}

export interface Ingredient {
  name: string;
  amount: string;
}

export interface Meal {
  name: string;
  kcal: number;
  ingredients: Ingredient[];
  recipe: string[];
}

export interface DayMenu {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  totalKcal: number;
}

export type WeekDay = "月" | "火" | "水" | "木" | "金" | "土" | "日";

export type WeeklyMenu = Record<WeekDay, DayMenu>;

export interface ShoppingItem {
  name: string;
  amount: string;
  store?: string;
  buyDay?: string;
  estimatedPrice?: number;
}

export interface Supermarket {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number;
  saleDays: Record<WeekDay, string[]>;
  openingHours?: string;
  rating?: number;
}
