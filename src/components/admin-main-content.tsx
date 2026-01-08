"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AdminMainContentProps {
  children: React.ReactNode;
}

export function AdminMainContent({ children }: AdminMainContentProps) {
  const pathname = usePathname();
  const isChatRoute = pathname === "/admin/chat";

  return (
    <div className={cn("flex-1 overflow-auto", isChatRoute ? "p-0 overflow-hidden" : "p-8")}>
      {children}
    </div>
  );
}
