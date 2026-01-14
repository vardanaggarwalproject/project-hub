"use client";

import { useEffect, useState, useCallback } from "react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Eye, MoreHorizontal, UserSquare2, ChevronLeft, ChevronRight, ShieldAlert, UserPlus } from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { hasPermission } from "@/lib/permissions";

interface Developer {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
}

interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function DevelopersPage() {
    const { data: session } = authClient.useSession();
    const userRole = (session?.user as any)?.role;
    const router = useRouter();

    const [developers, setDevelopers] = useState<Developer[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;

    const fetchDevelopers = useCallback(() => {
        setIsLoading(true);
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        if (search) params.append("search", search);

        fetch(`/api/users?${params.toString()}`)
            .then(res => res.json())
            .then(resData => {
                const transformedData = resData.data.map((dev: any) => ({
                    ...dev,
                    createdAt: new Date(dev.createdAt)
                }));
                setDevelopers(transformedData);
                setMeta(resData.meta);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, [page, search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDevelopers();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchDevelopers]);

    const canManageUsers = hasPermission(userRole, "CAN_MANAGE_USERS");

    if (isLoading && developers.length === 0) return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-[250px]" />
            <Skeleton className="h-[400px] w-full" />
        </div>
    );

    return (
         <div className="space-y-6">
            {/* Page Header with Search and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">Developers</h2>
                    <p className="text-muted-foreground mt-1">Manage your organization's talent and team members</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search developers..." 
                            className="pl-10 bg-white border-slate-200 focus-visible:ring-blue-500"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <Button 
                        onClick={() => router.push('/admin/users')}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md whitespace-nowrap"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Developer
                    </Button>
                </div>
            </div>

            {/* Table Card */}
            <Card className="border-none shadow-md overflow-hidden bg-white">
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50 hover:from-slate-50 hover:to-slate-100/50 border-b-2 border-slate-200">
                                    <TableHead className="w-[80px] font-bold text-slate-700 uppercase text-[10px] tracking-wider pl-6">S.No</TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Developer</TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Email Address</TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Role</TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider text-nowrap">Joined On</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {developers.length > 0 ? (
                                    developers.map((dev, index) => (
                                        <TableRow key={dev.id} className="group transition-all hover:bg-blue-50/30 border-b border-slate-100">
                                            <TableCell className="pl-6 font-semibold text-slate-500">{(page - 1) * limit + index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-bold text-sm uppercase shadow-sm">
                                                        {dev.name.substring(0, 2)}
                                                    </div>
                                                    <span className="font-bold text-[#0f172a] whitespace-nowrap">{dev.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600 font-medium">{dev.email}</TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "border-none px-3 py-1 font-bold text-[10px] uppercase shadow-sm",
                                                    dev.role === "admin" ? "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700" :
                                                    dev.role === "developer" ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700" :
                                                    dev.role === "tester" ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700" :
                                                    "bg-slate-100 text-slate-700"
                                                )}>
                                                    {dev.role || "member"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-sm font-medium text-nowrap">
                                                {new Date(dev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-blue-50 hover:text-blue-600">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52 shadow-xl border-slate-200 p-1">
                                                        <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1.5">Options</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/developers/${dev.id}`} className="cursor-pointer py-2 px-2.5 flex items-center gap-2">
                                                                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                </div>
                                                                <span className="font-semibold text-sm">View Profile</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {canManageUsers && (
                                                            <DropdownMenuItem className="cursor-pointer py-2 px-2.5 flex items-center gap-2">
                                                                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                                                                    <ShieldAlert className="h-3.5 w-3.5" />
                                                                </div>
                                                                <span className="font-semibold text-sm">Edit Permissions</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                            {isLoading ? "Loading developers..." : "No developers found."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {meta && meta.totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-gradient-to-r from-slate-50/50 to-slate-100/30">
                            <p className="text-xs text-muted-foreground font-medium">
                                Showing <span className="text-[#0f172a] font-bold">{(page - 1) * limit + 1}</span> to <span className="text-[#0f172a] font-bold">{Math.min(page * limit, meta.total)}</span> of <span className="text-[#0f172a] font-bold">{meta.total}</span> developers
                            </p>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-9 px-3 border-slate-200 hover:bg-white font-bold"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Prev
                                </Button>
                                <div className="text-sm font-bold text-[#0f172a] px-3">
                                    Page {page} of {meta.totalPages}
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                    disabled={page === meta.totalPages}
                                    className="h-9 px-3 border-slate-200 hover:bg-white font-bold"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
         </div>
    )
}
