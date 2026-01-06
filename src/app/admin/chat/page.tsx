"use client";

import { AdminChatView } from "@/components/chat/admin-chat-view";

export default function AdminChatListPage() {
    return (
         <div className="h-full flex flex-col">
            <div className="flex-1 min-h-0">
                <AdminChatView />
            </div>
         </div>
    )
}
