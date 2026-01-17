"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClearFilterButtonProps {
    onClick: () => void;
    isActive: boolean;
    className?: string;
    label?: string;
}

export function ClearFilterButton({ 
    onClick, 
    isActive, 
    className,
    label = "Clear Filters" 
}: ClearFilterButtonProps) {
    if (!isActive) return null;

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            className={cn(
                "h-10 px-4 text-xs font-semibold whitespace-nowrap bg-white border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors animate-in fade-in zoom-in duration-200",
                className
            )}
        >
            <X className="h-3.5 w-3.5 mr-2" />
            {label}
        </Button>
    );
}
