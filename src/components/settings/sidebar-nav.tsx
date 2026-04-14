"use client";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon: React.ReactNode;
  }[];
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function SidebarNav({ className, items, activeTab, onTabChange, ...props }: SidebarNavProps) {
  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 overflow-x-auto pb-2 lg:pb-0 -mx-2 px-2 lg:mx-0 lg:px-0",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <button
          key={item.href}
          onClick={() => onTabChange(item.href)}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "justify-start gap-3 w-full min-w-fit lg:min-w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 group relative",
            activeTab === item.href
              ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 font-semibold text-foreground shadow-sm border border-blue-200/50 dark:border-blue-800/30"
              : "font-normal text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {/* Active indicator */}
          {activeTab === item.href && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full" />
          )}

          <span className={cn(
            "shrink-0 transition-all duration-200",
            activeTab === item.href ? "text-blue-600 dark:text-blue-400 scale-110" : "group-hover:scale-105"
          )}>
            {item.icon}
          </span>
          <span className="whitespace-nowrap">{item.title}</span>
        </button>
      ))}
    </nav>
  );
}
