"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight, Edit3 } from "lucide-react";
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
    createdAt: string;
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
                setClients(resData.data);
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">Clients</h2>
                    <p className="text-muted-foreground">Manage and overview your client relationships</p>
                </div>
                {canManageClients && (
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                        <Link href="/admin/clients/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Client
                        </Link>
                    </Button>
                )}
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b py-4 px-6">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search clients..." 
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
                                    <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Client Name</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Email Address</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Added On</TableHead>
                                    <TableHead className="text-right font-bold text-muted-foreground uppercase text-[10px] tracking-wider pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.length > 0 ? (
                                    clients.map((client, index) => (
                                        <TableRow key={client.id} className="group transition-colors hover:bg-slate-50/50">
                                            <TableCell className="pl-6 font-medium text-slate-500">{(page - 1) * limit + index + 1}</TableCell>
                                            <TableCell>
                                                <span className="font-bold text-[#0f172a]">{client.name}</span>
                                            </TableCell>
                                            <TableCell className="text-slate-600">{client.email || "—"}</TableCell>
                                            <TableCell className="text-slate-500 text-xs text-nowrap">
                                                {new Date(client.createdAt).toLocaleDateString()}
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
                                                            <Link href={`/admin/clients/${client.id}`} className="cursor-pointer">
                                                                <Eye className="mr-2 h-4 w-4 text-blue-500" />
                                                                <span>View Details</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {canManageClients && (
                                                            <DropdownMenuItem className="text-slate-600 cursor-pointer">
                                                                <Edit3 className="mr-2 h-4 w-4" />
                                                                <span>Edit Client</span>
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
                        <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/50">
                            <p className="text-xs text-muted-foreground font-medium">
                                Showing <span className="text-[#0f172a] font-bold">{(page - 1) * limit + 1}</span> to <span className="text-[#0f172a] font-bold">{Math.min(page * limit, meta.total)}</span> of <span className="text-[#0f172a] font-bold">{meta.total}</span> clients
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
