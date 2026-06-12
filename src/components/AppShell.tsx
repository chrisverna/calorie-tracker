import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CircleUserRound,
  LayoutDashboard,
  Plus,
  ScanLine,
  Settings2,
  UtensilsCrossed
} from "lucide-react";
import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import { useApp } from "../state/AppContext";

interface AppShellProps extends PropsWithChildren {
  onAddFood: () => void;
  onScan: () => void;
}

const NAV_ITEMS = [
  { to: "/", label: "Today", icon: LayoutDashboard },
  { to: "/foods", label: "Foods", icon: BookOpen },
  { to: "/meals", label: "Meals", icon: UtensilsCrossed },
  { to: "/history", label: "History", icon: CalendarDays },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings2 }
] as const;

export function AppShell({ onAddFood, onScan, children }: AppShellProps) {
  const { syncEmail, syncStatus } = useApp();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">D</span>
          <div>
            <strong>Daily Fuel</strong>
            <small>Eat with intention</small>
          </div>
        </div>

        <button className="button button--primary sidebar-add" type="button" onClick={onAddFood}>
          <Plus size={18} />
          Add food
        </button>

        <nav className="primary-nav" aria-label="Main navigation">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="scan-card" type="button" onClick={onScan}>
          <span className="scan-icon">
            <ScanLine size={22} />
          </span>
          <span>
            <strong>Scan a barcode</strong>
            <small>Use your phone camera</small>
          </span>
        </button>

        <div className="sidebar-profile">
          <CircleUserRound size={28} />
          <span>
            <strong>{syncEmail ? syncEmail.split("@")[0] : "Personal log"}</strong>
            <small className={`status-dot status-dot--${syncStatus}`}>
              {syncStatus === "synced" ? "Cloud synced" : syncStatus === "offline" ? "Offline" : "Local"}
            </small>
          </span>
        </div>
      </aside>

      <main className="app-main">{children}</main>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/"}>
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="mobile-add-button" type="button" onClick={onAddFood} aria-label="Add food">
        <Plus size={25} />
      </button>
    </div>
  );
}
