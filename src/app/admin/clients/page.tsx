"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight, Edit3, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Eye, MoreHorizontal } from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { hasPermission } from "@/lib/permissions";

interface Client {
    id: string;
    name: string;
    email: string | null;
    createdAt: Date;
}

interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function ClientsPage() {
    const { data: session } = authClient.useSession();
    const userRole = (session?.user as any)?.role;

    const [clients, setClients] = useState<Client[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;

    const fetchClients = useCallback(() => {
        setIsLoading(true);
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });
        if (search) params.append("search", search);

        fetch(`/api/clients?${params.toString()}`)
            .then(res => res.json())
            .then(resData => {
                const transformedData = resData.data.map((c: any) => ({
                    ...c,
                    createdAt: new Date(c.createdAt)
                }));
                setClients(transformedData);
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
            fetchClients();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchClients]);

    const canManageClients = hasPermission(userRole, "CAN_MANAGE_CLIENTS");

    if (isLoading && clients.length === 0) return (
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
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">Clients</h2>
                    <p className="text-muted-foreground mt-1">Manage and overview your client relationships</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search clients..." 
                            className="pl-10 bg-white border-slate-200 focus-visible:ring-blue-500"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    {canManageClients && (
                        <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-md whitespace-nowrap">
                            <Link href="/admin/clients/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Add New Client
                            </Link>
                        </Button>
                    )}
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
                                    <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Client Name</TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Email Address</TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Added On</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.length > 0 ? (
                                    clients.map((client, index) => (
                                        <TableRow key={client.id} className="group transition-all hover:bg-blue-50/30 border-b border-slate-100">
                                            <TableCell className="pl-6 font-semibold text-slate-500">{(page - 1) * limit + index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-600 shadow-sm">
                                                        <Building2 className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-bold text-[#0f172a]">{client.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600 font-medium">{client.email || "—"}</TableCell>
                                            <TableCell className="text-slate-500 text-sm font-medium text-nowrap">
                                                {new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                                                            <Link href={`/admin/clients/${client.id}`} className="cursor-pointer py-2 px-2.5 flex items-center gap-2">
                                                                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                </div>
                                                                <span className="font-semibold text-sm">View Details</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {canManageClients && (
                                                            <DropdownMenuItem className="cursor-pointer py-2 px-2.5 flex items-center gap-2">
                                                                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                                                                    <Edit3 className="h-3.5 w-3.5" />
                                                                </div>
                                                                <span className="font-semibold text-sm">Edit Client</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            {isLoading ? "Loading clients..." : "No clients found."}
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
                                Showing <span className="text-[#0f172a] font-bold">{(page - 1) * limit + 1}</span> to <span className="text-[#0f172a] font-bold">{Math.min(page * limit, meta.total)}</span> of <span className="text-[#0f172a] font-bold">{meta.total}</span> clients
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
