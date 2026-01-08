
"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MoreVertical, Phone, Video, MessageSquare } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getSocket } from "@/lib/socket";
import { Skeleton } from "@/components/ui/skeleton";

interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string | Date;
}

interface ChatWindowProps {
  groupId: string;
  groupName: string;
  projectId: string;
}

function ChatSkeleton() {
    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex gap-3 justify-start">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-2 max-w-[60%]">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-[280px] rounded-2xl" />
                </div>
            </div>
            <div className="flex gap-3 justify-end">
                <div className="space-y-2 max-w-[60%] flex flex-col items-end">
                    <Skeleton className="h-10 w-[200px] rounded-2xl" />
                </div>
            </div>
        </div>
    );
}

export function ChatWindow({ groupId, groupName, projectId }: ChatWindowProps) {
  const { data: session } = authClient.useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const processedIds = useRef<Set<string>>(new Set());
  const lastReadCallRef = useRef<number>(0);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleMarkRead = () => {
    if (!session?.user) return;
    const now = Date.now();
    if (now - lastReadCallRef.current < 3000) return; // Debounce 3s
    lastReadCallRef.current = now;
    
    fetch(`/api/chat/${projectId}/read`, { method: "POST" })
        .then(res => {
            if (res.ok) {
                getSocket()?.emit("mark-read", { projectId, userId: session.user.id });
            }
        })
        .catch(() => {});
  };

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
        scrollToBottom("auto");
    }
  }, [isLoading]);

  // Fetch initial messages
  useEffect(() => {
    let isMounted = true;
    async function fetchMessages() {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/chat/${projectId}`);
            if (res.ok && isMounted) {
                const data = await res.json();
                if(Array.isArray(data)) {
                    setMessages(data);
                    processedIds.current = new Set(data.map(m => m.id));
                }
            }
        } catch (err) {
            console.error(`❌ Network error fetching messages:`, err);
        } finally {
            if (isMounted) setIsLoading(false);
        }
    }
    fetchMessages();
    return () => { isMounted = false; };
  }, [projectId]);

  // Socket connection
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onMessage = (data: any) => {
        if (data.projectId !== projectId) return;
        
        if (processedIds.current.has(data.id)) return;
        processedIds.current.add(data.id);

        setMessages(prev => {
            if (data.senderId === session?.user.id) {
                const tempIndex = prev.findIndex(m => 
                    m.id.startsWith("temp-") && m.content === data.content
                );
                if (tempIndex !== -1) {
                    const nextMsgs = [...prev];
                    nextMsgs[tempIndex] = { ...data, senderName: session?.user.name || "Me" };
                    return nextMsgs;
                }
            }
            return [...prev, { ...data, senderName: data.senderName || "User" }];
        });
        
        // Only mark as read if it's from someone else
        if (data.senderId !== session?.user.id) {
            handleMarkRead();
        }
    };

    socket.emit("join-room", projectId);
    socket.on("message", onMessage);

    return () => {
        // We stay in the room to receive background updates (unread counts)
        // socket.emit("leave-room", projectId); // REMOVED
        socket.off("message", onMessage);
    };
}, [projectId, session?.user, session?.user.name]);

  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
        scrollToBottom("smooth");
    }
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user) return;

    const content = newMessage;
    const tempId = `temp-${crypto.randomUUID()}`;
    setNewMessage(""); 

    const optimisticMsg: Message = {
        id: tempId,
        projectId: projectId,
        senderId: session.user.id,
        senderName: session.user.name || "Me",
        content: content,
        createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
       const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, content }),
      });

      if (!res.ok) throw new Error("Failed to send");
      const realMessage = await res.json();
      
      processedIds.current.add(realMessage.id);

      setMessages(prev => {
        const index = prev.findIndex(m => m.id === tempId);
        if (index === -1) {
            if (prev.some(m => m.id === realMessage.id)) return prev;
            return [...prev, { ...realMessage, senderName: session?.user.name || "Me" }];
        }
        const nextMsgs = [...prev];
        nextMsgs[index] = { ...realMessage, senderName: session?.user.name || "Me" };
        return nextMsgs;
      });

      const socketMsg = { ...realMessage, senderName: session.user.name || "Me", projectId };
      getSocket().emit("send-message", socketMsg);

    } catch (error) {
      console.error("Failed to send message", error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(content); 
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/30">
        <div className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-4">
                <Avatar className="h-9 w-9 border border-slate-200">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                        {groupName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{groupName}</h3>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-xs text-slate-500 font-medium">Active now</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
                 <Button variant="ghost" size="icon" className="hover:text-blue-600">
                    <Phone className="h-4 w-4" />
                 </Button>
                 <Button variant="ghost" size="icon" className="hover:text-blue-600">
                    <Video className="h-4 w-4" />
                 </Button>
                 <Separator orientation="vertical" className="h-6 mx-2" />
                 <Button variant="ghost" size="icon" className="hover:text-slate-700">
                    <MoreVertical className="h-4 w-4" />
                 </Button>
            </div>
        </div>

        {isLoading ? (
            <ChatSkeleton />
        ) : (
            <div className="flex-1 overflow-hidden relative" ref={scrollContainerRef}>
                <div className="absolute inset-0 overflow-y-auto p-6 space-y-6">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 opacity-50">
                            <MessageSquare className="h-12 w-12" />
                            <p className="font-medium text-sm">No messages yet.</p>
                        </div>
                    )}
                    
                    {messages.map((msg, idx) => {
                        const isMe = msg.senderId === session?.user.id;
                        const showAvatar = idx === 0 || messages[idx - 1].senderId !== msg.senderId;
                        
                        return (
                            <div key={msg.id} className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}>
                                 {!isMe && (
                                    <div className="w-8 flex-shrink-0 flex flex-col justify-end">
                                        {showAvatar ? (
                                            <Avatar className="h-8 w-8 border border-white shadow-sm">
                                                <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                                                    {msg.senderName?.substring(0, 2).toUpperCase() || "??"}
                                                </AvatarFallback>
                                            </Avatar>
                                        ) : <div className="w-8" />}
                                    </div>
                                )}

                                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
                                    {!isMe && showAvatar && (
                                        <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1">{msg.senderName}</span>
                                    )}
                                    
                                    <div className={`px-4 py-2.5 shadow-sm text-sm relative group ${
                                        isMe 
                                        ? "bg-blue-600 text-white rounded-2xl rounded-tr-none shadow-blue-200/50" 
                                        : "bg-white border border-slate-100/60 text-slate-700 rounded-2xl rounded-tl-none shadow-slate-200/5"
                                    }`}>
                                       {msg.content}
                                       <div className={`text-[9px] font-medium mt-1 text-right opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? "text-blue-100" : "text-slate-300"}`}>
                                            {format(new Date(msg.createdAt), "h:mm a")}
                                       </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>
        )}

        <div className="p-4 bg-white border-t shrink-0">
             <form onSubmit={handleSend} className="flex gap-2 items-center bg-slate-50 p-1 rounded-full border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
                <Button type="button" size="icon" variant="ghost" className="rounded-full text-slate-400 hover:text-slate-600 h-9 w-9">
                    <MoreVertical className="h-4 w-4 rotate-90" />
                </Button>
                
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 h-9 font-medium"
                />
                
                <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!newMessage.trim() || isLoading} 
                    className="rounded-full h-9 w-9 bg-blue-600 hover:bg-blue-700 shadow-md"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
        </div>
    </div>
  );
}
