"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Link2, Code2, CheckCircle2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * DynamicField Interface
 * Represents a single dynamic field (key-value pair) for project resources
 *
 * @property {string} id - Unique identifier for the field
 * @property {string} label - Display name/label (e.g., "Live URL", "Staging", "Figma")
 * @property {string} value - The actual URL or value
 * @property {boolean} useCustomAccess - If true, uses custom allowedRoles; if false, uses global
 * @property {string[]} allowedRoles - Array of roles that can view this resource (only used if useCustomAccess is true)
 */
export interface DynamicField {
  id: string;
  label: string;
  value: string;
  useCustomAccess?: boolean;
  allowedRoles?: string[];
}

/**
 * DynamicFieldsInput Component Props
 *
 * @property {DynamicField[]} fields - Array of current fields
 * @property {function} onChange - Callback when fields change
 * @property {string[]} globalAllowedRoles - Global role settings that apply to all links by default
 * @property {function} onGlobalRolesChange - Callback when global roles change
 */
interface DynamicFieldsInputProps {
  fields: DynamicField[];
  onChange: (fields: DynamicField[]) => void;
  globalAllowedRoles?: string[];
  onGlobalRolesChange?: (roles: string[]) => void;
}

/**
 * DynamicFieldsInput Component
 *
 * A reusable component for managing dynamic key-value pairs (like project links/resources).
 * Users can add multiple fields with custom labels and values.
 *
 * Features:
 * - Add new fields with + button
 * - Remove individual fields
 * - Update label and value for each field
 * - Shows empty state when no fields exist
 *
 * Usage Example:
 * ```tsx
 * const [links, setLinks] = useState<DynamicField[]>([]);
 * <DynamicFieldsInput fields={links} onChange={setLinks} />
 * ```
 */
export function DynamicFieldsInput({
  fields,
  onChange,
  globalAllowedRoles = ["admin", "developer", "tester"],
  onGlobalRolesChange
}: DynamicFieldsInputProps) {
  // Track if global access is "all" or "restrict"
  const [globalAccessMode, setGlobalAccessMode] = useState<"all" | "restrict">(
    globalAllowedRoles.includes("developer") && globalAllowedRoles.includes("tester") ? "all" : "restrict"
  );
  /**
   * Adds a new empty field to the list
   * Creates a new field with unique ID and empty label/value
   * Uses global access by default
   */
  const addField = () => {
    const newField: DynamicField = {
      id: crypto.randomUUID(),
      label: "",
      value: "",
      useCustomAccess: false,
      allowedRoles: undefined,
    };
    onChange([...fields, newField]);
  };

  /**
   * Removes a field by ID
   * @param {string} id - ID of the field to remove
   */
  const removeField = (id: string) => {
    onChange(fields.filter((field) => field.id !== id));
  };

  /**
   * Updates a specific field's label or value
   * @param {string} id - ID of the field to update
   * @param {"label" | "value"} key - Which property to update
   * @param {string} newValue - New value to set
   */
  const updateField = (id: string, key: "label" | "value", newValue: string) => {
    onChange(
      fields.map((field) =>
        field.id === id ? { ...field, [key]: newValue } : field
      )
    );
  };

  /**
   * Handles global access mode change (dropdown)
   * @param {string} mode - "all" or "restrict"
   */
  const handleGlobalAccessModeChange = (mode: "all" | "restrict") => {
    if (!onGlobalRolesChange) return;

    setGlobalAccessMode(mode);
    if (mode === "all") {
      onGlobalRolesChange(["admin", "developer", "tester"]);
    } else {
      // Start with admin only when restricting
      onGlobalRolesChange(["admin"]);
    }
  };

  /**
   * Toggles global role checkbox (only for developer/tester)
   * @param {string} role - Role to toggle
   */
  const toggleGlobalRole = (role: string) => {
    if (!onGlobalRolesChange || globalAccessMode === "all") return;

    const hasRole = globalAllowedRoles.includes(role);
    let newRoles: string[];

    if (hasRole) {
      newRoles = globalAllowedRoles.filter(r => r !== role);
    } else {
      newRoles = [...globalAllowedRoles, role];
    }

    // Always include admin
    if (!newRoles.includes("admin")) {
      newRoles.push("admin");
    }

    onGlobalRolesChange(newRoles);
  };

  /**
   * Toggles a role for a specific field
   * @param {string} id - ID of the field to update
   * @param {string} role - Role to toggle
   */
  const toggleRole = (id: string, role: string) => {
    if (globalAccessMode !== "restrict") return;

    onChange(
      fields.map((field) => {
        if (field.id !== id) return field;

        const currentRoles = field.allowedRoles || [...globalAllowedRoles];
        const hasRole = currentRoles.includes(role);

        let newRoles: string[];
        if (hasRole) {
          newRoles = currentRoles.filter(r => r !== role);
        } else {
          newRoles = [...currentRoles, role];
        }

        // Ensure admin is always included
        if (!newRoles.includes("admin")) {
          newRoles.push("admin");
        }

        return { ...field, allowedRoles: newRoles };
      })
    );
  };

  return (
    <div className="space-y-4">
      {/* ===== HEADER SECTION =====
          Shows section label and "Add Link" button */}
      <div className="flex items-center justify-between">
        {/* Section label */}
        <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-blue-600" />
          Project Links
          <span className="text-xs font-normal text-slate-500">(Optional)</span>
        </Label>
      </div>

      {/* ===== GLOBAL ROLE ACCESS CONTROL AND ADD LINK BUTTON - SIDE BY SIDE ===== */}
      {onGlobalRolesChange && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">
            Default Access for All Links
          </Label>
          <p className="text-xs text-slate-500">
            Control who can view project resources
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Default Access Dropdown - 50% */}
            <Select value={globalAccessMode} onValueChange={(val) => handleGlobalAccessModeChange(val as "all" | "restrict")}>
              <SelectTrigger className="w-full bg-white h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles (Everyone can view)</SelectItem>
                <SelectItem value="restrict">Restrict access</SelectItem>
              </SelectContent>
            </Select>

            {/* Add Link Button - 50% */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addField}
              className="h-9 w-full gap-1.5 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Link
            </Button>
          </div>
        </div>
      )}

      {/* ===== FIELDS LIST OR EMPTY STATE ===== */}
      {fields.length > 0 ? (
        /* Fields container with light background */
        <div className="space-y-3 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
          {/* Map through each field and render input row */}
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex gap-2 p-3 bg-white border border-slate-200 rounded-lg"
            >
              {/* ===== FIELD INPUTS (Label & Value) ===== */}
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {/* Label input */}
                  <div className="space-y-1">
                    <Label
                      htmlFor={`label-${field.id}`}
                      className="text-xs font-medium text-slate-600"
                    >
                      Label
                    </Label>
                    <Input
                      id={`label-${field.id}`}
                      placeholder="e.g., Live URL, Staging, Figma"
                      value={field.label}
                      onChange={(e) =>
                        updateField(field.id, "label", e.target.value)
                      }
                      className="h-9 text-sm bg-white border-slate-200"
                    />
                  </div>
                  {/* Value/URL input */}
                  <div className="space-y-1">
                    <Label
                      htmlFor={`value-${field.id}`}
                      className="text-xs font-medium text-slate-600"
                    >
                      URL / Value
                    </Label>
                    <Input
                      id={`value-${field.id}`}
                      placeholder="https://example.com"
                      value={field.value}
                      onChange={(e) =>
                        updateField(field.id, "value", e.target.value)
                      }
                      className="h-9 text-sm bg-white border-slate-200"
                    />
                  </div>
                </div>

                {/* Role Checkboxes - Only shown when restrict mode is active */}
                {onGlobalRolesChange && globalAccessMode === "restrict" && (
                  <div className="flex items-center gap-4 pt-2 border-t border-slate-200">
                    <Label className="text-xs text-slate-500">Who can view:</Label>

                    {/* Developer Checkbox */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id={`developer-${field.id}`}
                        checked={(field.allowedRoles || globalAllowedRoles).includes("developer")}
                        onChange={() => toggleRole(field.id, "developer")}
                        className="h-3.5 w-3.5 text-blue-600 rounded border-slate-300"
                      />
                      <Label htmlFor={`developer-${field.id}`} className="text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-1">
                        <Code2 className="h-3 w-3 text-blue-600" />
                        Dev
                      </Label>
                    </div>

                    {/* Tester Checkbox */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id={`tester-${field.id}`}
                        checked={(field.allowedRoles || globalAllowedRoles).includes("tester")}
                        onChange={() => toggleRole(field.id, "tester")}
                        className="h-3.5 w-3.5 text-green-600 rounded border-slate-300"
                      />
                      <Label htmlFor={`tester-${field.id}`} className="text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        Tester
                      </Label>
                    </div>
                  </div>
                )}
              </div>
              {/* ===== DELETE BUTTON ===== */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeField(field.id)}
                className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 self-end"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        /* ===== EMPTY STATE =====
            Shown when no fields have been added yet */
        <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center bg-slate-50/50">
          <Link2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 mb-2">No links added yet</p>
          <p className="text-xs text-slate-400">
            Add project links like Live URL, Staging, Figma designs, etc.
          </p>
        </div>
      )}
    </div>
  );
}
