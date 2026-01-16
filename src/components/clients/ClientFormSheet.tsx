"use client";

import { GenericFormSheet, FormField } from "@/common/GenericFormSheet";
import { Building2, Mail, MapPin, FileText } from "lucide-react";

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

const clientFields: FormField[] = [
  {
    id: "name",
    label: "Client Name",
    type: "text",
    icon: Building2,
    placeholder: "Enter client name (e.g., Acme Corp)",
    required: true,
  },
  {
    id: "email",
    label: "Email Address",
    type: "email",
    icon: Mail,
    placeholder: "contact@example.com",
    required: false,
  },
  {
    id: "address",
    label: "Location",
    type: "text",
    icon: MapPin,
    placeholder: "Enter location or address",
    required: false,
  },
  {
    id: "description",
    label: "Description",
    type: "textarea",
    icon: FileText,
    placeholder: "Add notes or description about the client...",
    required: false,
    rows: 5,
  },
];

export function ClientFormSheet({
  open,
  onOpenChange,
  mode,
  clientId,
  initialData,
  onSuccess,
}: ClientFormSheetProps) {
  return (
    <GenericFormSheet
      open={open}
      onOpenChange={onOpenChange}
      mode={mode}
      title="Client"
      description={
        mode === "add"
          ? "Create a new client profile"
          : "Update client information"
      }
      headerIcon={Building2}
      fields={clientFields}
      apiEndpoint="/api/clients"
      itemId={clientId}
      initialData={initialData}
      onSuccess={onSuccess}
      submitButtonText={{
        add: "Add Client",
        edit: "Save Changes",
      }}
    />
  );
}
