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
    FolderKanban,
    Plus,
    Globe
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SharedLink {
    id: string;
    name: string;
    url: string;
    description: string | null;
    projectId: string;
    projectName?: string;
    createdAt: Date;
}

export default function AdminLinksPage() {
    const { data: session } = authClient.useSession();
    const [links, setLinks] = useState<SharedLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchLinks = async () => {
            setIsLoading(true);
            try {
                const res = await fetch("/api/links");
                const data = await res.json();
                setLinks(data.map((l: any) => ({ 
                    ...l, 
                    createdAt: new Date(l.createdAt),
                    projectName: "Direct Base" 
                })));
            } catch (error) {
                console.error("Failed to fetch links", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session) fetchLinks();
    }, [session]);

    const filteredLinks = links.filter(link => 
        link.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (link.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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

            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl overflow-hidden rounded-[2rem]">
                <CardHeader className="border-b border-slate-100 bg-slate-50/30 px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <Input 
                                placeholder="SEARCH RESOURCES..." 
                                className="pl-12 bg-white border-slate-200 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest focus-visible:ring-blue-600 focus-visible:ring-offset-0 shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                             <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-blue-600 shadow-sm transition-all">
                                <Globe className="mr-2 h-4 w-4" />
                                All Domains
                            </Button>
                            <Badge className="bg-blue-50 text-blue-700 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em]">
                                {filteredLinks.length} INDEXED
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 space-y-4">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
                        </div>
                    ) : filteredLinks.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 p-8 gap-6">
                            {filteredLinks.map((link) => (
                                <Card key={link.id} className="group border-none shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden bg-white ring-1 ring-slate-100 hover:ring-blue-100">
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                                <LinkIcon className="h-5 w-5" />
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-50 text-slate-400 hover:text-blue-600" asChild>
                                                <a href={link.url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-[#0f172a] uppercase tracking-tight line-clamp-1">{link.name}</h4>
                                            <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest line-clamp-1">{new URL(link.url).hostname}</p>
                                        </div>
                                        <div className="pt-2 min-h-[40px]">
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {link.description || "No description provided for this resource."}
                                            </p>
                                        </div>
                                        <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                                            <Badge className="bg-slate-50 text-slate-500 border-none rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <FolderKanban className="h-3 w-3" />
                                                {link.projectName}
                                            </Badge>
                                            <Link href={`/admin/projects/${link.projectId}`} className="text-[8px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                                                Go to Source
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="p-20 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                                <LinkIcon className="h-10 w-10 text-slate-200" />
                            </div>
                            <div className="max-w-xs space-y-2">
                                <h4 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">Empty Registry</h4>
                                <p className="text-sm text-slate-500 font-medium">No links have been cataloged yet.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
