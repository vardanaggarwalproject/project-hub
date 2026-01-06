
"use client";

import { useEffect, useState, useRef, use } from "react";
import { io, Socket } from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, Loader2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    senderImage?: string | null;
    createdAt: string;
}

export default function ProjectChatPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [hasAccess, setHasAccess] = useState(true);
    const [isLoadingAccess, setIsLoadingAccess] = useState(true);
    const socketRef = useRef<Socket | null>(null);
    const scrollEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { data: session } = authClient.useSession();

    useEffect(() => {
        // Initialize socket connection
        // Note: You'll need to ensure the server handles Socket.io at /api/socket
        const socket = io({
            path: "/api/socket",
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setIsConnected(true);
            socket.emit("join-room", projectId);
        });

        socket.on("message", (message: Message) => {
            setMessages(prev => [...prev, message]);
        });

        // Listen for assignment changes
        socket.on("user-removed-from-project", (data: { projectId: string; userId: string; action: string }) => {
            if (data.projectId === projectId && session?.user.id === data.userId) {
                setHasAccess(false);
                alert("You have been removed from this project. You can no longer send messages.");
            }
        });

        socket.on("user-assigned-to-project", (data: { projectId: string; userId: string; action: string }) => {
            if (data.projectId === projectId && session?.user.id === data.userId) {
                setHasAccess(true);
            }
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
        });

        // Fetch initial messages and verify access
        fetch(`/api/chat-groups/${projectId}/messages`)
            .then(res => {
                if (res.status === 403) {
                    setHasAccess(false);
                    setIsLoadingAccess(false);
                    throw new Error("Access denied");
                }
                if (!res.ok) {
                    throw new Error("Failed to load messages");
                }
                return res.json();
            })
            .then(data => {
                setMessages(data);
                setHasAccess(true);
                setIsLoadingAccess(false);
            })
            .catch(err => {
                console.error("Failed to load messages", err);
                setIsLoadingAccess(false);
            });

        return () => {
            socket.disconnect();
        };
    }, [projectId, session]);

    useEffect(() => {
        scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !session?.user || !hasAccess) return;

        const messageData = {
            content: input,
            projectId,
            senderId: session.user.id,
            senderName: session.user.name,
        };

        // Emit via socket for real-time
        socketRef.current?.emit("send-message", { ...messageData, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
        
        // Save to database
        try {
            await fetch(`/api/chat-groups/${projectId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(messageData),
            });
        } catch (error) {
            console.error("Failed to save message", error);
        }

        setInput("");
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#0f172a]">Project Group Chat</h2>
                    <p className="text-muted-foreground text-xs flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", isConnected ? "bg-emerald-500" : "bg-slate-300")} />
                        {isConnected ? "Connected" : "Reconnecting..."}
                    </p>
                </div>
            </div>

            <Card className="flex-1 flex flex-col border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b py-3 px-6">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        Live Discussion
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 py-6 px-6">
                        <div className="space-y-4">
                            {messages.map((msg) => {
                                const isMe = msg.senderId === session?.user?.id;
                                return (
                                    <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                        <div className={cn(
                                            "max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm",
                                            isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-900 rounded-tl-none"
                                        )}>
                                            {!isMe && <p className="text-[10px] font-bold uppercase mb-1 text-slate-500">{msg.senderName}</p>}
                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                );
                            })}
                            <div ref={scrollEndRef} />
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="p-4 bg-white border-t">
                    {!hasAccess ? (
                        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                            <p className="text-sm font-bold text-red-700">You don't have access to this project chat.</p>
                            <p className="text-xs text-red-600 mt-1">Contact an admin if you believe this is an error.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSend} className="flex w-full items-center gap-2">
                            <Input 
                                placeholder="Type your message..." 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="bg-slate-50 border-none focus-visible:ring-1"
                                disabled={!isConnected || !hasAccess}
                            />
                            <Button type="submit" size="icon" disabled={!input.trim() || !isConnected || !hasAccess} className="bg-blue-600 hover:bg-blue-700 shrink-0">
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

function MessageSquare(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}
