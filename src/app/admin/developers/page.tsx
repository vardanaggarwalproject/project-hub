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
import { Search, Eye, MoreHorizontal, UserSquare2, ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { hasPermission } from "@/lib/permissions";

interface Developer {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
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
                setDevelopers(resData.data);
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">Developers</h2>
                    <p className="text-muted-foreground">Manage your organization's talent and team members</p>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b py-4 px-6">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search developers..." 
                            className="pl-10 bg-slate-50 border-none focus-visible:ring-1"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                    <TableHead className="w-[80px] font-bold text-muted-foreground uppercase text-[10px] tracking-wider pl-6">S.No</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Developer</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Email Address</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Role</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider text-nowrap">Joined On</TableHead>
                                    <TableHead className="text-right font-bold text-muted-foreground uppercase text-[10px] tracking-wider pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {developers.length > 0 ? (
                                    developers.map((dev, index) => (
                                        <TableRow key={dev.id} className="group transition-colors hover:bg-slate-50/50">
                                            <TableCell className="pl-6 font-medium text-slate-500">{(page - 1) * limit + index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[#0f172a] font-bold text-[10px] uppercase">
                                                        {dev.name.substring(0, 2)}
                                                    </div>
                                                    <span className="font-bold text-[#0f172a] whitespace-nowrap">{dev.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600">{dev.email}</TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "border-none px-2.5 py-0.5 font-bold text-[10px] uppercase shadow-none",
                                                    dev.role === "admin" ? "bg-amber-100 text-amber-700" :
                                                    dev.role === "developer" ? "bg-blue-100 text-blue-700" :
                                                    dev.role === "tester" ? "bg-purple-100 text-purple-700" :
                                                    "bg-slate-100 text-slate-700"
                                                )}>
                                                    {dev.role || "member"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-xs text-nowrap">
                                                {new Date(dev.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 shadow-lg border-slate-100">
                                                        <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Options</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/developers/${dev.id}`} className="cursor-pointer">
                                                                <Eye className="mr-2 h-4 w-4 text-blue-500" />
                                                                <span>View Profile</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {canManageUsers && (
                                                            <DropdownMenuItem className="text-slate-600 cursor-pointer">
                                                                <ShieldAlert className="mr-2 h-4 w-4" />
                                                                <span>Edit Permissions</span>
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
                        <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/50">
                            <p className="text-xs text-muted-foreground font-medium">
                                Showing <span className="text-[#0f172a] font-bold">{(page - 1) * limit + 1}</span> to <span className="text-[#0f172a] font-bold">{Math.min(page * limit, meta.total)}</span> of <span className="text-[#0f172a] font-bold">{meta.total}</span> developers
                            </p>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-xs font-bold text-[#0f172a] px-2">
                                    Page {page} of {meta.totalPages}
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                    disabled={page === meta.totalPages}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
         </div>
    )
}
