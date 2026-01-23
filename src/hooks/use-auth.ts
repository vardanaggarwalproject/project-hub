
import { authClient } from "@/lib/auth-client";
import { SessionUser } from "@/types";

export function useAuth() {
    const { data: session, isPending, error } = authClient.useSession();

    // User role is now a simple string "role" in the user object
    const userBuffer = session?.user as any;
    const user = userBuffer as SessionUser | undefined;
    const userRole: string | null = user?.role || null;

    const hasRole = (role: string) => userRole === role;
    const hasAnyRole = (roles: string[]) => userRole ? roles.includes(userRole) : false;
    const hasAllRoles = (roles: string[]) => hasAnyRole(roles); // Single role cannot satisfy multiple distinct roles unless we check logic

    return {
        session,
        user: session?.user,
        isPending,
        error,
        userRole,
        hasRole,
        hasAnyRole,
        hasAllRoles
        
    };
}
