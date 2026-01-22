"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppearanceSettings() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-1">Appearance</h3>
                <p className="text-sm text-muted-foreground">
                    Customize the interface style of the application
                </p>
            </div>

            <Card>
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <h4 className="text-sm font-medium">Theme Mode</h4>
                            <p className="text-xs text-muted-foreground">
                                Select your preferred color mode for the dashboard
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
                            {/* Light Theme */}
                            <div className="space-y-3">
                                <button 
                                    onClick={() => setTheme("light")}
                                    className={cn(
                                        "group relative w-full aspect-[4/3] rounded-xl border-2 p-3 transition-all duration-200 overflow-hidden",
                                        theme === "light" 
                                            ? "border-primary ring-2 ring-primary/20 shadow-sm" 
                                            : "border-muted bg-muted/20 hover:border-muted-foreground/30"
                                    )}
                                >
                                    <div className="h-full w-full rounded-lg bg-white p-3 space-y-3 shadow-inner">
                                        <div className="space-y-2">
                                            <div className="h-2 w-3/4 rounded-full bg-slate-100" />
                                            <div className="h-2 w-full rounded-full bg-slate-100" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 rounded-full bg-slate-100" />
                                            <div className="h-2 flex-1 rounded-full bg-slate-100" />
                                        </div>
                                    </div>
                                    {theme === "light" && (
                                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                </button>
                                <div className="flex items-center justify-center gap-2">
                                    <Sun className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-sm font-medium">Light</span>
                                </div>
                            </div>

                            {/* Dark Theme */}
                            <div className="space-y-3">
                                <button 
                                    onClick={() => setTheme("dark")}
                                    className={cn(
                                        "group relative w-full aspect-[4/3] rounded-xl border-2 p-3 transition-all duration-200 overflow-hidden",
                                        theme === "dark" 
                                            ? "border-primary ring-2 ring-primary/20 shadow-sm" 
                                            : "border-muted bg-slate-900 hover:border-muted-foreground/30"
                                    )}
                                >
                                    <div className="h-full w-full rounded-lg bg-slate-950 p-3 space-y-3 shadow-inner border border-slate-800">
                                        <div className="space-y-2">
                                            <div className="h-2 w-3/4 rounded-full bg-slate-800" />
                                            <div className="h-2 w-full rounded-full bg-slate-800" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 rounded-full bg-slate-800" />
                                            <div className="h-2 flex-1 rounded-full bg-slate-800" />
                                        </div>
                                    </div>
                                    {theme === "dark" && (
                                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                </button>
                                <div className="flex items-center justify-center gap-2">
                                    <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-sm font-medium">Dark</span>
                                </div>
                            </div>

                            {/* System Theme */}
                            <div className="space-y-3">
                                <button 
                                    onClick={() => setTheme("system")}
                                    className={cn(
                                        "group relative w-full aspect-[4/3] rounded-xl border-2 p-1 transition-all duration-200 overflow-hidden",
                                        theme === "system" 
                                            ? "border-primary ring-2 ring-primary/20 shadow-sm" 
                                            : "border-muted bg-muted-foreground/10 hover:border-muted-foreground/30"
                                    )}
                                >
                                    <div className="flex h-full w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                                        <div className="flex-1 bg-white p-2 space-y-2">
                                            <div className="h-1.5 w-3/4 rounded-full bg-slate-100" />
                                            <div className="h-1.5 w-full rounded-full bg-slate-100" />
                                        </div>
                                        <div className="flex-1 bg-slate-950 p-2 space-y-2 border-l border-slate-200 dark:border-slate-800">
                                            <div className="h-1.5 w-3/4 rounded-full bg-slate-800" />
                                            <div className="h-1.5 w-full rounded-full bg-slate-800" />
                                        </div>
                                    </div>
                                    {theme === "system" && (
                                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                </button>
                                <div className="flex items-center justify-center gap-2">
                                    <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-sm font-medium">System</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="pt-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Appearance settings are saved locally to your browser and will persist across sessions. 
                            System theme will automatically match your operating system settings.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
