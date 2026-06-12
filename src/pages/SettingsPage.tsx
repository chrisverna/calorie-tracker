import {
  Cloud,
  CloudOff,
  Database,
  Download,
  Info,
  LogOut,
  Mail,
  RotateCcw,
  Save,
  Sparkles,
  Upload
} from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import {
  goalsFromPercentages,
  macroPercentageTotal,
  normalizeGoals
} from "../lib/nutrition";
import { useApp } from "../state/AppContext";
import type { AppState, Goals, MacroPercentages } from "../types";

export function SettingsPage() {
  const {
    state,
    updateGoals,
    syncConfigured,
    syncEmail,
    syncStatus,
    requestMagicLink,
    disconnectSync,
    loadSampleData,
    resetData,
    importState
  } = useApp();
  const [goals, setGoals] = useState<Goals>(state.goals);
  const [email, setEmail] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [savingGoals, setSavingGoals] = useState(false);
  const [goalError, setGoalError] = useState("");
  const [importError, setImportError] = useState("");

  useEffect(() => setGoals(state.goals), [state.goals]);

  const percentageTotal = macroPercentageTotal(goals);
  const proteinCalories = Math.round((goals.calories * goals.proteinPercent) / 100);
  const carbsCalories = Math.round((goals.calories * goals.carbsPercent) / 100);
  const caloriesAssigned = {
    protein: proteinCalories,
    carbs: carbsCalories,
    fat: Math.max(0, goals.calories - proteinCalories - carbsCalories)
  };

  const setCalories = (value: string) => {
    setGoalError("");
    setGoals((current) =>
      goalsFromPercentages(Math.max(0, Number(value) || 0), current)
    );
  };

  const setMacroPercent = (key: keyof MacroPercentages, value: string) => {
    setGoalError("");
    setGoals((current) =>
      goalsFromPercentages(current.calories, {
        proteinPercent: key === "proteinPercent" ? Math.max(0, Number(value) || 0) : current.proteinPercent,
        carbsPercent: key === "carbsPercent" ? Math.max(0, Number(value) || 0) : current.carbsPercent,
        fatPercent: key === "fatPercent" ? Math.max(0, Number(value) || 0) : current.fatPercent
      })
    );
  };

  const saveGoals = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (percentageTotal !== 100) {
      setGoalError(`Macro percentages must total 100%. They currently total ${percentageTotal}%.`);
      return;
    }
    updateGoals(goals);
    setGoalError("");
    setSavingGoals(true);
    window.setTimeout(() => setSavingGoals(false), 1200);
  };

  const sendMagicLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSyncMessage("");
    try {
      await requestMagicLink(email);
      setSyncMessage("Check your email for a secure sign-in link.");
    } catch (caught) {
      setSyncMessage(caught instanceof Error ? caught.message : "Unable to send the sign-in link.");
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `daily-fuel-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportError("");
    try {
      const parsed = JSON.parse(await file.text()) as Partial<AppState>;
      if (!Array.isArray(parsed.entries) || !parsed.goals || !Array.isArray(parsed.savedFoods)) {
        throw new Error("That file is not a Daily Fuel backup.");
      }
      importState({
        entries: parsed.entries,
        savedFoods: parsed.savedFoods,
        recipes: Array.isArray(parsed.recipes) ? parsed.recipes : [],
        goals: normalizeGoals(parsed.goals, state.goals),
        updatedAt: parsed.updatedAt ?? new Date().toISOString()
      });
    } catch (caught) {
      setImportError(caught instanceof Error ? caught.message : "The backup could not be imported.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="page settings-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Make it yours</p>
          <h1>Settings</h1>
          <p>Adjust your targets, sync your devices, and keep your data portable.</p>
        </div>
      </header>

      <div className="settings-layout">
        <section className="settings-card">
          <div className="settings-card-heading">
            <span><Sparkles size={20} /></span>
            <div>
              <h2>Daily goals</h2>
              <p>Set calories, then divide every calorie between protein, carbs, and fat.</p>
            </div>
          </div>
          <form className="goal-form" onSubmit={saveGoals}>
            <label className="field goal-calories-field">
              <span>Daily calories</span>
              <div className="input-suffix">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={goals.calories}
                  onChange={(event) => setCalories(event.target.value)}
                />
                <small>kcal</small>
              </div>
            </label>

            <div className="macro-percentage-heading">
              <span>Calorie distribution</span>
              <strong className={percentageTotal === 100 ? "is-valid" : "is-invalid"}>
                {percentageTotal}% / 100%
              </strong>
            </div>

            {([
              ["protein", "proteinPercent"],
              ["carbs", "carbsPercent"],
              ["fat", "fatPercent"]
            ] as const).map(([macro, percentKey]) => (
              <label className={`field macro-goal-field macro-goal-field--${macro}`} key={macro}>
                <span>{macro[0].toUpperCase() + macro.slice(1)}</span>
                <div className="input-suffix">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={goals[percentKey]}
                    onChange={(event) => setMacroPercent(percentKey, event.target.value)}
                  />
                  <small>%</small>
                </div>
                <em>
                  {caloriesAssigned[macro].toLocaleString()} kcal · {goals[macro]}g
                </em>
              </label>
            ))}

            <div className="macro-calorie-check">
              <span>Protein</span><strong>{caloriesAssigned.protein} kcal</strong>
              <span>Carbs</span><strong>{caloriesAssigned.carbs} kcal</strong>
              <span>Fat</span><strong>{caloriesAssigned.fat} kcal</strong>
              <span>Total assigned</span>
              <strong>{Math.round(goals.calories * percentageTotal / 100).toLocaleString()} / {goals.calories.toLocaleString()} kcal</strong>
            </div>

            {goalError && <p className="form-message form-message--error goal-form-message">{goalError}</p>}
            <button
              className="button button--primary"
              type="submit"
              disabled={percentageTotal !== 100 || goals.calories <= 0}
            >
              <Save size={17} /> {savingGoals ? "Saved" : "Save goals"}
            </button>
          </form>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <span>{syncEmail ? <Cloud size={20} /> : <CloudOff size={20} />}</span>
            <div>
              <h2>Cross-device sync</h2>
              <p>Optional, private cloud backup through Supabase.</p>
            </div>
          </div>

          {!syncConfigured ? (
            <div className="setup-notice">
              <Info size={19} />
              <div>
                <strong>Cloud sync is not configured</strong>
                <p>
                  The app is working locally. Add the two Supabase values from <code>.env.example</code>
                  to enable magic-link sign in and syncing.
                </p>
              </div>
            </div>
          ) : syncEmail ? (
            <div className="sync-connected">
              <div>
                <span className={`sync-indicator sync-indicator--${syncStatus}`} />
                <p><strong>{syncEmail}</strong><small>{syncStatus === "synced" ? "Up to date" : syncStatus}</small></p>
              </div>
              <button className="button button--ghost" type="button" onClick={() => void disconnectSync()}>
                <LogOut size={16} /> Disconnect
              </button>
            </div>
          ) : (
            <form className="sync-form" onSubmit={sendMagicLink}>
              <label className="field">
                <span>Email address</span>
                <div className="input-icon">
                  <Mail size={17} />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </label>
              <button className="button button--secondary" type="submit">Send sign-in link</button>
              {syncMessage && <p className="form-message">{syncMessage}</p>}
            </form>
          )}
        </section>

        <section className="settings-card settings-card--full">
          <div className="settings-card-heading">
            <span><Database size={20} /></span>
            <div>
              <h2>Your data</h2>
              <p>Export a readable backup or move your log to another browser.</p>
            </div>
          </div>
          <div className="data-actions">
            <button className="data-action" type="button" onClick={exportData}>
              <span><Download size={20} /></span>
              <strong>Export backup</strong>
              <small>Download all data as JSON</small>
            </button>
            <label className="data-action">
              <span><Upload size={20} /></span>
              <strong>Import backup</strong>
              <small>Restore from a Daily Fuel file</small>
              <input type="file" accept="application/json" onChange={(event) => void importData(event)} />
            </label>
            <button className="data-action" type="button" onClick={loadSampleData}>
              <span><Sparkles size={20} /></span>
              <strong>Load sample data</strong>
              <small>Preview charts and meal logs</small>
            </button>
            <button
              className="data-action data-action--danger"
              type="button"
              onClick={() => {
                if (window.confirm("Delete all locally stored Daily Fuel data?")) resetData();
              }}
            >
              <span><RotateCcw size={20} /></span>
              <strong>Reset everything</strong>
              <small>Delete foods, meals, and goals</small>
            </button>
          </div>
          {importError && <p className="form-message form-message--error">{importError}</p>}
        </section>
      </div>
    </div>
  );
}
