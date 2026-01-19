"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    FileText, 
    Search, 
    Eye,
    Download,
    File as FileIcon,
    Plus,
} from "lucide-react";
import Link from "next/link";
import { AdminGroupedList, UploaderCell } from "@/components/admin-grouped-list";

interface Asset {
    id: string;
    name: string;
    url: string;
    fileType: string;
    size: string;
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

export default function AdminAssetsPage() {
    const { data: session } = authClient.useSession();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchAssets = async () => {
            setIsLoading(true);
            try {
                const res = await fetch("/api/assets");
                const data = await res.json();
                setAssets(data.map((a: any) => ({ 
                    ...a, 
                    createdAt: new Date(a.createdAt),
                    updatedAt: new Date(a.updatedAt)
                })));
            } catch (error) {
                console.error("Failed to fetch assets", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session) fetchAssets();
    }, [session]);

    const filteredAssets = assets.filter(asset => 
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        asset.fileType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.projectName?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    const formatSize = (bytes: string) => {
        const b = parseInt(bytes);
        if (isNaN(b)) return "0 B";
        const units = ["B", "KB", "MB", "GB"];
        let size = b;
        let unitIndex = 0;
        while (size > 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    const columns = [
        {
            header: "Asset Resource",
            cell: (asset: Asset) => (
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                        <FileIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-[#0f172a] uppercase tracking-tight italic">
                            {asset.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-slate-100 text-slate-500 border-none rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest italic">
                                {asset.fileType.toUpperCase() || "FILE"}
                            </Badge>
                            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                                {formatSize(asset.size)}
                            </span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: "Uploader / Timestamp",
            cell: (asset: Asset) => (
                <UploaderCell 
                    uploader={asset.uploader} 
                    createdAt={asset.createdAt} 
                    updatedAt={asset.updatedAt} 
                />
            )
        },
        {
            header: "Actions",
            className: "text-right pr-8",
            cell: (asset: Asset) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-indigo-600 shadow-none hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95" asChild>
                        <a href={asset.url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-5 w-5" />
                        </a>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-indigo-600 shadow-none hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95" asChild>
                        <a href={asset.url} download={asset.name}>
                            <Download className="h-5 w-5" />
                        </a>
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-[#0f172a] uppercase italic">
                        Assets Vault
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-widest opacity-70">
                        Unified project object storage
                    </p>
                </div>
                <Button asChild className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 font-black uppercase text-[10px] tracking-[0.2em] px-8 py-6 h-auto rounded-2xl border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all">
                    <Link href="/admin/projects">
                        <Plus className="mr-2 h-4 w-4 stroke-[3]" />
                        Upload New Asset
                    </Link>
                </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <Input 
                        placeholder="SEARCH FILES..." 
                        className="pl-12 bg-white border-slate-200 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest focus-visible:ring-indigo-600 focus-visible:ring-offset-0 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Badge className="bg-indigo-50 text-indigo-700 border-none rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] shadow-sm">
                    {filteredAssets.length} OBJECTS IN VAULT
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
                    data={filteredAssets} 
                    groupBy="projectName" 
                    columns={columns} 
                    emptyMessage="No project assets have been deposited yet."
                    accentColor="indigo"
                />
            )}
        </div>
    );
}
