"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MoreVertical, Phone, Video, MessageSquare } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
}

interface ChatWindowProps {
  groupId: string;
  groupName: string;
  projectId: string;
}

export function ChatWindow({ groupId, groupName, projectId }: ChatWindowProps) {
  const { data: session } = authClient.useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch initial messages
  useEffect(() => {
    async function fetchMessages() {
        try {
            const res = await fetch(`/api/chat/${projectId}`);
            if (res.ok) {
                const data = await res.json();
                if(Array.isArray(data)) {
                    setMessages(data);
                }
            }
        } catch (err) {
            console.error(err);
        }
    }
    fetchMessages();
  }, [projectId]);

  // Socket connection
  useEffect(() => {
    const socket = (async () => {
        const { getSocket } = await import("@/lib/socket");
        return getSocket();
    })();

    let socketInstance: any;

    socket.then(s => {
        socketInstance = s;
        
        const joinRoom = () => {
             console.log("Joining room:", projectId);
             s.emit("join-room", projectId);
        };

        if (s.connected) {
            joinRoom();
        }

        s.on("connect", joinRoom);

        s.on("message", (data: any) => {
             console.log("Received message:", data);
             setMessages(prev => {
                const exists = prev.some(m => m.id === data.id);
                if (exists) return prev;
                return [...prev, data];
             });
             setTimeout(scrollToBottom, 100);
        });
    });

    return () => {
        if(socketInstance) {
            socketInstance.off("message");
            socketInstance.off("connect"); // Clean up listener to avoid dupes
        }
    };
  }, [projectId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user) return;

    // We don't have the real ID yet, so we cannot effectively dedupe by ID if we rely solely on ID from server event.
    // However, if we wait for server response before emitting socket, we have the ID.
    // But we want optimistic UI.
    // Strategy: Optimistic update -> API Call -> API returns real Msg -> Socket emits or we rely on Server broadcast?
    // Current server.js: `socket.on("send-message", data => io.to(projectId).emit("message", data))`
    // It just echoes exactly what we send it. It DOES NOT save to DB.
    // So we MUST save to DB via API first, get the real object, THEN emit the real object to socket.

    const content = newMessage;
    setNewMessage(""); // Clear input immediately

    try {
       // 1. Save to DB
       const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectId,
          content: content,
        }),
      });

      if (!res.ok) throw new Error("Failed to send");
      
      const realMessage = await res.json();

      // 2. Add to local state (if not already there via socket race condition? unlikely to be faster than this await)
      setMessages(prev => [...prev, {
          ...realMessage,
          senderName: session.user.name || "Me", // API returns senderName? No, API returns DB record.
          projectId: projectId
      }]);

      // 3. Emit to Socket for OTHERS
      // We need to construct the full message object expected by clients
      const socketMsg = {
          ...realMessage,
          senderName: session.user.name || "Me",
          projectId: projectId
      };
      
      const { getSocket } = await import("@/lib/socket");
      getSocket().emit("send-message", socketMsg);

    } catch (error) {
      console.error("Failed to send message", error);
      // Construct error toast or restore input
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/30">
        {/* Header */}
        <div className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-4">
                <Avatar className="h-9 w-9 border border-slate-200">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                        {groupName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">{groupName}</h3>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-xs text-slate-500 font-medium">Active now</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1">
                 <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600">
                    <Phone className="h-4 w-4" />
                 </Button>
                 <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600">
                    <Video className="h-4 w-4" />
                 </Button>
                 <Separator orientation="vertical" className="h-6 mx-2" />
                 <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-700">
                    <MoreVertical className="h-4 w-4" />
                 </Button>
            </div>
        </div>

        {/* Messages Layout */}
        <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 overflow-y-auto p-6 space-y-6 scroll-smooth">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 opacity-50">
                        <MessageSquare className="h-12 w-12" />
                        <p className="font-medium text-sm">No messages yet. Start the conversation!</p>
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
                                    ? "bg-blue-600 text-white rounded-2xl rounded-tr-none" 
                                    : "bg-white border border-slate-100/60 text-slate-700 rounded-2xl rounded-tl-none"
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

        {/* Input Area */}
        <div className="p-4 bg-white border-t space-y-3 shrink-0">
             <form onSubmit={handleSend} className="flex gap-3 items-center bg-slate-50 p-1.5 rounded-full border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
                <Button type="button" size="icon" variant="ghost" className="rounded-full text-slate-400 hover:text-slate-600 shrink-0 h-9 w-9">
                    <MoreVertical className="h-4 w-4 rotate-90" />
                </Button>
                
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 h-9 font-medium placeholder:text-slate-400"
                />
                
                <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!newMessage.trim()} 
                    className="rounded-full h-9 w-9 shrink-0 bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
        </div>
    </div>
  );
}
