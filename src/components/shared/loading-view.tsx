"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingViewProps {
  role?: "admin" | "user" | "guest";
  message?: string;
  fullScreen?: boolean;
}

export function LoadingView({ 
  role, 
  message = "Loading...", 
  fullScreen = true 
}: LoadingViewProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center bg-background p-6",
      fullScreen ? "fixed inset-0 z-[100]" : "h-full w-full min-h-[400px]"
    )}>
      <div className="flex flex-col items-center gap-6 max-w-xs w-full">
        {/* Simple Loader */}
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-primary" strokeWidth={2.5} />
          <div className="absolute inset-0 h-10 w-10 animate-pulse rounded-full bg-primary/10 blur-xl"></div>
        </div>
        
        {/* Clean Text */}
        <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {role && (
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary/60 px-2 py-1 bg-primary/5 rounded-md border border-primary/10">
              {role} Portal
            </span>
          )}
          <h2 className="text-lg font-bold tracking-tight text-foreground pt-2">
            Just a moment
          </h2>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            {message}
          </p>
        </div>

        {/* Minimal Progress Line */}
        <div className="w-32 h-1 bg-muted rounded-full overflow-hidden mt-2">
          <div className="h-full bg-primary animate-[loading_1.5s_infinite_ease-in-out]"></div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes loading {
          0% { width: 0; transform: translateX(0); }
          50% { width: 100%; transform: translateX(0); }
          100% { width: 0; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
