"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { COLUMN_COLORS } from "./dummy-data";
import { Plus } from "lucide-react";

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({
  selectedColor,
  onColorChange,
  label = "Color",
}: ColorPickerProps) {
  const handleColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    onColorChange(color);
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">{label}</Label>

      {/* Preset Colors with better styling */}
      <div className="flex items-center gap-2.5 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
        {COLUMN_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => onColorChange(color.value)}
            className={`h-8 w-8 rounded-full transition-all hover:scale-110 shadow-sm ${
              selectedColor === color.value
                ? "ring-2 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900 ring-blue-500"
                : ""
            }`}
            style={{ backgroundColor: color.value }}
            title={color.name}
          />
        ))}

        {/* Custom Color Picker */}
        <label
          htmlFor="color-picker"
          className="h-8 w-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 flex items-center justify-center cursor-pointer transition-all hover:scale-110"
          title="Custom color"
        >
          <span className="text-gray-400 text-sm font-bold"><Plus/></span>
          <input
            id="color-picker"
            type="color"
            value={selectedColor}
            onChange={handleColorInput}
            className="sr-only"
          />
        </label>
        
      </div>

      {/* Large Color Preview with Gradient */}
      <div className="relative h-32 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-inner">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${selectedColor} 0%, ${selectedColor}ee 40%, ${selectedColor}aa 70%, ${selectedColor}66 100%)`,
          }}
        />
        {/* Color indicator dot */}
        <div className="absolute top-3 left-3">
          <div className="h-4 w-4 rounded-full bg-white border-2 border-gray-300 shadow-md" />
        </div>
      </div>

      {/* HEX Input with better styling */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
          <div className="flex-1">
            <Label htmlFor="hex-input" className="text-xs text-gray-500 uppercase font-semibold">
              HEX
            </Label>
            <Input
              id="hex-input"
              type="text"
              value={selectedColor}
              onChange={handleColorInput}
              placeholder="#3B82F6"
              className="h-8 border-0 bg-transparent font-mono text-sm font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 px-1"
              pattern="^#[0-9A-Fa-f]{6}$"
              maxLength={7}
            />
          </div>
          {/* Color preview swatch */}
          <div
            className="h-10 w-10 rounded-lg border-2 border-gray-200 dark:border-gray-700 flex-shrink-0 shadow-sm"
            style={{ backgroundColor: selectedColor }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Choose a preset or use the + button for custom colors
      </p>
    </div>
  );
}
