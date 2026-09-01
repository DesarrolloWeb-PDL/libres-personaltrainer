"use client";

import { useState } from "react";
import { api } from "@/lib/api/trpc-client";
import { useClientDate } from "@/hooks/use-client-date";
import { useSession } from "next-auth/react";

const ACTIVITY_LEVELS = [
  { value: 1.2, label: "Sedentary", description: "Desk job, little exercise" },
  { value: 1.375, label: "Light", description: "1-3 days/week exercise" },
  { value: 1.55, label: "Moderate", description: "3-5 days/week exercise" },
  { value: 1.725, label: "Active", description: "6-7 days/week exercise" },
  { value: 1.9, label: "Very Active", description: "Athlete / physical job" },
];

function calculateTDEE(
  weight: number,
  height: number,
  age: number,
  gender: string,
  activityLevel: number,
): number {
  // Mifflin-St Jeor Equation
  const bmr =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
  return Math.round(bmr * activityLevel);
}

export default function NutritionPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activityLevel, setActivityLevel] = useState(1.55);
  const clientDate = useClientDate();

  // Meal logging state
  const [mealName, setMealName] = useState("");
  const [mealCalories, setMealCalories] = useState("");
  const [mealProtein, setMealProtein] = useState("");
  const [mealCarbs, setMealCarbs] = useState("");
  const [mealFat, setMealFat] = useState("");

  const profile = api.nutrition.getProfile.useQuery({ userId });
  const dailySummary = api.nutrition.getDailySummary.useQuery({ userId });
  const logMeal = api.nutrition.logMeal.useMutation({
    onSuccess: () => {
      dailySummary.refetch();
      setMealName("");
      setMealCalories("");
      setMealProtein("");
      setMealCarbs("");
      setMealFat("");
    },
  });

  const updateProfile = api.nutrition.updateProfile.useMutation({
    onSuccess: () => profile.refetch(),
  });

  const w = parseFloat(weight) || profile.data?.weight || 0;
  const h = parseFloat(height) || profile.data?.height || 0;
  const a = parseFloat(age) || profile.data?.age || 0;
  const g = profile.data?.gender || gender;

  const tdee = w > 0 && h > 0 && a > 0 ? calculateTDEE(w, h, a, g, activityLevel) : 0;
  const maintenance = tdee;
  const bulking = tdee + 500;
  const cutting = tdee - 500;

  // Macro splits (protein: 2g/kg, rest split between carbs/fat)
  const proteinGrams = Math.round(w * 2);
  const proteinCalories = proteinGrams * 4;

  const cutMacroSplit = {
    protein: proteinGrams,
    carbs: Math.round((cutting - proteinCalories - (Math.round(cutting * 0.25) / 9) * 9) / 4),
    fat: Math.round((cutting * 0.25) / 9),
  };

  const bulkMacroSplit = {
    protein: proteinGrams,
    carbs: Math.round((bulking - proteinCalories - (Math.round(bulking * 0.25) / 9) * 9) / 4),
    fat: Math.round((bulking * 0.25) / 9),
  };

  const maintMacroSplit = {
    protein: proteinGrams,
    carbs: Math.round(
      (maintenance - proteinCalories - (Math.round(maintenance * 0.25) / 9) * 9) / 4,
    ),
    fat: Math.round((maintenance * 0.25) / 9),
  };

  const todayTotals = dailySummary.data?.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const remaining = {
    calories: Math.max(0, maintenance - todayTotals.calories),
    protein: Math.max(0, maintMacroSplit.protein - todayTotals.protein),
    carbs: Math.max(0, maintMacroSplit.carbs - todayTotals.carbs),
    fat: Math.max(0, maintMacroSplit.fat - todayTotals.fat),
  };

  const handleSaveProfile = () => {
    updateProfile.mutate({
      userId,
      gender,
      weight: parseFloat(weight) || undefined,
      height: parseFloat(height) || undefined,
      age: parseInt(age) || undefined,
    });
  };

  const handleLogMeal = () => {
    if (!mealName || !mealCalories) return;
    logMeal.mutate({
      userId,
      name: mealName,
      calories: parseInt(mealCalories),
      protein: parseInt(mealProtein) || 0,
      carbs: parseInt(mealCarbs) || 0,
      fat: parseInt(mealFat) || 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Nutrition</h1>
        <p className="mt-1 text-sm text-zinc-400">Calculate your calories and track your meals.</p>
      </div>

      {/* TDEE Calculator */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-10 bg-amber-500 rounded-full" />
          <div>
            <h2 className="font-semibold text-zinc-50">Calorie Calculator</h2>
            <p className="text-xs text-zinc-400">Enter your stats to find your daily needs.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={profile.data?.weight?.toString() ?? "75"}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder={profile.data?.height?.toString() ?? "175"}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder={profile.data?.age?.toString() ?? "25"}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Gender</label>
            <div className="flex gap-2">
              <button
                onClick={() => setGender("male")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  gender === "male"
                    ? "border-blue-500 bg-blue-500/20 text-blue-400"
                    : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                Male
              </button>
              <button
                onClick={() => setGender("female")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  gender === "female"
                    ? "border-blue-500 bg-blue-500/20 text-blue-400"
                    : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                Female
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-xs font-medium text-zinc-400 mb-1">Activity Level</label>
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setActivityLevel(level.value)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  activityLevel === level.value
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${activityLevel === level.value ? "text-blue-400" : "text-zinc-200"}`}
                  >
                    {level.label}
                  </span>
                  <span className="text-xs text-zinc-500">{level.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={updateProfile.isPending}
          className="mt-4 w-full rounded-xl bg-zinc-800 border border-zinc-700 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {updateProfile.isPending ? "Saving..." : "Save Stats"}
        </button>
      </div>

      {/* TDEE Results */}
      {tdee > 0 && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-10 bg-blue-500 rounded-full" />
            <div>
              <h2 className="font-semibold text-zinc-50">Your Numbers</h2>
              <p className="text-xs text-zinc-400">Based on Mifflin-St Jeor equation.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-3 text-center">
              <p className="text-xs text-zinc-500">Cutting</p>
              <p className="text-xl font-bold text-rose-400">{cutting}</p>
              <p className="text-[10px] text-zinc-500">cal/day</p>
            </div>
            <div className="rounded-lg bg-zinc-800 border border-blue-500/50 p-3 text-center">
              <p className="text-xs text-zinc-500">Maintenance</p>
              <p className="text-xl font-bold text-blue-400">{maintenance}</p>
              <p className="text-[10px] text-zinc-500">cal/day</p>
            </div>
            <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-3 text-center">
              <p className="text-xs text-zinc-500">Bulking</p>
              <p className="text-xl font-bold text-lime-400">{bulking}</p>
              <p className="text-[10px] text-zinc-500">cal/day</p>
            </div>
          </div>

          {/* Macro Split */}
          <div className="mt-4 rounded-lg bg-zinc-800 border border-zinc-700 p-3">
            <p className="text-xs font-medium text-zinc-400 mb-2">
              Recommended Macros (Maintenance)
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-zinc-100">{maintMacroSplit.protein}g</p>
                <p className="text-[10px] text-zinc-500">Protein</p>
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-100">{maintMacroSplit.carbs}g</p>
                <p className="text-[10px] text-zinc-500">Carbs</p>
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-100">{maintMacroSplit.fat}g</p>
                <p className="text-[10px] text-zinc-500">Fat</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Summary */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-10 bg-lime-500 rounded-full" />
          <div>
            <h2 className="font-semibold text-zinc-50">Today&apos;s Intake</h2>
            <p className="text-xs text-zinc-400">
              {dailySummary.data?.date ??
                (clientDate ? clientDate.toISOString().split("T")[0] : "")}
            </p>
          </div>
        </div>

        {tdee > 0 && (
          <div className="mb-4 rounded-lg bg-zinc-800 border border-zinc-700 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400">Calories</span>
              <span className="text-xs text-zinc-400">
                {todayTotals.calories} / {maintenance}
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-700 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (todayTotals.calories / maintenance) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-zinc-500">{remaining.calories} cal remaining</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-lg bg-zinc-800 p-2 text-center">
            <p className="text-sm font-bold text-zinc-100">{todayTotals.protein}g</p>
            <p className="text-[10px] text-zinc-500">Protein</p>
          </div>
          <div className="rounded-lg bg-zinc-800 p-2 text-center">
            <p className="text-sm font-bold text-zinc-100">{todayTotals.carbs}g</p>
            <p className="text-[10px] text-zinc-500">Carbs</p>
          </div>
          <div className="rounded-lg bg-zinc-800 p-2 text-center">
            <p className="text-sm font-bold text-zinc-100">{todayTotals.fat}g</p>
            <p className="text-[10px] text-zinc-500">Fat</p>
          </div>
        </div>

        {/* Log Meal Form */}
        <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-3">
          <p className="text-xs font-medium text-zinc-400 mb-3">Log a Meal</p>
          <input
            type="text"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="Meal name (e.g. Chicken & Rice)"
            className="mb-2 w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
          />
          <div className="grid grid-cols-4 gap-2">
            <input
              type="number"
              value={mealCalories}
              onChange={(e) => setMealCalories(e.target.value)}
              placeholder="Cal"
              className="rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="number"
              value={mealProtein}
              onChange={(e) => setMealProtein(e.target.value)}
              placeholder="P (g)"
              className="rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="number"
              value={mealCarbs}
              onChange={(e) => setMealCarbs(e.target.value)}
              placeholder="C (g)"
              className="rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="number"
              value={mealFat}
              onChange={(e) => setMealFat(e.target.value)}
              placeholder="F (g)"
              className="rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleLogMeal}
            disabled={!mealName || !mealCalories || logMeal.isPending}
            className="mt-3 w-full rounded-lg bg-blue-500 py-2 text-sm font-bold text-white hover:bg-blue-400 disabled:opacity-50 transition-colors"
          >
            {logMeal.isPending ? "Logging..." : "Log Meal"}
          </button>
        </div>

        {/* Today's Meals */}
        {dailySummary.data && dailySummary.data.meals.length > 0 && (
          <div className="mt-4 space-y-2">
            {dailySummary.data.meals.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between rounded-lg bg-zinc-800 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-100">{meal.name}</p>
                  <p className="text-xs text-zinc-500">
                    {meal.calories} cal • P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
