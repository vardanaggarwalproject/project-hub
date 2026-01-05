
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, FolderOpen } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const user = session?.user;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}</h2>
                <p className="text-muted-foreground">Here's what's happening today.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button className="w-full justify-start" asChild>
                            <Link href="/dashboard/memos/new">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Today's Memo
                            </Link>
                        </Button>
                        <Button className="w-full justify-start" variant="outline" asChild>
                            <Link href="/dashboard/eods/new">
                                <FileText className="mr-2 h-4 w-4" />
                                Submit EOD Report
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Pending Items (Mockup) */}
                 <Card>
                    <CardHeader>
                        <CardTitle>Pending Items</CardTitle>
                        <CardDescription>Action required</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-green-600 flex items-center gap-2">
                             ✓ All caught up! No pending items.
                        </div>
                    </CardContent>
                </Card>

                {/* My Projects Summary (Mockup) */}
                <Card>
                    <CardHeader>
                        <CardTitle>My Projects</CardTitle>
                        <CardDescription>Active assignments</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="text-sm text-muted-foreground">
                            No active projects assigned.
                        </div>
                        <Button variant="link" className="px-0 mt-2" asChild>
                            <Link href="/dashboard/projects">View All Projects</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
