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
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-2 overflow-x-auto pb-2 lg:pb-0 -mx-2 px-2 lg:mx-0 lg:px-0",
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
            "justify-start gap-3 w-full min-w-fit lg:min-w-full text-left px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
            activeTab === item.href
              ? "bg-muted/80 font-medium shadow-sm border border-border/50"
              : "font-normal text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
        >
          {/* Active indicator */}
          {activeTab === item.href && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-foreground/20 rounded-r-full" />
          )}

          <span className={cn(
            "shrink-0 transition-transform duration-300",
            activeTab === item.href ? "scale-110" : "group-hover:scale-105"
          )}>
            {item.icon}
          </span>
          <span className="whitespace-nowrap">{item.title}</span>
        </button>
      ))}
    </nav>
  );
}
