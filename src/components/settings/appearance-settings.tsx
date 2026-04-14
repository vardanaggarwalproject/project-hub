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
                <h3 className="text-2xl font-bold mb-1">Appearance</h3>
                <p className="text-sm text-muted-foreground">
                    Customize the interface style of the application
                </p>
            </div>

            <Card className="border-border/50 shadow-sm">
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <h4 className="text-sm font-semibold">Theme Mode</h4>
                            <p className="text-xs text-muted-foreground">
                                Select your preferred color mode for the dashboard
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl pt-1">
                            {/* Light Theme */}
                            <div className="space-y-2.5">
                                <button
                                    onClick={() => setTheme("light")}
                                    className={cn(
                                        "group relative w-full aspect-[4/3] rounded-lg border-2 p-2.5 transition-all duration-200 overflow-hidden",
                                        theme === "light"
                                            ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 dark:ring-blue-400/20 shadow-md"
                                            : "border-border/50 bg-muted/20 hover:border-border hover:shadow-sm"
                                    )}
                                >
                                    <div className="h-full w-full rounded-lg bg-white p-3 space-y-3 shadow-sm border border-slate-200">
                                        <div className="space-y-2">
                                            <div className="h-2 w-3/4 rounded-full bg-slate-200" />
                                            <div className="h-2 w-full rounded-full bg-slate-200" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 rounded-full bg-slate-200" />
                                            <div className="h-2 flex-1 rounded-full bg-slate-200" />
                                        </div>
                                    </div>
                                    {theme === "light" && (
                                        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-foreground flex items-center justify-center text-background shadow-md">
                                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                                <div className="flex items-center justify-center gap-2">
                                    <Sun className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Light</span>
                                </div>
                            </div>

                            {/* Dark Theme */}
                            <div className="space-y-2.5">
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={cn(
                                        "group relative w-full aspect-[4/3] rounded-lg border-2 p-2.5 transition-all duration-200 overflow-hidden",
                                        theme === "dark"
                                            ? "border-purple-500 dark:border-purple-400 ring-2 ring-purple-500/20 dark:ring-purple-400/20 shadow-md"
                                            : "border-border/50 bg-slate-950 hover:border-border hover:shadow-sm"
                                    )}
                                >
                                    <div className="h-full w-full rounded-lg bg-slate-950 p-3 space-y-3 shadow-sm border border-slate-800">
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
                                        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-foreground flex items-center justify-center text-background shadow-md">
                                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                                <div className="flex items-center justify-center gap-2">
                                    <Moon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Dark</span>
                                </div>
                            </div>

                            {/* System Theme */}
                            <div className="space-y-2.5">
                                <button
                                    onClick={() => setTheme("system")}
                                    className={cn(
                                        "group relative w-full aspect-[4/3] rounded-lg border-2 p-1 transition-all duration-200 overflow-hidden",
                                        theme === "system"
                                            ? "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 dark:ring-indigo-400/20 shadow-md"
                                            : "border-border/50 bg-muted/20 hover:border-border hover:shadow-sm"
                                    )}
                                >
                                    <div className="flex h-full w-full rounded-lg overflow-hidden border border-border/50">
                                        <div className="flex-1 bg-white p-2 space-y-2">
                                            <div className="h-1.5 w-3/4 rounded-full bg-slate-200" />
                                            <div className="h-1.5 w-full rounded-full bg-slate-200" />
                                        </div>
                                        <div className="flex-1 bg-slate-950 p-2 space-y-2 border-l border-border/50">
                                            <div className="h-1.5 w-3/4 rounded-full bg-slate-800" />
                                            <div className="h-1.5 w-full rounded-full bg-slate-800" />
                                        </div>
                                    </div>
                                    {theme === "system" && (
                                        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-foreground flex items-center justify-center text-background shadow-md">
                                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                                <div className="flex items-center justify-center gap-2">
                                    <Monitor className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">System</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

                    <div className="pt-0">
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
