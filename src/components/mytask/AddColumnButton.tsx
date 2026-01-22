"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "./FormDialog";
import { ColorPicker } from "./ColorPicker";
import { COLUMN_COLORS } from "./dummy-data";

interface AddColumnButtonProps {
  onAddColumn: (title: string, color: string, description?: string) => void;
}

export function AddColumnButton({ onAddColumn }: AddColumnButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [columnTitle, setColumnTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLUMN_COLORS[0].value);
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (columnTitle.trim()) {
      onAddColumn(columnTitle.trim(), selectedColor, description.trim() || undefined);
      handleClose();
    }
  };

  const handleClose = () => {
    setColumnTitle("");
    setSelectedColor(COLUMN_COLORS[0].value);
    setDescription("");
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="h-12 w-12 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
        title="Add column"
      >
        <Plus className="h-5 w-5" />
      </Button>

      <FormDialog
        isOpen={isOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        title="New Column"
        description="Create a new column for organizing your tasks"
        submitLabel="Save"
        submitDisabled={!columnTitle.trim()}
        submitVariant="success"
      >
        <div className="space-y-4">
          {/* Label/Title */}
          <div className="space-y-2">
            <Label htmlFor="column-title">
              Label text <span className="text-red-500">*</span>
            </Label>
            <Input
              id="column-title"
              value={columnTitle}
              onChange={(e) => setColumnTitle(e.target.value)}
              placeholder="e.g., In Review"
              className="h-9"
              autoFocus
            />
          </div>

          {/* Color Picker */}
          <ColorPicker
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
          />

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="column-description">Description</Label>
            <Textarea
              id="column-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Visible in group headers and value pickers"
              rows={3}
              className="resize-none text-sm"
            />
          </div>
        </div>
      </FormDialog>
    </>
  );
}
