"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, Building2, Mail, MapPin, FileText, X } from "lucide-react";
import { toast } from "sonner";

interface ClientFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  clientId?: string;
  initialData?: {
    name: string;
    email: string;
    address: string;
    description: string;
  };
  onSuccess?: () => void;
}

export function ClientFormSheet({
  open,
  onOpenChange,
  mode,
  clientId,
  initialData,
  onSuccess,
}: ClientFormSheetProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Reset form when opening or when initialData changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setName(initialData.name || "");
        setEmail(initialData.email || "");
        setAddress(initialData.address || "");
        setDescription(initialData.description || "");
      } else {
        setName("");
        setEmail("");
        setAddress("");
        setDescription("");
      }
    }
  }, [open, mode, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = mode === "add" ? "/api/clients" : `/api/clients/${clientId}`;
      const method = mode === "add" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          address,
          description,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Failed to ${mode} client`);
      }

      // Show success notification
      toast.success(
        mode === "add" ? "Client added successfully!" : "Client updated successfully!",
        {
          description: `${name} has been ${mode === "add" ? "added" : "updated"}.`,
        }
      );

      // Close the sheet and refresh
      onOpenChange(false);

      // Call the onSuccess callback to refresh the list
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        mode === "add" ? "Failed to add client" : "Failed to update client",
        {
          description: error.message || "Please try again.",
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="space-y-3 px-6 py-5 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-xl font-bold text-slate-900">
                {mode === "add" ? "Add New Client" : "Edit Client"}
              </SheetTitle>
              <SheetDescription className="text-sm text-slate-600">
                {mode === "add"
                  ? "Create a new client profile"
                  : "Update client information"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 space-y-6 px-6 py-6 overflow-y-auto">
            {/* Client Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-semibold text-slate-700 flex items-center gap-2"
              >
                <Building2 className="h-4 w-4 text-blue-600" />
                Client Name
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter client name (e.g., Acme Corp)"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-white border-slate-200 focus-visible:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-slate-700 flex items-center gap-2"
              >
                <Mail className="h-4 w-4 text-blue-600" />
                Email Address
                <span className="text-xs font-normal text-slate-500">
                  (Optional)
                </span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-white border-slate-200 focus-visible:ring-blue-500"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label
                htmlFor="address"
                className="text-sm font-semibold text-slate-700 flex items-center gap-2"
              >
                <MapPin className="h-4 w-4 text-blue-600" />
                Location
                <span className="text-xs font-normal text-slate-500">
                  (Optional)
                </span>
              </Label>
              <Input
                id="address"
                placeholder="Enter location or address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-11 bg-white border-slate-200 focus-visible:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-semibold text-slate-700 flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-blue-600" />
                Description
                <span className="text-xs font-normal text-slate-500">
                  (Optional)
                </span>
              </Label>
              <Textarea
                id="description"
                placeholder="Add notes or description about the client..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] bg-white border-slate-200 focus-visible:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <SheetFooter className="sticky bottom-0 bg-white border-t px-6 py-4 mt-auto">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 font-semibold"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "add" ? "Add Client" : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
