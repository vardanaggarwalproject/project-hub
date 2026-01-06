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
    Filter, 
    Calendar,
    FolderKanban,
    ChevronRight,
    Plus
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Memo {
    id: string;
    memoContent: string;
    reportDate: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        image: string | null;
    };
    projectId: string;
    projectName?: string;
}

export default function UserMemosPage() {
    const { data: session } = authClient.useSession();
    const [memos, setMemos] = useState<Memo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchMemos = async () => {
            setIsLoading(true);
            try {
                const res = await fetch("/api/memos");
                const data = await res.json();
                
                setMemos(data.map((m: any) => ({
                    ...m,
                    projectName: "Sample Project" 
                })));
            } catch (error) {
                console.error("Failed to fetch memos", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (session) {
            fetchMemos();
        }
    }, [session]);

    const filteredMemos = memos.filter(memo => 
        memo.memoContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memo.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-[#0f172a] uppercase italic">
                        Memos
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-widest opacity-70">
                        Updates and checkpoints
                    </p>
                </div>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/30 font-black uppercase text-[10px] tracking-[0.2em] px-8 py-6 h-auto rounded-2xl border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all">
                    <Link href="/user/projects">
                        <Plus className="mr-2 h-4 w-4 stroke-[3]" />
                        Post New Memo
                    </Link>
                </Button>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl overflow-hidden rounded-[2rem]">
                <CardHeader className="border-b border-slate-100 bg-slate-50/30 px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <Input 
                                placeholder="SEARCH MEMOS..." 
                                className="pl-12 bg-white border-slate-200 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest focus-visible:ring-blue-600 focus-visible:ring-offset-0 shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 space-y-6">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
                        </div>
                    ) : filteredMemos.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {filteredMemos.map((memo) => (
                                <div key={memo.id} className="p-8 flex flex-col md:flex-row gap-8 hover:bg-slate-50/50 transition-all duration-300 group">
                                    <div className="flex items-start gap-4 md:w-64 shrink-0">
                                        <Avatar className="h-12 w-12 border-2 border-white shadow-md ring-2 ring-slate-100">
                                            <AvatarImage src={memo.user.image || ""} />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black">
                                                {memo.user.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-[#0f172a] uppercase tracking-tight truncate">{memo.user.name}</p>
                                            <div className="flex items-center gap-1.5 mt-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(memo.reportDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div className="relative">
                                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-100 rounded-full group-hover:bg-blue-500 transition-colors" />
                                            <p className="text-sm font-medium text-slate-700 leading-relaxed pl-2">
                                                {memo.memoContent}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 pt-2">
                                            <Badge className="bg-slate-100 hover:bg-slate-200 text-slate-600 border-none rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <FolderKanban className="h-3 w-3" />
                                                {memo.projectName}
                                            </Badge>
                                            <Link href={`/user/projects/${memo.projectId}`} className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                                                View Project <ChevronRight className="h-3 w-3" />
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="md:w-32 flex md:justify-end items-center">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                            {new Date(memo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-20 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20" />
                                <div className="relative h-20 w-20 rounded-full bg-white shadow-xl flex items-center justify-center">
                                    <FileText className="h-10 w-10 text-slate-200" />
                                </div>
                            </div>
                            <div className="max-w-xs space-y-2">
                                <h4 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">Silent Channels</h4>
                                <p className="text-sm text-slate-500 font-medium">No memos found matching your criteria. Start a thread in a project to see it here.</p>
                            </div>
                            <Button variant="outline" className="rounded-full px-8 h-12 border-slate-200 font-black uppercase text-[10px] tracking-widest" onClick={() => setSearchQuery("")}>
                                Clear Search
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
