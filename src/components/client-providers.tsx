"use client";

import { UnreadCountProvider } from "@/components/chat/unread-count-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { FloatingThemeToggle } from "@/components/theme-toggle";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            storageKey="project-hub-theme"
            disableTransitionOnChange={false}
        >
            <UnreadCountProvider>
                <Toaster position="top-right" richColors />
                <FloatingThemeToggle />
                {children}
            </UnreadCountProvider>
        </ThemeProvider>
    );
}
