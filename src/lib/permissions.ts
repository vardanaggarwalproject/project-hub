
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
    CAN_MANAGE_TASKS: ["admin", "developer"],
    CAN_MANAGE_BUGS: ["admin", "tester"],
    CAN_VIEW_ALL_PROJECTS: ["admin"],
    CAN_ASSIGN_TASKS: ["admin"],
    CAN_DELETE_PROJECTS: ["admin"],
    CAN_UPLOAD_DESIGNS: ["admin", "designer"],
    CAN_VIEW_DESIGN_TASKS: ["admin", "designer"],
    CAN_VIEW_TEST_QUEUE: ["admin", "tester"],
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

// Role-specific helper functions
export function getRoleFocus(role: Role): string {
    const focuses = {
        admin: "Full system management and oversight",
        developer: "Execution and task completion",
        tester: "Quality verification and testing",
        designer: "UI/UX design and visual assets"
    };
    return focuses[role];
}

export function getRoleCapabilities(role: Role): string[] {
    const capabilities = {
        admin: [
            "Manage all projects and users",
            "Assign tasks to team members",
            "View all data and reports",
            "Configure system settings"
        ],
        developer: [
            "Update task status",
            "Submit EOD reports",
            "Upload code links/files",
            "Participate in project chat"
        ],
        tester: [
            "Create and manage bugs",
            "Mark tasks as verified",
            "Access test queue",
            "Generate test reports"
        ],
        designer: [
            "Upload design assets",
            "Update design task status",
            "Respond to feedback",
            "Manage asset library"
        ]
    };
    return capabilities[role];
}

export function canViewAllProjects(role: Role): boolean {
    return role === "admin";
}

export function canManageTasks(role: Role): boolean {
    return role === "admin" || role === "developer";
}

export function canManageBugs(role: Role): boolean {
    return role === "admin" || role === "tester";
}

export function canUploadDesigns(role: Role): boolean {
    return role === "admin" || role === "designer";
}
