"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "./theme-provider";

const OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light theme" },
  { value: "system", icon: Monitor, label: "System theme" },
  { value: "dark", icon: Moon, label: "Dark theme" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="glass flex items-center gap-1 p-1" role="group" aria-label="Theme">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className={`rounded-lg p-1.5 transition-all duration-300 ${
            theme === value
              ? "bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md"
              : "muted hover:scale-110"
          }`}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
