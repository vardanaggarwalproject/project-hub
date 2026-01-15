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
  numberOfMonths = 2,
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
  const presetOptions = [
    {
      label: "Today",
      range: { from: today, to: today },
    },
    {
      label: "Tomorrow",
      range: { from: addDays(today, 1), to: addDays(today, 1) },
    },
    {
      label: "Next 7 days",
      range: { from: today, to: addDays(today, 7) },
    },
    {
      label: "Next 30 days",
      range: { from: today, to: addDays(today, 30) },
    },
    {
      label: "Next Week",
      range: { from: startOfWeek(addWeeks(today, 1)), to: endOfWeek(addWeeks(today, 1)) },
    },
    {
      label: "Next Month",
      range: { from: startOfMonth(addMonths(today, 1)), to: endOfMonth(addMonths(today, 1)) },
    },
    {
      label: "Next 3 months",
      range: { from: today, to: addMonths(today, 3) },
    },
    {
      label: "Next 6 months",
      range: { from: today, to: addMonths(today, 6) },
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
              "w-full justify-start text-left font-normal h-10 bg-white border-slate-200",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 max-w-[750px]" align="start">
          <div className="flex">
            {/* Presets Sidebar */}
            <div className="border-r bg-slate-50/50 p-2 min-w-[120px]">
              <div className="space-y-0.5">
                {presetOptions.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs font-normal hover:bg-white h-8 px-2"
                    onClick={() => handlePreset(preset.range)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Calendar Section */}
            <div className="p-3">
              {/* Date Inputs */}
              <div className="flex items-center gap-1.5 mb-3 pb-3 border-b">
                <Input
                  type="date"
                  value={fromInput}
                  onChange={handleFromInputChange}
                  className="h-8 text-xs w-[130px]"
                  placeholder="Start date"
                />
                <span className="text-muted-foreground text-xs">-</span>
                <Input
                  type="date"
                  value={toInput}
                  onChange={handleToInputChange}
                  className="h-8 text-xs w-[130px]"
                  placeholder="End date"
                />
              </div>

              {/* Calendar */}
              <div className="[&_.rdp]:scale-90 [&_.rdp]:-m-2">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={tempRange?.from}
                  selected={tempRange}
                  onSelect={setTempRange}
                  numberOfMonths={numberOfMonths}
                  fromDate={fromDate}
                  toDate={toDate}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 text-xs px-3"
                >
                  Reset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="h-8 text-xs px-3"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  className="h-8 text-xs px-3 bg-emerald-600 hover:bg-emerald-700"
                >
                  Update
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
