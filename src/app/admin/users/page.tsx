
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminCreateUserForm } from "./create-user-form";
import { UserPlus, Shield, Users } from "lucide-react";

export default async function AdminUsersPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== "admin") {
        redirect("/user/dashboard");
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 shadow-md">
                        <Shield className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">User Management</h2>
                        <p className="text-muted-foreground mt-1">Create and manage system users with admin authority</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Users</p>
                                <p className="text-3xl font-bold text-blue-700 mt-2">—</p>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-green-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Users</p>
                                <p className="text-3xl font-bold text-emerald-700 mt-2">—</p>
                            </div>
                            <div className="p-3 rounded-full bg-emerald-100">
                                <UserPlus className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Admins</p>
                                <p className="text-3xl font-bold text-purple-700 mt-2">—</p>
                            </div>
                            <div className="p-3 rounded-full bg-purple-100">
                                <Shield className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Create User Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="border-none shadow-lg overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                    <UserPlus className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Create New User</CardTitle>
                                    <CardDescription className="mt-1">Register a new user directly into the system with assigned role</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <AdminCreateUserForm />
                        </CardContent>
                    </Card>
                </div>

                {/* Info Panel */}
                <div className="space-y-6">
                    {/* <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
                        <CardHeader>
                            <CardTitle className="text-lg text-amber-900">Quick Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                                <p className="text-sm text-amber-900">Users will receive their credentials via email</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                                <p className="text-sm text-amber-900">Assign appropriate roles based on responsibilities</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-2 w-2 rounded-full bg-amber-500 mt-2 shrink-0"></div>
                                <p className="text-sm text-amber-900">Users can update their profile after first login</p>
                            </div>
                        </CardContent>
                    </Card> */}

                    <Card className="border-none shadow-md bg-gradient-to-br from-slate-50 to-gray-50">
                        <CardHeader>
                            <CardTitle className="text-lg text-slate-900">Available Roles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-white">
                                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">A</div>
                                <div>
                                    <p className="font-semibold text-sm">Admin</p>
                                    <p className="text-xs text-muted-foreground">Full system access</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-white">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">D</div>
                                <div>
                                    <p className="font-semibold text-sm">Developer</p>
                                    <p className="text-xs text-muted-foreground">Code & development</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-white">
                                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">T</div>
                                <div>
                                    <p className="font-semibold text-sm">Tester</p>
                                    <p className="text-xs text-muted-foreground">QA & testing</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-white">
                                <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-700">D</div>
                                <div>
                                    <p className="font-semibold text-sm">Designer</p>
                                    <p className="text-xs text-muted-foreground">UI/UX design</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
