"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: string;
  title: string;
  tone: ToastTone;
}

interface AppContextValue {
  theme: "light" | "dark";
  toggleTheme: () => void;
  pushToast: (title: string, tone?: ToastTone) => void;
}

const AppContext = createContext<AppContextValue | null>(null);
const THEME_STORAGE_KEY = "cabal-legacy-theme";
const LEGACY_THEME_STORAGE_KEY = "lon-theme";

function ToneIcon({ tone }: { tone: ToastTone }) {
  if (tone === "success") return <CheckCircle2 className="h-4 w-4" />;
  if (tone === "error") return <AlertTriangle className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const storedTheme =
      window.localStorage.getItem(THEME_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);

    return storedTheme === "light" ? "light" : "dark";
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const pushToast = useCallback((title: string, tone: ToastTone = "info") => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts((current) => [...current, { id, title, tone }]);

    const timeoutId = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);

    timeoutsRef.current.push(timeoutId);
  }, []);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutsRef.current = [];
    };
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme, pushToast }), [theme, toggleTheme, pushToast]);

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-end gap-3 p-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur",
              toast.tone === "success" && "border-emerald-400/40 bg-emerald-950/80 text-emerald-100",
              toast.tone === "error" && "border-rose-400/40 bg-rose-950/80 text-rose-100",
              toast.tone === "info" && "border-primary/30 bg-[#0C121C]/90 text-foreground"
            )}
          >
            <ToneIcon tone={toast.tone} />
            <span>{toast.title}</span>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useAppUi() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppUi must be used within AppProviders.");
  }

  return context;
}