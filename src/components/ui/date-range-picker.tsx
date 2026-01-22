"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  /**
   * The selected date range
   */
  value?: DateRange;
  /**
   * Callback when date range changes
   */
  onChange: (range: DateRange | undefined) => void;
  /**
   * Placeholder text when no date is selected
   */
  placeholder?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Disable dates before this date
   */
  fromDate?: Date;
  /**
   * Disable dates after this date
   */
  toDate?: Date;
  /**
   * Number of months to display (default: 2)
   */
  numberOfMonths?: number;
  /**
   * Whether to disable future dates (default: true)
   */
  disableFuture?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Filter by date range",
  className,
  fromDate,
  toDate,
  numberOfMonths = 1,
  disableFuture = true,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(value);
  const [fromInput, setFromInput] = React.useState(value?.from ? format(value.from, "yyyy-MM-dd") : "");
  const [toInput, setToInput] = React.useState(value?.to ? format(value.to, "yyyy-MM-dd") : "");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setTempRange(value);
    setFromInput(value?.from ? format(value.from, "yyyy-MM-dd") : "");
    setToInput(value?.to ? format(value.to, "yyyy-MM-dd") : "");
  }, [value]);

  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today for inclusive comparison

  const presetOptions = [
    {
      label: "Today",
      range: { from: new Date(), to: new Date() },
    },
    {
      label: "Yesterday",
      range: { from: addDays(new Date(), -1), to: addDays(new Date(), -1) },
    },
    {
      label: "Last 7 days",
      range: { from: addDays(new Date(), -7), to: new Date() },
    },
    {
      label: "Last 30 days",
      range: { from: addDays(new Date(), -30), to: new Date() },
    },
    {
      label: "This Week",
      range: { from: startOfWeek(new Date()), to: new Date() },
    },
    {
      label: "This Month",
      range: { from: startOfMonth(new Date()), to: new Date() },
    },
  ];

  const handlePreset = (preset: DateRange) => {
    setTempRange(preset);
    setFromInput(preset.from ? format(preset.from, "yyyy-MM-dd") : "");
    setToInput(preset.to ? format(preset.to, "yyyy-MM-dd") : "");
  };

  const handleApply = () => {
    onChange(tempRange);
    setOpen(false);
  };

  const handleReset = () => {
    setTempRange(undefined);
    setFromInput("");
    setToInput("");
  };

  const handleFromInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromInput(e.target.value);
    if (e.target.value) {
      const date = new Date(e.target.value);
      setTempRange({ from: date, to: tempRange?.to });
    }
  };

  const handleToInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToInput(e.target.value);
    if (e.target.value) {
      const date = new Date(e.target.value);
      setTempRange({ from: tempRange?.from, to: date });
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-9 bg-white border-slate-200 hover:bg-slate-50",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
            {value?.from ? (
              value.to ? (
                <span className="text-xs truncate">
                  {format(value.from, "LLL dd")} - {format(value.to, "LLL dd, y")}
                </span>
              ) : (
                <span className="text-xs">{format(value.from, "LLL dd, y")}</span>
              )
            ) : (
              <span className="text-xs">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 shadow-2xl border-slate-200 rounded-2xl overflow-hidden"
          align="end"
          sideOffset={8}
        >
          <div className="flex flex-col md:flex-row bg-white max-w-[95vw] md:max-w-none">
            {/* Presets - Scrollable on mobile, Vertical on desktop */}
            <div className="border-b md:border-b-0 md:border-r bg-slate-50/50 p-2 md:w-[160px]">
              <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 no-scrollbar">
                {presetOptions.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "justify-start text-[11px] font-semibold h-8 px-3 transition-colors shrink-0",
                      tempRange?.from?.toDateString() === preset.range.from?.toDateString() &&
                        tempRange?.to?.toDateString() === preset.range.to?.toDateString()
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    )}
                    onClick={() => handlePreset(preset.range)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              {/* Manual Date Inputs */}
              <div className="grid grid-cols-2 gap-3 p-4 border-b bg-white">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Start Date</label>
                  <div className="relative group">
                    <Input
                      type="date"
                      value={fromInput}
                      onChange={handleFromInputChange}
                      className="h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white transition-all pr-2"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">End Date</label>
                  <div className="relative group">
                    <Input
                      type="date"
                      value={toInput}
                      onChange={handleToInputChange}
                      className="h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white transition-all pr-2"
                    />
                  </div>
                </div>
              </div>

              {/* Calendar Container */}
              <div className="p-2 md:p-4 bg-white flex justify-center items-center overflow-x-auto no-scrollbar">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={tempRange?.from}
                  selected={tempRange}
                  onSelect={setTempRange}
                  numberOfMonths={mounted && window.innerWidth > 768 ? 2 : 1}
                  fromDate={fromDate}
                  toDate={toDate}
                  disabled={(date) => {
                    // Normalize dates to start of day for comparison
                    const dateAtMidnight = new Date(date.setHours(0, 0, 0, 0));

                    // Disable dates before fromDate if specified
                    if (fromDate) {
                      const fromDateAtMidnight = new Date(fromDate.getTime());
                      fromDateAtMidnight.setHours(0, 0, 0, 0);
                      if (dateAtMidnight < fromDateAtMidnight) return true;
                    }

                    // Disable dates after toDate if specified
                    if (toDate) {
                      const toDateAtMidnight = new Date(toDate.getTime());
                      toDateAtMidnight.setHours(0, 0, 0, 0);
                      if (dateAtMidnight > toDateAtMidnight) return true;
                    }

                    // Disable future dates if disableFuture is true
                    if (disableFuture) {
                      const todayAtMidnight = new Date();
                      todayAtMidnight.setHours(0, 0, 0, 0);
                      if (dateAtMidnight > todayAtMidnight) return true;
                    }

                    return false;
                  }}
                  className="rounded-md border-none p-0 scale-[0.9] sm:scale-100 origin-top"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between p-4 bg-slate-50/50 border-t mt-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-9 text-xs px-3 font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  Reset Range
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="h-9 text-xs px-4 border-slate-200 font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApply}
                    className="h-9 text-xs px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-200 transition-all active:scale-95"
                  >
                    Apply Range
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
