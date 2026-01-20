
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval, 
    isSameDay, 
    addMonths, 
    subMonths,
    startOfWeek,
    endOfWeek
} from "date-fns";
import { Card } from "@/components/ui/card";
import { CalendarHeader } from "@/components/update-history/CalendarHeader";
import { AdminCalendarGrid } from "@/components/admin/AdminCalendarGrid";
import { DayDetailsDialog } from "@/components/admin/DayDetailsDialog";
import { handleApiError } from "@/lib/utils/error-handler";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminCalendarViewProps {
    type: "eod" | "memo";
}

export function AdminCalendarView({ type }: AdminCalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [stats, setStats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const monthStr = format(currentMonth, "yyyy-MM");
            const res = await fetch(`/api/admin/stats/calendar?month=${monthStr}&type=${type}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setStats(data);
        } catch (error) {
            handleApiError(error, "Fetch calendar stats");
        } finally {
            setIsLoading(false);
        }
    }, [currentMonth, type]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth));
        const end = endOfWeek(endOfMonth(currentMonth));
        const days = eachDayOfInterval({ start, end });
        
        return days.map(d => {
            const dayStats = stats.find(s => isSameDay(new Date(s.date), d));
            return {
                date: d,
                isOtherMonth: d.getMonth() !== currentMonth.getMonth(),
                isToday: isSameDay(d, new Date()),
                stats: dayStats
            };
        });
    }, [currentMonth, stats]);

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        setIsDetailsOpen(true);
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm overflow-hidden">
                <CalendarHeader
                    currentMonth={currentMonth}
                    projectName="Organization Overview"
                    onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
                />
                
                {isLoading ? (
                    <div className="grid grid-cols-7 gap-px bg-slate-200 border-b">
                        {[...Array(35)].map((_, i) => (
                            <Skeleton key={i} className="h-[130px] w-full bg-white/50" />
                        ))}
                    </div>
                ) : (
                    <AdminCalendarGrid 
                        calendarDays={calendarDays} 
                        onDayClick={handleDayClick}
                        type={type}
                    />
                )}
            </Card>

            <DayDetailsDialog 
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                date={selectedDate}
                type={type}
            />
        </div>
    );
}
