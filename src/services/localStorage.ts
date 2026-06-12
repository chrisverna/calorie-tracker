import { EMPTY_STATE } from "../constants";
import { normalizeGoals } from "../lib/nutrition";
import type { AppState } from "../types";

const STORAGE_KEY = "daily-fuel-state-v1";

export function loadLocalState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(EMPTY_STATE);
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...structuredClone(EMPTY_STATE),
      ...parsed,
      goals: normalizeGoals(parsed.goals, EMPTY_STATE.goals)
    };
  } catch {
    return structuredClone(EMPTY_STATE);
  }
}

export function saveLocalState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearLocalState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
