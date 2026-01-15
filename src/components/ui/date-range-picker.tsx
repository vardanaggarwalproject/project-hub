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
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Filter by date range",
  className,
  fromDate,
  toDate,
  numberOfMonths = 1,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(value);
  const [fromInput, setFromInput] = React.useState(value?.from ? format(value.from, "yyyy-MM-dd") : "");
  const [toInput, setToInput] = React.useState(value?.to ? format(value.to, "yyyy-MM-dd") : "");

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
              "w-full justify-start text-left font-normal h-10 bg-white border-slate-200 hover:bg-slate-50",
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
        <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
          <div className="flex flex-col sm:flex-row">
            {/* Presets - Vertical on Desktop, Horizontal on Mobile */}
            <div className="border-b sm:border-b-0 sm:border-r bg-slate-50/50 p-2 min-w-[140px]">
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-1">
                {presetOptions.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-[11px] font-medium hover:bg-white h-7 px-2"
                    onClick={() => handlePreset(preset.range)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="p-3">
              {/* Date Inputs - Compact */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 px-1">From</p>
                  <Input
                    type="date"
                    value={fromInput}
                    onChange={handleFromInputChange}
                    className="h-8 text-xs w-[125px] bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 px-1">To</p>
                  <Input
                    type="date"
                    value={toInput}
                    onChange={handleToInputChange}
                    className="h-8 text-xs w-[125px] bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              {/* Calendar - One Month */}
              <div className="flex justify-center">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={tempRange?.from}
                  selected={tempRange}
                  onSelect={setTempRange}
                  numberOfMonths={1}
                  fromDate={fromDate}
                  toDate={toDate || new Date()}
                  disabled={(date) => date > new Date()}
                  className="rounded-md border-none p-0"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 text-[11px] px-2 text-slate-500 hover:text-red-500 hover:bg-red-50"
                >
                  Reset
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="h-8 text-[11px] px-3 border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApply}
                    className="h-8 text-[11px] px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
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
