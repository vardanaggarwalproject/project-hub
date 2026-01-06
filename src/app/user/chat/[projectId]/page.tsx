
"use client";

import { useEffect, useState, useRef, use } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
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

export default function ChatPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params); 
  const { data: session } = authClient.useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial fetch
    fetch(`/api/chat/${projectId}`)
      .then(res => res.json())
      .then(data => {
         if(Array.isArray(data)) setMessages(data);
      });

    // Polling every 3s
    const interval = setInterval(() => {
        fetch(`/api/chat/${projectId}`)
        .then(res => res.json())
        .then(data => {
            if(Array.isArray(data)) setMessages(data);
        });
    }, 3000);

    return () => clearInterval(interval);
  }, [projectId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user) return;

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectId,
          content: newMessage,
        }),
      });

      setNewMessage("");
      const res = await fetch(`/api/chat/${projectId}`);
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-bold">Team Chat</h2>
      </div>
      
      <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-md">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isMe = msg.senderId === session?.user.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-slate-200 rounded-tl-none"
                }`}>
                  {!isMe && <p className="text-[10px] font-bold opacity-70 mb-1">{msg.senderName}</p>}
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-[9px] mt-1 ${isMe ? "text-blue-100" : "text-slate-400"}`}>
                    {format(new Date(msg.createdAt), "h:mm a")}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 bg-white border-t">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
