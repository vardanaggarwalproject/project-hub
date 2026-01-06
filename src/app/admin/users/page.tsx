
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminCreateUserForm } from "./create-user-form";

export default async function AdminUsersPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== "admin") {
        redirect("/user/dashboard");
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                <p className="text-muted-foreground">Admin authority: Create and manage users.</p>
            </div>

            <div className="max-w-xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Create New User</CardTitle>
                        <CardDescription>Register a new user directly into the system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AdminCreateUserForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
