"use client";

import { LucideIcon } from "lucide-react";

interface PlaceholderSettingsProps {
    title: string;
    icon: React.ReactNode;
}

export function PlaceholderSettings({ title, icon }: PlaceholderSettingsProps) {
    return (
        <div className="border border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
            {icon}
            <h3 className="mt-4 text-lg font-medium text-foreground">{title} Coming Soon</h3>
            <p className="text-sm">We are working hard to bring you this feature.</p>
        </div>
    )
}
