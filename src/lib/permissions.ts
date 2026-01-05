
export type Role = "admin" | "developer" | "tester" | "designer";

export const PERMISSIONS = {
    CAN_MANAGE_CLIENTS: ["admin"],
    CAN_MANAGE_PROJECTS: ["admin"],
    CAN_MANAGE_USERS: ["admin"],
    CAN_VIEW_CLIENTS: ["admin"],
    CAN_VIEW_PROJECTS: ["admin", "developer", "tester", "designer"],
    CAN_VIEW_DEVELOPERS: ["admin", "developer", "tester", "designer"],
    CAN_MANAGE_EODS: ["developer", "tester", "designer"],
    CAN_MANAGE_MEMOS: ["developer", "tester", "designer"],
    CAN_MANAGE_ASSETS: ["admin", "designer"],
    CAN_MANAGE_LINKS: ["admin", "developer", "tester", "designer"],
    CAN_CHAT: ["admin", "developer", "tester", "designer"],
} as const;

export function hasPermission(role: string | null | undefined, permission: keyof typeof PERMISSIONS): boolean {
    if (!role) return false;
    const allowedRoles = PERMISSIONS[permission] as readonly string[];
    return allowedRoles.includes(role);
}

export function getAuthorizedItems<T extends { requiredPermission?: keyof typeof PERMISSIONS }>(
    items: T[],
    role: string | null | undefined
): T[] {
    return items.filter(item => {
        if (!item.requiredPermission) return true;
        return hasPermission(role, item.requiredPermission);
    });
}
