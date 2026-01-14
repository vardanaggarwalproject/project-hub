
"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    FileCode2, 
    Search, 
    HardDrive,
    FolderKanban,
    Eye,
    Download,
    File as FileIcon,
    Plus
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Asset {
    id: string;
    name: string;
    fileUrl: string;
    fileType: string;
    fileSize: string;
    projectId: string;
    projectName?: string;
    createdAt: Date;
}

export default function UserAssetsPage() {
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
                    projectName: "Core Assets" 
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
        asset.fileType.toLowerCase().includes(searchQuery.toLowerCase())
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-[#0f172a] uppercase italic">
                        Assets
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-widest opacity-70">
                        Unified storage
                    </p>
                </div>
                <Button asChild className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 font-black uppercase text-[10px] tracking-[0.2em] px-8 py-6 h-auto rounded-2xl border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all">
                    <Link href="/user/projects">
                        <Plus className="mr-2 h-4 w-4 stroke-[3]" />
                        Upload New Asset
                    </Link>
                </Button>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl overflow-hidden rounded-[2rem]">
                <CardHeader className="border-b border-slate-100 bg-slate-50/30 px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <Input 
                                placeholder="SEARCH FILES..." 
                                className="pl-12 bg-white border-slate-200 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest focus-visible:ring-indigo-600 focus-visible:ring-offset-0 shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                             <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-indigo-600 shadow-sm transition-all">
                                <HardDrive className="mr-2 h-4 w-4" />
                                All Extensions
                            </Button>
                            <Badge className="bg-indigo-50 text-indigo-700 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em]">
                                {filteredAssets.length} OBJECTS
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 space-y-4">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                        </div>
                    ) : filteredAssets.length > 0 ? (
                        <div className="p-0">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Name</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Extension</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Volume</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredAssets.map((asset) => (
                                        <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-500 group-hover:scale-110 transition-transform duration-300">
                                                        <FileIcon className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{asset.name}</p>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <Badge className="bg-slate-50 text-slate-400 border-none p-0 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                                                <FolderKanban className="h-2.5 w-2.5" />
                                                                {asset.projectName}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge className="bg-slate-100 text-slate-600 border-none rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest">
                                                    {asset.fileType.toUpperCase() || "FILE"}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[11px] font-black text-slate-500 tracking-tighter">{formatSize(asset.fileSize)}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white hover:text-indigo-600 shadow-none hover:shadow-md transition-all">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white hover:text-indigo-600 shadow-none hover:shadow-md transition-all" asChild>
                                                        <a href={asset.fileUrl} download={asset.name}>
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-20 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                                <FileCode2 className="h-10 w-10 text-slate-200" />
                            </div>
                            <div className="max-w-xs space-y-2">
                                <h4 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">Vault Offline</h4>
                                <p className="text-sm text-slate-500 font-medium">No assets have been deposited.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
