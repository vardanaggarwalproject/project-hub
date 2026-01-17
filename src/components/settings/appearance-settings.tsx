"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Separator } from "@/components/ui/separator";
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
                <h3 className="text-lg font-medium">Appearance</h3>
                <p className="text-sm text-muted-foreground">
                    Customize the look and feel of the application. Automatically switch between day and night themes.
                </p>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-8 max-w-2xl">
                 <div className="space-y-2">
                     <div 
                         className={cn(
                             "items-center rounded-md border-2 p-1 hover:border-primary cursor-pointer transition-all",
                             theme === "light" ? "border-primary shadow-sm" : "border-muted bg-popover"
                         )}
                         onClick={() => setTheme("light")}
                     >
                        <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                            <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                            </div>
                        </div>
                     </div>
                     <span className="block w-full p-2 text-center font-normal text-sm">Light</span>
                 </div>

                 <div className="space-y-2">
                     <div 
                        className={cn(
                             "items-center rounded-md border-2 p-1 hover:border-primary cursor-pointer transition-all bg-slate-950",
                             theme === "dark" ? "border-primary shadow-sm" : "border-muted"
                         )}
                         onClick={() => setTheme("dark")}
                     >
                        <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                            <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                            </div>
                        </div>
                     </div>
                     <span className="block w-full p-2 text-center font-normal text-sm">Dark</span>
                 </div>

                 <div className="space-y-2">
                     <div 
                         className={cn(
                             "items-center rounded-md border-2 p-1 hover:border-primary cursor-pointer transition-all bg-slate-950",
                             theme === "system" ? "border-primary shadow-sm" : "border-muted"
                         )}
                         onClick={() => setTheme("system")}
                     >
                        <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                            <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                            </div>
                        </div>
                     </div>
                     <span className="block w-full p-2 text-center font-normal text-sm">System</span>
                 </div>
            </div>
        </div>
    );
}
