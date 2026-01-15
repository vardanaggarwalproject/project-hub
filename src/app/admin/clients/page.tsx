"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Building2,
  Users,
  FolderKanban,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Eye } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { hasPermission } from "@/lib/permissions";
import { ClientFormSheet } from "@/components/clients/ClientFormSheet";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  description: string | null;
  createdAt: string;
  activeProjectCount: number;
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editMode, setEditMode] = useState<"add" | "edit">("add");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const limit = 10;

  const fetchClients = useCallback(() => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append("search", search);
    if (dateRange?.from) {
      params.append("fromDate", dateRange.from.toISOString());
    }
    if (dateRange?.to) {
      params.append("toDate", dateRange.to.toISOString());
    }

    fetch(`/api/clients?${params.toString()}`)
      .then((res) => res.json())
      .then((resData) => {
        const transformedData = resData.data.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        }));
        setClients(transformedData);
        setMeta(resData.meta);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [page, search, dateRange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  const handleAddClient = () => {
    setEditMode("add");
    setSelectedClient(null);
    setIsSheetOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditMode("edit");
    setSelectedClient(client);
    setIsSheetOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/clients/${clientToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete client");
      }

      toast.success("Client deleted successfully", {
        description: `${clientToDelete.name} has been permanently deleted.`,
      });

      // Refresh the client list
      fetchClients();
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setClientToDelete(null);
    }
  };

  const canManageClients = hasPermission(userRole, "CAN_MANAGE_CLIENTS");

  if (isLoading && clients.length === 0)
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );

  const totalActiveProjects =
    clients?.reduce(
      (sum, client) => sum + (client.activeProjectCount || 0),
      0
    ) || 0;

  return (
    <div className="space-y-6">
      {/* Page Header with Search and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">
            Clients
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage and overview your client relationships
          </p>
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
          <DateRangePicker
            value={dateRange}
            onChange={(range) => {
              setDateRange(range);
              setPage(1);
            }}
            placeholder="Filter by date"
            className="w-full sm:w-[280px]"
          />
          {canManageClients && (
            <Button
              onClick={handleAddClient}
              className="bg-blue-600 hover:bg-blue-700 shadow-md whitespace-nowrap"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Client
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {meta && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Total Clients */}
          <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-4xl font-bold text-blue-600">{meta.total}</p>
              </div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Total Clients
              </p>
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <FolderKanban className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-4xl font-bold text-emerald-600">
                  {totalActiveProjects}
                </p>
              </div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Active Projects
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table Card */}
      <Card className="border-none shadow-md overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50 hover:from-slate-50 hover:to-slate-100/50 border-b-2 border-slate-200">
                  <TableHead className="w-[80px] font-extrabold text-slate-900 uppercase text-[11px] tracking-wider pl-6">
                    S.No
                  </TableHead>
                  <TableHead className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider">
                    Client Name
                  </TableHead>
                  <TableHead className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider">
                    Email Address
                  </TableHead>
                  <TableHead className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider">
                    Projects
                  </TableHead>
                  <TableHead className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider">
                    Added On
                  </TableHead>
                  <TableHead className="text-right font-extrabold text-slate-900 uppercase text-[11px] tracking-wider pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length > 0 ? (
                  clients.map((client, index) => (
                    <TableRow
                      key={client.id}
                      className="group transition-all hover:bg-blue-50/30 border-b border-slate-100"
                    >
                      <TableCell className="pl-6 font-semibold text-slate-500">
                        {(page - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/clients/${client.id}`}>
                          <div className="flex items-center gap-3 cursor-pointer group">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-600 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <span className="font-semibold text-[15px] text-[#0f172a] group-hover:text-blue-600 transition-colors">
                              {client.name}
                            </span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-600 font-medium">
                        {client.email || "—"}
                      </TableCell>
                      <TableCell className="text-slate-600 font-semibold">
                        {client.activeProjectCount} Active Project
                        {client.activeProjectCount !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm font-medium text-nowrap">
                        {new Date(client.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/clients/${client.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                              <span className="font-semibold text-xs">
                                View
                              </span>
                            </Button>
                          </Link>
                          {canManageClients && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClient(client)}
                                className="h-8 px-3 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                              >
                                <Edit3 className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
                                <span className="font-semibold text-xs">
                                  Edit
                                </span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(client)}
                                className="h-8 px-3 hover:bg-red-50 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5 text-red-600" />
                                <span className="font-semibold text-xs">
                                  Delete
                                </span>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
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
                Showing{" "}
                <span className="text-[#0f172a] font-bold">
                  {(page - 1) * limit + 1}
                </span>{" "}
                to{" "}
                <span className="text-[#0f172a] font-bold">
                  {Math.min(page * limit, meta.total)}
                </span>{" "}
                of{" "}
                <span className="text-[#0f172a] font-bold">{meta.total}</span>{" "}
                clients
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                  onClick={() =>
                    setPage((p) => Math.min(meta.totalPages, p + 1))
                  }
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

      {/* Client Form Sheet */}
      <ClientFormSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        mode={editMode}
        clientId={selectedClient?.id}
        initialData={
          selectedClient
            ? {
                name: selectedClient.name,
                email: selectedClient.email || "",
                address: selectedClient.address || "",
                description: selectedClient.description || "",
              }
            : undefined
        }
        onSuccess={fetchClients}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        itemName={clientToDelete?.name}
        isDeleting={isDeleting}
        title="Delete Client"
        description={
          clientToDelete
            ? `This will permanently delete "${clientToDelete.name}" and all associated projects, tasks, and data. This action cannot be undone.`
            : undefined
        }
      />
    </div>
  );
}
