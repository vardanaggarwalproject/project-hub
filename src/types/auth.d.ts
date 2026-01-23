
declare module "better-auth" {
    interface User {
        role: string | null;
    }
    interface Session {
        user: User;
    }
}
