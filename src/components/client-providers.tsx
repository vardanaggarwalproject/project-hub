"use client";

import { UnreadCountProvider } from "@/components/chat/unread-count-provider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <UnreadCountProvider>
            {children}
        </UnreadCountProvider>
    );
}
