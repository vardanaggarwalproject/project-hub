"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, LucideIcon } from "lucide-react";
import { toast } from "sonner";

export interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "textarea" | "number" | "date" | "tel";
  icon?: LucideIcon;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | number;
  rows?: number; // For textarea
}

interface GenericFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  title: string;
  description: string;
  headerIcon?: LucideIcon;
  fields: FormField[];
  apiEndpoint: string; // e.g., "/api/clients"
  itemId?: string; // For edit mode
  initialData?: Record<string, any>;
  onSuccess?: () => void;
  submitButtonText?: {
    add: string;
    edit: string;
  };
}

export function GenericFormSheet({
  open,
  onOpenChange,
  mode,
  title,
  description,
  headerIcon: HeaderIcon,
  fields,
  apiEndpoint,
  itemId,
  initialData,
  onSuccess,
  submitButtonText = {
    add: "Add",
    edit: "Save Changes",
  },
}: GenericFormSheetProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setFormData(initialData);
      } else {
        // Initialize with default values
        const defaultData: Record<string, any> = {};
        fields.forEach((field) => {
          defaultData[field.id] = field.defaultValue || "";
        });
        setFormData(defaultData);
      }
    }
  }, [open, mode, initialData, fields]);

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = mode === "add" ? apiEndpoint : `${apiEndpoint}/${itemId}`;
      const method = mode === "add" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Failed to ${mode} item`);
      }

      // Show success notification
      toast.success(
        mode === "add"
          ? `${title} added successfully!`
          : `${title} updated successfully!`,
        {
          description: `Changes have been saved.`,
        }
      );

      // Close the sheet and refresh
      onOpenChange(false);

      // Call the onSuccess callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        mode === "add" ? `Failed to add ${title}` : `Failed to update ${title}`,
        {
          description: error.message || "Please try again.",
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (field: FormField) => {
    const FieldIcon = field.icon;
    const value = formData[field.id] || "";

    return (
      <div key={field.id} className="space-y-2">
        <Label
          htmlFor={field.id}
          className="text-sm font-semibold text-app-body flex items-center gap-2"
        >
          {FieldIcon && <FieldIcon className="h-4 w-4 text-blue-600" />}
          {field.label}
          {field.required && <span className="text-red-500">*</span>}
          {!field.required && (
            <span className="text-xs font-normal text-app-muted">
              (Optional)
            </span>
          )}
        </Label>

        {field.type === "textarea" ? (
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            required={field.required}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            rows={field.rows || 4}
            className="bg-app-input border-app focus-ring-app resize-none"
          />
        ) : (
          <Input
            id={field.id}
            type={field.type}
            placeholder={field.placeholder}
            required={field.required}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className="h-11 bg-app-input border-app focus-ring-app"
          />
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col bg-white dark:bg-[#191919]">
        <SheetHeader className="space-y-3 px-6 py-5 border-b border-app bg-white dark:bg-[#191919] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {HeaderIcon && (
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                <HeaderIcon className="h-5 w-5 text-white" />
              </div>
            )}
            <div className="flex-1">
              <SheetTitle className="text-xl font-bold text-app-heading">
                {mode === "add" ? `Add ${title}` : `Edit ${title}`}
              </SheetTitle>
              <SheetDescription className="text-sm text-app-body">
                {description}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 space-y-6 px-6 py-6 overflow-y-auto">
            {fields.map(renderField)}
          </div>

          <SheetFooter className="sticky bottom-0 bg-white dark:bg-[#191919] border-t border-app px-6 py-4 mt-auto">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 font-semibold"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "add" ? submitButtonText.add : submitButtonText.edit}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
