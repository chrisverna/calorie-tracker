import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { format, subDays } from "date-fns";
import { DEFAULT_GOALS, EMPTY_STATE } from "../constants";
import { createId } from "../lib/id";
import { normalizeGoals } from "../lib/nutrition";
import { clearLocalState, loadLocalState, saveLocalState } from "../services/localStorage";
import {
  getUser,
  isSupabaseConfigured,
  loadCloudState,
  saveCloudState,
  signInWithEmail,
  signOut,
  supabase
} from "../services/supabase";
import type {
  AppState,
  FoodDraft,
  FoodEntry,
  Goals,
  MealType,
  Recipe,
  SavedFood,
  SyncStatus
} from "../types";

interface AppContextValue {
  state: AppState;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  addEntry: (draft: FoodDraft, meal: MealType, date?: string) => FoodEntry;
  updateEntry: (id: string, changes: Partial<FoodEntry>) => void;
  deleteEntry: (id: string) => void;
  saveFood: (draft: FoodDraft) => void;
  deleteSavedFood: (id: string) => void;
  addRecipe: (recipe: Omit<Recipe, "id" | "createdAt">) => void;
  deleteRecipe: (id: string) => void;
  logRecipe: (recipe: Recipe, meal: MealType, date?: string) => void;
  copyDay: (sourceDate: string, targetDate?: string) => number;
  updateGoals: (goals: Goals) => void;
  loadSampleData: () => void;
  resetData: () => void;
  importState: (state: AppState) => void;
  syncStatus: SyncStatus;
  syncEmail: string | null;
  syncConfigured: boolean;
  requestMagicLink: (email: string) => Promise<void>;
  disconnectSync: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function touched(state: Omit<AppState, "updatedAt">): AppState {
  return { ...state, updatedAt: new Date().toISOString() };
}

function buildSampleState(current: AppState, selectedDate: string): AppState {
  const days = Array.from({ length: 10 }, (_, index) =>
    format(subDays(new Date(`${selectedDate}T12:00:00`), index), "yyyy-MM-dd")
  );
  const templates: Array<Omit<FoodEntry, "id" | "date" | "createdAt">> = [
    {
      meal: "breakfast",
      name: "Greek yogurt bowl",
      brand: "Homemade",
      servingSize: "1 bowl",
      servings: 1,
      calories: 385,
      protein: 32,
      carbs: 44,
      fat: 9,
      source: "manual"
    },
    {
      meal: "lunch",
      name: "Chicken grain bowl",
      brand: "Homemade",
      servingSize: "1 bowl",
      servings: 1,
      calories: 610,
      protein: 51,
      carbs: 65,
      fat: 17,
      source: "manual"
    },
    {
      meal: "snacks",
      name: "Apple & almond butter",
      servingSize: "1 snack",
      servings: 1,
      calories: 275,
      protein: 7,
      carbs: 31,
      fat: 15,
      source: "manual"
    },
    {
      meal: "dinner",
      name: "Salmon with roasted vegetables",
      brand: "Homemade",
      servingSize: "1 plate",
      servings: 1,
      calories: 665,
      protein: 48,
      carbs: 53,
      fat: 29,
      source: "manual"
    }
  ];

  const entries = days.flatMap((date, dayIndex) =>
    templates.slice(0, dayIndex === 0 ? 3 : 4).map((template, itemIndex) => ({
      ...template,
      id: createId(),
      date,
      calories: Math.round(template.calories * (0.92 + ((dayIndex + itemIndex) % 4) * 0.04)),
      createdAt: new Date().toISOString()
    }))
  );

  const savedFoods: SavedFood[] = templates.slice(0, 3).map((template) => ({
    id: createId(),
    name: template.name,
    brand: template.brand,
    servingSize: template.servingSize,
    servings: 1,
    calories: template.calories,
    protein: template.protein,
    carbs: template.carbs,
    fat: template.fat,
    source: "saved",
    createdAt: new Date().toISOString()
  }));

  return touched({
    ...current,
    entries,
    savedFoods
  });
}

export function AppProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>(() => loadLocalState());
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    navigator.onLine ? "local" : "offline"
  );
  const [syncEmail, setSyncEmail] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    saveLocalState(state);
    if (!hydratedRef.current || !userIdRef.current || !navigator.onLine) return;

    setSyncStatus("syncing");
    const timer = window.setTimeout(() => {
      saveCloudState(userIdRef.current!, state)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("error"));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    const handleOnline = () => setSyncStatus(userIdRef.current ? "syncing" : "local");
    const handleOffline = () => setSyncStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!supabase) {
      hydratedRef.current = true;
      return;
    }

    let active = true;
    const connect = async () => {
      try {
        const user = await getUser();
        if (!active || !user) {
          hydratedRef.current = true;
          return;
        }
        userIdRef.current = user.id;
        setSyncEmail(user.email ?? null);
        setSyncStatus("syncing");
        const cloud = await loadCloudState(user.id);
        if (!active) return;
        if (cloud && new Date(cloud.updatedAt) > new Date(state.updatedAt)) {
          setState({
            ...cloud,
            goals: normalizeGoals(cloud.goals, DEFAULT_GOALS)
          });
        } else {
          await saveCloudState(user.id, state);
        }
        setSyncStatus("synced");
      } catch {
        if (active) setSyncStatus("error");
      } finally {
        hydratedRef.current = true;
      }
    };
    void connect();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      userIdRef.current = user?.id ?? null;
      setSyncEmail(user?.email ?? null);
      setSyncStatus(user ? "syncing" : "local");
      if (user) void connect();
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
    // Initial state is intentionally used for conflict resolution once on startup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mutate = (update: (current: AppState) => Omit<AppState, "updatedAt">) => {
    setState((current) => touched(update(current)));
  };

  const addEntry = (draft: FoodDraft, meal: MealType, date = selectedDate): FoodEntry => {
    const entry: FoodEntry = {
      ...draft,
      id: createId(),
      meal,
      date,
      source: draft.source ?? "manual",
      createdAt: new Date().toISOString()
    };
    mutate((current) => ({ ...current, entries: [...current.entries, entry] }));
    return entry;
  };

  const updateEntry = (id: string, changes: Partial<FoodEntry>) => {
    mutate((current) => ({
      ...current,
      entries: current.entries.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry))
    }));
  };

  const deleteEntry = (id: string) => {
    mutate((current) => ({
      ...current,
      entries: current.entries.filter((entry) => entry.id !== id)
    }));
  };

  const saveFood = (draft: FoodDraft) => {
    const saved: SavedFood = {
      ...draft,
      id: createId(),
      source: "saved",
      createdAt: new Date().toISOString()
    };
    mutate((current) => ({
      ...current,
      savedFoods: [
        ...current.savedFoods.filter(
          (food) => food.name.toLocaleLowerCase() !== saved.name.toLocaleLowerCase()
        ),
        saved
      ]
    }));
  };

  const deleteSavedFood = (id: string) => {
    mutate((current) => ({
      ...current,
      savedFoods: current.savedFoods.filter((food) => food.id !== id)
    }));
  };

  const addRecipe = (recipe: Omit<Recipe, "id" | "createdAt">) => {
    mutate((current) => ({
      ...current,
      recipes: [...current.recipes, { ...recipe, id: createId(), createdAt: new Date().toISOString() }]
    }));
  };

  const deleteRecipe = (id: string) => {
    mutate((current) => ({
      ...current,
      recipes: current.recipes.filter((recipe) => recipe.id !== id)
    }));
  };

  const logRecipe = (recipe: Recipe, meal: MealType, date = selectedDate) => {
    const total = recipe.items.reduce(
      (sum, item) => ({
        calories: sum.calories + item.calories,
        protein: sum.protein + item.protein,
        carbs: sum.carbs + item.carbs,
        fat: sum.fat + item.fat
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    addEntry(
      {
        name: recipe.name,
        servingSize: `1 of ${recipe.servings} servings`,
        servings: 1,
        calories: Math.round(total.calories / recipe.servings),
        protein: total.protein / recipe.servings,
        carbs: total.carbs / recipe.servings,
        fat: total.fat / recipe.servings,
        source: "recipe"
      },
      meal,
      date
    );
  };

  const copyDay = (sourceDate: string, targetDate = selectedDate): number => {
    const source = state.entries.filter((entry) => entry.date === sourceDate);
    if (!source.length) return 0;
    const copied = source.map((entry) => ({
      ...entry,
      id: createId(),
      date: targetDate,
      source: "copied" as const,
      createdAt: new Date().toISOString()
    }));
    mutate((current) => ({ ...current, entries: [...current.entries, ...copied] }));
    return copied.length;
  };

  const updateGoals = (goals: Goals) => {
    mutate((current) => ({ ...current, goals: normalizeGoals(goals, DEFAULT_GOALS) }));
  };

  const loadSampleData = () => setState((current) => buildSampleState(current, selectedDate));

  const resetData = () => {
    clearLocalState();
    setState({ ...structuredClone(EMPTY_STATE), goals: { ...DEFAULT_GOALS } });
  };

  const importState = (nextState: AppState) => {
    setState(
      touched({
        ...nextState,
        goals: normalizeGoals(nextState.goals, DEFAULT_GOALS)
      })
    );
  };

  const requestMagicLink = async (email: string) => {
    await signInWithEmail(email);
  };

  const disconnectSync = async () => {
    await signOut();
    userIdRef.current = null;
    setSyncEmail(null);
    setSyncStatus("local");
  };

  return (
    <AppContext.Provider
      value={{
        state,
        selectedDate,
        setSelectedDate,
        addEntry,
        updateEntry,
        deleteEntry,
        saveFood,
        deleteSavedFood,
        addRecipe,
        deleteRecipe,
        logRecipe,
        copyDay,
        updateGoals,
        loadSampleData,
        resetData,
        importState,
        syncStatus,
        syncEmail,
        syncConfigured: isSupabaseConfigured,
        requestMagicLink,
        disconnectSync
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// The hook intentionally lives beside its provider so the state contract stays in one place.
// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
