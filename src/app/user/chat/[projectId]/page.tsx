
"use client";

import { useEffect, useState, useRef, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, MessageSquare, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { format } from "date-fns";

interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
}

interface Project {
  id: string;
  name: string;
}

export default function ChatPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params); 
  const { data: session } = authClient.useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch project details
  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then(res => res.json())
      .then(data => setProject(data))
      .catch(err => console.error(err));
  }, [projectId]);

  useEffect(() => {
    // Initial fetch
    setMessages([]);
    fetch(`/api/chat/${projectId}`)
      .then(res => res.json())
      .then(data => {
         if(Array.isArray(data)) setMessages(data);
         setTimeout(scrollToBottom, 100);
      });

    // Socket connection
    let socketInstance: any;
    (async () => {
        const { getSocket } = await import("@/lib/socket");
        socketInstance = getSocket();
        
        const joinRoom = () => {
             console.log("User Joining room:", projectId);
             socketInstance.emit("join-room", projectId);
        };

        if (socketInstance.connected) {
            joinRoom();
        }

        socketInstance.on("connect", joinRoom);

        socketInstance.on("message", (data: any) => {
             console.log("User Received message:", data);
             setMessages(prev => {
                const exists = prev.some(m => m.id === data.id);
                if (exists) return prev;
                return [...prev, data];
             });
             setTimeout(scrollToBottom, 100);
        });
    })();

    return () => {
        if(socketInstance) {
            socketInstance.off("message");
            socketInstance.off("connect");
        }
    };
  }, [projectId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user) return;

    const content = newMessage;
    setNewMessage(""); 

    try {
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

      setMessages(prev => [...prev, {
          ...realMessage,
          senderName: session.user.name || "Me", 
          projectId: projectId
      }]);
      setTimeout(scrollToBottom, 50);

      const socketMsg = {
          ...realMessage,
          senderName: session.user.name || "Me",
          projectId: projectId
      };
      
      const { getSocket } = await import("@/lib/socket");
      getSocket().emit("send-message", socketMsg);

    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Chat Container */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Chat Header */}
        <div className="h-20 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
              className="hover:bg-white/50 rounded-full shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
                {project?.name?.substring(0, 2).toUpperCase() || "PC"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{project?.name || "Loading..."}</h3>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-xs text-slate-600 font-medium">Active now</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-700 hover:bg-white/50">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50/50 to-white">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 opacity-60">
              <MessageSquare className="h-16 w-16" />
              <p className="font-medium text-sm">No messages yet. Start the conversation!</p>
            </div>
          )}
          
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === session?.user.id;
            const showAvatar = idx === 0 || messages[idx - 1].senderId !== msg.senderId;
            
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                {!isMe && (
                  <div className="w-8 flex-shrink-0 flex flex-col justify-end">
                    {showAvatar ? (
                      <Avatar className="h-8 w-8 border border-white shadow-sm">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700 font-bold">
                          {msg.senderName?.substring(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                    ) : <div className="w-8" />}
                  </div>
                )}

                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%] sm:max-w-[70%] md:max-w-[60%]`}>
                  {!isMe && showAvatar && (
                    <span className="text-xs font-bold text-slate-500 mb-1 ml-1">{msg.senderName}</span>
                  )}
                  
                  <div className={`px-4 py-3 shadow-md text-sm relative group transition-all hover:shadow-lg ${
                    isMe 
                    ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-md" 
                    : "bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-md"
                  }`}>
                    <p className="leading-relaxed">{msg.content}</p>
                    <div className={`text-[10px] font-medium mt-1.5 text-right opacity-70 ${isMe ? "text-blue-100" : "text-slate-400"}`}>
                      {format(new Date(msg.createdAt), "h:mm a")}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white border-t shrink-0">
          <form onSubmit={handleSend} className="flex gap-3 items-center bg-slate-50 p-2 rounded-full border border-slate-200 focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 transition-all">
            <Input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 h-10 font-medium placeholder:text-slate-400 px-4"
            />
            
            <Button 
              type="submit" 
              size="icon" 
              disabled={!newMessage.trim()} 
              className="rounded-full h-11 w-11 shrink-0 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
