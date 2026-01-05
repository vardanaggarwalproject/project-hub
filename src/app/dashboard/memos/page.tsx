"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Plus, FileText, AlertCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function MemosPage() {
    const { data: session } = authClient.useSession();
    const userRole = (session?.user as any)?.role;
    
    const isAdmin = userRole === "admin";

    return (
         <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">Memos</h2>
                    <p className="text-muted-foreground">Internal project communications and notes</p>
                </div>
                {!isAdmin && (
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                        <Link href="/dashboard/memos/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Memo
                        </Link>
                    </Button>
                )}
            </div>
            
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-lg">Recent Memos</CardTitle>
                    </div>
                    <CardDescription>Stay updated with the latest project announcements</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[200px] flex items-center justify-center text-muted-foreground italic text-sm text-center px-8">
                    No memos found in the system. Project members will post important updates here.
                </CardContent>
            </Card>
         </div>
    )
}
