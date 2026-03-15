"use client";

import { MoonStar, SunMedium } from "lucide-react";

import { useAppUi } from "@/components/providers/app-providers";

export function ThemeToggle() {
  const { theme, toggleTheme } = useAppUi();
  const nextThemeLabel = theme === "dark" ? "Modo claro" : "Modo escuro";

  return (
    <button
      type="button"
      aria-label={nextThemeLabel}
      title={nextThemeLabel}
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-[#19E0FF]/22 bg-[#0C121C]/92 px-3 py-2 text-xs font-semibold text-[#A9B2C7] transition-colors hover:border-[#19E0FF]/45 hover:text-white"
    >
      {theme === "dark" ? <SunMedium className="h-4 w-4 text-[#19E0FF]" /> : <MoonStar className="h-4 w-4 text-[#19E0FF]" />}
      {nextThemeLabel}
    </button>
  );
}