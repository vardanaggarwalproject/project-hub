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
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1.5 overflow-x-auto pb-2 lg:pb-0 -mx-2 px-2 lg:mx-0 lg:px-0",
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
            "justify-start gap-3 w-full min-w-fit lg:min-w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200",
            activeTab === item.href
              ? "bg-muted font-semibold shadow-sm"
              : "hover:bg-muted/50 font-medium text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="shrink-0">{item.icon}</span>
          <span className="whitespace-nowrap">{item.title}</span>
        </button>
      ))}
    </nav>
  );
}
