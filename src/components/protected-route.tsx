
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isPending, hasAnyRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isPending && !user) {
            router.push("/login");
        } else if (!isPending && user && allowedRoles && allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
            // Redirect to unauthorized or dashboard if no access
            router.push("/"); // Or /unauthorized
        }
    }, [user, isPending, allowedRoles, hasAnyRole, router]);

    if (isPending) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Skeleton className="h-12 w-12 rounded-full" />
            </div>
        );
    }

    if (!user) return null; // Will redirect

    if (allowedRoles && allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
        return null; // Will redirect
    }

    return <>{children}</>;
}
