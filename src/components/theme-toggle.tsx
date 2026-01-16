"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * FloatingThemeToggle Component
 *
 * A floating action button that toggles between light and dark themes.
 * Positioned at the bottom-right corner with smooth animations.
 *
 * Features:
 * - Circular floating button
 * - Sun/Moon icon transitions
 * - Smooth fade and rotate animations
 * - Fixed position (stays visible while scrolling)
 * - Accessible with keyboard navigation
 */
export function FloatingThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <div className="fixed bottom-6 right-6 z-50 hidden">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
          "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700",
          "hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500"
        )}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        <Sun
          className={cn(
            "h-6 w-6 absolute transition-all duration-300",
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100 text-amber-500"
          )}
        />
        <Moon
          className={cn(
            "h-6 w-6 absolute transition-all duration-300",
            isDark
              ? "rotate-0 scale-100 opacity-100 text-blue-400"
              : "rotate-90 scale-0 opacity-0"
          )}
        />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}
