"use client";

import { UnreadCountProvider } from "@/components/chat/unread-count-provider";
import { Toaster } from "sonner";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <UnreadCountProvider>
            <Toaster position="bottom-right" richColors />
            {children}
        </UnreadCountProvider>
    );
}
