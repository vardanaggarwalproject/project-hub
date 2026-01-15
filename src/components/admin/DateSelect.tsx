"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateSelectProps {
  date?: Date;
  onDateChange: (date?: Date) => void;
  placeholder?: string;
  className?: string;
}

export function DateSelect({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
}: DateSelectProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal h-10 bg-white border-slate-200 hover:bg-slate-50",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
            {date ? format(date, "PPP") : <span className="text-xs">{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {date && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDateChange(undefined)}
          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
