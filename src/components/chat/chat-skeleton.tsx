"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ChatSkeleton() {
    return (
        <div className="flex h-full w-full bg-white border border-slate-200 shadow-sm overflow-hidden min-h-[600px] animate-in fade-in duration-500">
            {/* Sidebar Skeleton */}
            <div className="w-[320px] border-r border-slate-100 flex flex-col hidden md:flex">
                <div className="p-4 border-b border-slate-100 space-y-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                <div className="flex-1 p-4 space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-xl" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 flex flex-col bg-slate-50/50">
                {/* Chat Header Skeleton */}
                <div className="h-[73px] bg-white border-b border-slate-100 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                </div>

                {/* Messages Area Skeleton */}
                <div className="flex-1 p-6 space-y-6 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                            <div className={`flex gap-3 max-w-[70%] ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                                <div className="space-y-2">
                                    <Skeleton className={`h-10 w-48 md:w-64 rounded-2xl ${i % 2 === 0 ? 'rounded-tl-none' : 'rounded-tr-none'}`} />
                                    <Skeleton className="h-3 w-12" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area Skeleton */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <div className="flex gap-2 items-center">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <Skeleton className="h-10 flex-1 rounded-xl" />
                        <Skeleton className="h-10 w-24 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
