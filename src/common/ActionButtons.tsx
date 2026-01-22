import { Button } from "@/components/ui/button";
import { Eye, Edit3, Trash2, LucideIcon } from "lucide-react";
import Link from "next/link";

interface ActionButton {
  type: "view" | "edit" | "delete" | "custom";
  label?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
  className?: string;
}

interface ActionButtonsProps {
  actions: ActionButton[];
  size?: "sm" | "md" | "lg";
}

const actionConfig = {
  view: {
    icon: Eye,
    label: "View",
    className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50",
  },
  edit: {
    icon: Edit3,
    label: "Edit",
    className: "text-amber-600 hover:text-amber-700 hover:bg-amber-50",
  },
  delete: {
    icon: Trash2,
    label: "Delete",
    className: "text-red-600 hover:text-red-700 hover:bg-red-50",
  },
};

export function ActionButtons({ actions, size = "sm" }: ActionButtonsProps) {
  const sizeClasses = {
    sm: "h-8 px-3 gap-1.5",
    md: "h-9 px-4 gap-2",
    lg: "h-10 px-5 gap-2.5",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-4.5 w-4.5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {actions.map((action, index) => {
        const config =
          action.type !== "custom" ? actionConfig[action.type] : null;
        const Icon = action.icon || (config?.icon as LucideIcon);
        const label = action.label || config?.label || "";
        const className = action.className || config?.className || "";

        if (action.href && !action.onClick) {
          return (
            <Link key={index} href={action.href}>
              <Button
                variant="ghost"
                size="sm"
                className={`${sizeClasses[size]} ${textSizes[size]} ${className} font-semibold transition-all`}
              >
                {Icon && <Icon className={iconSizes[size]} />}
                {label}
              </Button>
            </Link>
          );
        }

        return (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={action.onClick}
            className={`${sizeClasses[size]} ${textSizes[size]} ${className} font-semibold transition-all`}
          >
            {Icon && <Icon className={iconSizes[size]} />}
            {label}
          </Button>
        );
      })}
    </div>
  );
}
