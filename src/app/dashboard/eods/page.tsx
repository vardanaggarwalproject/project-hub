"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Plus, ClipboardList, AlertCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { hasPermission } from "@/lib/permissions";

export default function EODPage() {
    const { data: session } = authClient.useSession();
    const userRole = (session?.user as any)?.role;
    
    // Admins should NOT be able to submit or edit EODs
    const isAdmin = userRole === "admin";

    return (
         <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">EOD Reports</h2>
                    <p className="text-muted-foreground">Monitor and submit daily work progress reports</p>
                </div>
                {!isAdmin && (
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                        <Link href="/dashboard/eods/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Submit EOD
                        </Link>
                    </Button>
                )}
            </div>
            
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-lg">Report History</CardTitle>
                    </div>
                    <CardDescription>View and manage previously submitted EOD reports</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[200px] flex items-center justify-center text-muted-foreground italic text-sm">
                    No EOD reports found in history.
                </CardContent>
            </Card>
         </div>
    )
}
