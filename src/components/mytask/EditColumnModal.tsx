"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "./FormDialog";
import { ColorPicker } from "./ColorPicker";
import { Column } from "./dummy-data";

interface EditColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (columnId: string, title: string, color: string, description?: string) => void;
  column: Column | null;
}

export function EditColumnModal({
  isOpen,
  onClose,
  onSubmit,
  column,
}: EditColumnModalProps) {
  const [columnTitle, setColumnTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState("#6B7280");
  const [description, setDescription] = useState("");

  // Update form when column changes
  useEffect(() => {
    if (column) {
      setColumnTitle(column.title);
      setSelectedColor(column.color || "#6B7280");
      setDescription("");
    }
  }, [column]);

  const handleSubmit = () => {
    if (columnTitle.trim() && column) {
      onSubmit(column.id, columnTitle.trim(), selectedColor, description.trim() || undefined);
      handleClose();
    }
  };

  const handleClose = () => {
    setColumnTitle("");
    setSelectedColor("#6B7280");
    setDescription("");
    onClose();
  };

  if (!column) return null;

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Edit Column"
      description="Update the column title, color, and description"
      submitLabel="Save Changes"
      submitDisabled={!columnTitle.trim()}
      submitVariant="default"
    >
      <div className="space-y-4">
        {/* Column Title */}
        <div className="space-y-2">
          <Label htmlFor="edit-column-title">
            Column Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="edit-column-title"
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
          <Label htmlFor="edit-column-description">Description</Label>
          <Textarea
            id="edit-column-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Visible in group headers and value pickers"
            rows={3}
            className="resize-none text-sm"
          />
        </div>
      </div>
    </FormDialog>
  );
}
