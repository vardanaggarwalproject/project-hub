"use client";

import { UserChatView } from "@/components/chat/user-chat-view";

export default function UserChatListPage() {
    return (
         <div className="h-full flex flex-col">
            <div className="flex-1 min-h-0">
                <UserChatView />
            </div>
         </div>
    )
}
