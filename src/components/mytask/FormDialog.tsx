"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitVariant?: "default" | "destructive" | "success";
}

export function FormDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  children,
  submitLabel = "Save",
  submitDisabled = false,
  submitVariant = "default",
}: FormDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const getSubmitClassName = () => {
    switch (submitVariant) {
      case "success":
        return "bg-green-600 hover:bg-green-700";
      case "destructive":
        return "bg-red-600 hover:bg-red-700";
      default:
        return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-4">{children}</div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitDisabled}
              className={getSubmitClassName()}
            >
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
