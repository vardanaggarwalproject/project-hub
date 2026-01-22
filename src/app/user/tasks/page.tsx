"use client";

import { Card } from "@/components/ui/card";
import { ClipboardList, HardHat } from "lucide-react";

export default function UserTasksPage() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-500 delay-100">
            <Card className="w-full max-w-2xl border-none shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden p-12 text-center rounded-[2rem]">
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="h-24 w-24 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                            <ClipboardList className="h-12 w-12" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center text-amber-500">
                            <HardHat className="h-5 w-5" />
                        </div>
                    </div>
                </div>
                
                <h1 className="text-4xl font-black text-[#0f172a] uppercase tracking-tight mb-4">
                    My Tasks
                </h1>
                
                <div className="w-16 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mx-auto mb-6" />
                
                <h2 className="text-2xl font-bold text-slate-700 mb-6 uppercase tracking-widest">
                    Coming Soon
                </h2>
                
                <p className="text-slate-500 text-lg leading-relaxed max-w-md mx-auto">
                    We are crafting a comprehensive task management system to help you track your daily activities and deliverables with precision.
                </p>
            </Card>
        </div>
    );
}
