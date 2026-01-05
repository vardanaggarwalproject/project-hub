"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileCode2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AssetsPage() {
    return (
         <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">Assets</h2>
                    <p className="text-muted-foreground">Centralized repository for project files and deliverables</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Asset
                </Button>
            </div>
            
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileCode2 className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-lg">Asset Explorer</CardTitle>
                    </div>
                    <CardDescription>Upload and manage project-related files securely</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[200px] flex items-center justify-center text-muted-foreground italic text-sm text-center px-8">
                    The asset library is empty. Upload design files, requirements docs, or code snippets to get started.
                </CardContent>
            </Card>
         </div>
    )
}
