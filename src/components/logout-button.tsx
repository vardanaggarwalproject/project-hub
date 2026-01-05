
"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LogoutButtonProps extends React.ComponentProps<typeof Button> {
    showText?: boolean;
}

export function LogoutButton({ className, showText = false, ...props }: LogoutButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/login");
                },
            },
        });
        setIsLoading(false);
    };

    return (
        <Button 
            variant="ghost" 
            size={showText ? "default" : "icon"}
            className={cn(
                showText ? "" : "h-8 w-8",
                "text-muted-foreground hover:text-red-600 hover:bg-red-50",
                className
            )}
            onClick={handleLogout}
            disabled={isLoading}
            title="Logout"
            {...props}
        >
            <LogOut className={cn(showText ? "mr-2" : "", "h-4 w-4")} />
            {showText && "Logout"}
        </Button>
    );
}
