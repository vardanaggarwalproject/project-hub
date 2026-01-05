
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Plus } from "lucide-react";

interface Project {
    id: string;
    name: string;
    status: string;
    clientName: string | null;
    updatedAt: string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/projects")
            .then((res) => res.json())
            .then((data) => {
                setProjects(data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground">Manage your assigned projects</p>
                </div>
                <Button asChild>
                    <Link href="/projects/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Project
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <Card key={project.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{project.name}</CardTitle>
                                    <CardDescription>{project.clientName || "No Client"}</CardDescription>
                                </div>
                                <Badge variant={
                                    project.status === "active" ? "default" : 
                                    project.status === "completed" ? "secondary" : "outline"
                                }>
                                    {project.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                            </p>
                            <Button variant="ghost" size="sm" className="mt-4 w-full" asChild>
                                <Link href={`/projects/${project.id}`}>View Details</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {projects.length === 0 && (
                     <div className="col-span-full text-center py-12 text-muted-foreground">
                        No projects found. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
