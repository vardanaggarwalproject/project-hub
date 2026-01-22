"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Link as LinkIcon, 
    Search, 
    ExternalLink, 
    Plus,
    Pencil,
    Trash2,
    Eye
} from "lucide-react";
import Link from "next/link";
import { AdminGroupedList, UploaderCell } from "@/components/admin-grouped-list";
import { ProjectDetailsModal } from "@/common/ProjectDetailsModal";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { toast } from "sonner";

interface SharedLink {
    id: string;
    title: string;
    url: string;
    category: string | null;
    projectId: string;
    projectName: string | null;
    uploader: {
        id: string;
        name: string;
        image: string | null;
    };
    createdAt: Date;
    updatedAt: Date;
}

export default function AdminLinksPage() {
    const { data: session } = authClient.useSession();
    const [links, setLinks] = useState<SharedLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Management State
    const [selectedProjectForLink, setSelectedProjectForLink] = useState<string | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    
    const [linkToDelete, setLinkToDelete] = useState<{ id: string; title: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchLinks = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/links");
            const data = await res.json();
            setLinks(data.map((l: any) => ({ 
                ...l, 
                createdAt: new Date(l.createdAt),
                updatedAt: new Date(l.updatedAt)
            })));
        } catch (error) {
            console.error("Failed to fetch links", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLinks = links.filter(link => 
        link.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (link.category?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (link.projectName?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    const columns = [
        {
            header: "Link Resource",
            cell: (link: SharedLink) => {
                let hostname = "Invalid URL";
                try {
                    hostname = new URL(link.url).hostname;
                } catch (e) {
                    console.warn(`Invalid URL: ${link.url}`);
                }

                return (
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                            <LinkIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-[#0f172a] uppercase tracking-tight line-clamp-1 italic">
                                {link.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate max-w-[200px]">
                                    {hostname}
                                </span>
                                <Badge className="bg-slate-100 text-slate-500 border-none rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest italic">
                                    {link.category || "General"}
                                </Badge>
                            </div>
                        </div>
                    </div>
                );
            }
        },
        {
            header: "Creator / Timestamp",
            cell: (link: SharedLink) => (
                <UploaderCell 
                    uploader={link.uploader} 
                    createdAt={link.createdAt} 
                    updatedAt={link.updatedAt} 
                />
            )
        },
        {
            header: "Actions",
            className: "text-right pr-8",
            cell: (link: SharedLink) => (
                <div className="flex justify-end gap-2">
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-2xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 shadow-none transition-all duration-300"
                        onClick={() => {
                            setSelectedProjectForLink(link.projectId);
                            setIsDetailsModalOpen(true);
                        }}
                    >
                        <Pencil className="h-5 w-5" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-2xl hover:bg-red-50 text-slate-400 hover:text-red-600 shadow-none transition-all duration-300"
                        onClick={() => setLinkToDelete(link)}
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
                    <div className="w-[1px] h-6 bg-slate-100 my-auto mx-1" />
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 shadow-none hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95" asChild>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-5 w-5" />
                        </a>
                    </Button>
                </div>
            )
        }
    ];

    useEffect(() => {
        if (session) fetchLinks();
    }, [session]);

    const handleDeleteLink = async () => {
        if (!linkToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/links/${linkToDelete.id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Link removed successfully");
                setLinkToDelete(null);
                fetchLinks();
            } else {
                toast.error("Failed to delete link");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-[#0f172a] uppercase italic">
                        Shared Links
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-widest opacity-70">
                        Central directory for external project resources
                    </p>
                </div>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/30 font-black uppercase text-[10px] tracking-[0.2em] px-8 py-6 h-auto rounded-2xl border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all">
                    <Link href="/admin/projects">
                        <Plus className="mr-2 h-4 w-4 stroke-[3]" />
                        Register New Link
                    </Link>
                </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input 
                        placeholder="SEARCH RESOURCES..." 
                        className="pl-12 bg-white border-slate-200 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest focus-visible:ring-blue-600 focus-visible:ring-offset-0 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-none rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] shadow-sm">
                    {filteredLinks.length} INDEXED RESOURCES
                </Badge>
            </div>

            {isLoading ? (
                <div className="space-y-12">
                    {[1, 2].map(i => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-8 w-48 rounded-lg" />
                            <Skeleton className="h-64 w-full rounded-[2rem]" />
                        </div>
                    ))}
                </div>
            ) : (
                <AdminGroupedList 
                    data={filteredLinks} 
                    groupBy="projectName" 
                    columns={columns} 
                    emptyMessage="No project links have been cataloged yet."
                />
            )}

            {/* Link Management via Project Details Modal */}
            <ProjectDetailsModal 
                open={isDetailsModalOpen}
                onOpenChange={setIsDetailsModalOpen}
                projectId={selectedProjectForLink}
                userRole="admin"
            />

            {/* Delete Confirmation */}
            <DeleteConfirmDialog 
                open={!!linkToDelete}
                onOpenChange={(open) => !open && setLinkToDelete(null)}
                onConfirm={handleDeleteLink}
                itemName={linkToDelete?.title}
                title="Delete shared link?"
                isDeleting={isDeleting}
            />
        </div>
    );
}
