"use client";

import { useEffect, useState } from "react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

interface ChatGroup {
    id: string;
    name: string;
    projectId: string;
    developerCount: number;
}

export default function UserChatListPage() {
    const [chats, setChats] = useState<ChatGroup[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/chat-groups")
            .then(res => res.json())
            .then(data => {
                setChats(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    const filteredChats = chats.filter(chat => 
        chat.name.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) return <Skeleton className="h-48 w-full" />;

    return (
         <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">My Team Chats</h2>
                    <p className="text-muted-foreground">Collaborate with your project teams</p>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b py-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search chats..." 
                            className="pl-10 bg-slate-50 border-none focus-visible:ring-1"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                    <TableHead className="w-[80px] font-bold text-muted-foreground uppercase text-[10px] tracking-wider pl-6">S.No</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Group Name</TableHead>
                                    <TableHead className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Dev Count</TableHead>
                                    <TableHead className="text-right font-bold text-muted-foreground uppercase text-[10px] tracking-wider pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredChats.length > 0 ? (
                                    filteredChats.map((chat, index) => (
                                        <TableRow key={chat.id} className="group transition-colors hover:bg-slate-50/50">
                                            <TableCell className="pl-6 font-medium text-slate-500">{index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                                        <MessageSquare className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-bold text-[#0f172a]">{chat.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-600">{chat.developerCount}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Developers</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:text-blue-700 hover:bg-blue-50" asChild>
                                                    <Link href={`/user/chat/${chat.projectId}`}>
                                                        Open Chat
                                                        <ArrowRight className="ml-2 h-3 w-3" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No chats found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
         </div>
    )
}
