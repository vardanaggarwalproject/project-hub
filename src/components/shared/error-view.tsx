"use client";

import React from "react";
import { AlertCircle, RefreshCcw, Home, ShieldAlert, FileSearch, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ErrorViewProps {
  error?: Error & { digest?: string };
  reset?: () => void;
  role?: "admin" | "user" | "guest";
  type?: "error" | "404" | "403" | "401";
  title?: string;
  message?: string;
  fullScreen?: boolean;
}

export function ErrorView({ 
  error, 
  reset, 
  role, 
  type = "error", 
  title, 
  message,
  fullScreen = false
}: ErrorViewProps) {
  
  const getDisplayContent = () => {
    switch (type) {
      case "404":
        return {
          icon: <FileSearch className="h-20 w-20 text-primary" />,
          code: "404",
          title: title || "Page Not Found",
          message: message || "The page you are looking for doesn't exist or has been moved to a different universe.",
          actionLabel: "Return to Dashboard",
          actionHref: role === "admin" ? "/admin/dashboard" : "/user/dashboard"
        };
      case "403":
        return {
          icon: <ShieldAlert className="h-20 w-20 text-destructive" />,
          code: "403",
          title: title || "Access Denied",
          message: message || "You've reached a restricted area. Please show your credentials or head back.",
          actionLabel: "Back to Safety",
          actionHref: role === "admin" ? "/admin/dashboard" : "/user/dashboard"
        };
      default:
        return {
          icon: <AlertCircle className="h-20 w-20 text-destructive" />,
          code: "ERR",
          title: title || "Something went wrong!",
          message: message || error?.message || "An unexpected error occurred. Our systems are working on a fix.",
          actionLabel: "Try Again",
          onClick: reset
        };
    }
  };

  const content = getDisplayContent();

  return (
    <div className={cn(
      "relative flex flex-col items-center justify-center p-6 text-center overflow-hidden",
      fullScreen ? "fixed inset-0 z-50 bg-background" : "min-h-[500px] w-full"
    )}>
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] z-0 pointer-events-none animate-pulse"></div>

      <div className="relative z-10 max-w-lg w-full">
        {/* Error Code Badge */}
        <div className="mb-8 flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-background/50 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl flex items-center justify-center animate-in zoom-in duration-500">
              {content.icon}
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                {content.code}
              </span>
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-4 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
          {content.title}
        </h1>
        
        <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto leading-relaxed">
          {content.message}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {content.onClick ? (
            <Button 
              onClick={content.onClick}
              size="lg"
              className="w-full sm:w-auto px-8 h-12 rounded-full font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {content.actionLabel}
            </Button>
          ) : (
            <Link href={content.actionHref || "/"} className="w-full sm:w-auto">
              <Button 
                size="lg"
                className="w-full px-8 h-12 rounded-full font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Home className="mr-2 h-4 w-4" />
                {content.actionLabel}
              </Button>
            </Link>
          )}
          
          <Button 
            variant="ghost" 
            size="lg"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto h-12 rounded-full font-medium"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>

        {error?.digest && (
          <div className="mt-12 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-white/5 text-[10px] text-muted-foreground font-mono">
            <span className="w-1 h-1 rounded-full bg-destructive animate-pulse"></span>
            TRACE ID: {error.digest}
          </div>
        )}
      </div>
    </div>
  );
}
