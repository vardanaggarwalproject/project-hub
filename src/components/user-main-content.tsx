"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface UserMainContentProps {
  children: React.ReactNode;
}

export function UserMainContent({ children }: UserMainContentProps) {
  const pathname = usePathname();
  const isChatRoute = pathname === "/user/chat";

  return (
    <div
      className={cn(
        "flex-1 overflow-auto min-h-0",
        isChatRoute ? "p-0 overflow-hidden" : "p-5",
      )}
    >
      {children}
    </div>
  );
}
