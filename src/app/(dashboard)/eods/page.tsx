
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function EODPage() {
    // Placeholder for EOD list
    return (
         <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">EOD Reports</h2>
                    <p className="text-muted-foreground">Daily End of Day reports</p>
                </div>
                <Button asChild>
                    <Link href="/eods/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Submit EOD
                    </Link>
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>History</CardTitle>
                    <CardDescription>Your recent EOD submissions</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No reports submitted yet.</p>
                </CardContent>
            </Card>
         </div>
    )
}
