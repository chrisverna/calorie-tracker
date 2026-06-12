import { lazy, Suspense, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { FoodFormModal } from "./components/FoodFormModal";
import { RecipeFormModal } from "./components/RecipeFormModal";
import { DashboardPage } from "./pages/DashboardPage";
import { FoodsPage } from "./pages/FoodsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { MealsPage } from "./pages/MealsPage";
import { ProgressPage } from "./pages/ProgressPage";
import { SettingsPage } from "./pages/SettingsPage";
import type { FoodDraft, FoodEntry, MealType } from "./types";

const BarcodeScannerModal = lazy(() =>
  import("./components/BarcodeScannerModal").then((module) => ({
    default: module.BarcodeScannerModal
  }))
);

export function App() {
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [initialFood, setInitialFood] = useState<FoodDraft | FoodEntry | null>(null);
  const [initialMeal, setInitialMeal] = useState<MealType>("breakfast");

  const openAddFood = (meal: MealType = "breakfast") => {
    setInitialFood(null);
    setInitialMeal(meal);
    setFoodModalOpen(true);
  };

  const openFood = (food: FoodDraft | FoodEntry, meal: MealType = "breakfast") => {
    setInitialFood(food);
    setInitialMeal(meal);
    setFoodModalOpen(true);
  };

  return (
    <AppShell onAddFood={() => openAddFood()} onScan={() => setScannerOpen(true)}>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              onAddFood={openAddFood}
              onEditFood={(entry) => openFood(entry, entry.meal)}
              onScan={() => setScannerOpen(true)}
            />
          }
        />
        <Route
          path="/foods"
          element={
            <FoodsPage
              onAddFood={() => openAddFood()}
              onLogFood={(food, meal) => openFood(food, meal)}
            />
          }
        />
        <Route path="/meals" element={<MealsPage onCreateRecipe={() => setRecipeModalOpen(true)} />} />
        <Route path="/history" element={<HistoryPage onEditFood={(entry) => openFood(entry, entry.meal)} />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <FoodFormModal
        open={foodModalOpen}
        initialFood={initialFood}
        initialMeal={initialMeal}
        onClose={() => {
          setFoodModalOpen(false);
          setInitialFood(null);
        }}
      />
      <Suspense fallback={null}>
        {scannerOpen && (
          <BarcodeScannerModal
            open
            onClose={() => setScannerOpen(false)}
            onFound={(food) => {
              setScannerOpen(false);
              openFood(food);
            }}
          />
        )}
      </Suspense>
      <RecipeFormModal open={recipeModalOpen} onClose={() => setRecipeModalOpen(false)} />
    </AppShell>
  );
}
