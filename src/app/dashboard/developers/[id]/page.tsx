
"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Mail, 
    Calendar, 
    ArrowLeft, 
    Shield,
    User,
    CheckCircle2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface DeveloperDetails {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

export default function DeveloperDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [developer, setDeveloper] = useState<DeveloperDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch(`/api/users/${id}`)
            .then(res => res.json())
            .then(data => {
                setDeveloper(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, [id]);

    if (isLoading) return <div className="p-8"><Skeleton className="h-[300px] w-full" /></div>;
    if (!developer) return <div className="p-8 text-center text-muted-foreground">Team member not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">{developer.name}</h2>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-none font-bold uppercase text-[10px]">
                            {developer.role}
                        </Badge>
                        <span>•</span>
                        <span>Member since {new Date(developer.createdAt).toLocaleDateString()}</span>
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" size="sm">Edit Permissions</Button>
                    <Button size="sm" className="bg-[#0f172a] text-white hover:bg-slate-800">View Activity</Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="col-span-2 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Profile Details</CardTitle>
                        <CardDescription>Personal information and role settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="p-4 rounded-xl bg-slate-50 flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-white shadow-sm border border-slate-100">
                                    <Mail className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</p>
                                    <p className="font-bold text-[#0f172a]">{developer.email}</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-white shadow-sm border border-slate-100">
                                    <Shield className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Account Level</p>
                                    <p className="font-bold text-[#0f172a] uppercase">{developer.role}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                             <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
                                <User className="h-6 w-6 text-slate-400" />
                             </div>
                             <div>
                                <h4 className="font-bold text-[#0f172a]">Biography</h4>
                                <p className="text-sm text-slate-500 max-w-sm">No biography has been added yet for this team member.</p>
                             </div>
                             <Button variant="link" className="text-blue-600 font-bold">Add Bio</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Project History</CardTitle>
                        <CardDescription>Recently involved in</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                             {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="mt-1">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#0f172a]">Completed E-Commerce Flow</p>
                                        <p className="text-[10px] text-muted-foreground">Assigned as Lead Developer</p>
                                        <p className="text-[9px] text-slate-400 mt-0.5">Oct 24, 2025</p>
                                    </div>
                                </div>
                             ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
