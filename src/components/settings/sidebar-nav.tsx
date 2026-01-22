"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 overflow-x-auto pb-2 lg:pb-0",
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
            activeTab === item.href
              ? "bg-muted hover:bg-muted font-medium"
              : "hover:bg-muted/50 hover:underline hover:decoration-primary",
            "justify-start w-full text-left px-3 py-2 rounded-md transition-all duration-200"
          )}
        >
          <span className="mr-2">{item.icon}</span>
          {item.title}
        </button>
      ))}
    </nav>
  );
}
