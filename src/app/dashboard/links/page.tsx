"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LinkIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LinksPage() {
    return (
         <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">Links</h2>
                    <p className="text-muted-foreground">Quick access to important project URLs and resources</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Link
                </Button>
            </div>
            
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-lg">Resource Library</CardTitle>
                    </div>
                    <CardDescription>Managed external links for all project teams</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[200px] flex items-center justify-center text-muted-foreground italic text-sm text-center px-8">
                    No links shared yet. Use this space for documentation, staging sites, and design handoffs.
                </CardContent>
            </Card>
         </div>
    )
}
