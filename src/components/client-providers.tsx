"use client";

import { UnreadCountProvider } from "@/components/chat/unread-count-provider";
import { Toaster } from "@/components/ui/sonner";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <UnreadCountProvider>
            <Toaster position="top-right" richColors />
            {children}
        </UnreadCountProvider>
    );
}
