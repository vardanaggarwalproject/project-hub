"use client";

import { AdminChatView } from "@/components/chat/admin-chat-view";
import { useSearchParams } from "next/navigation";

export default function AdminChatListPage() {
    const searchParams = useSearchParams();
    const initialGroupId = searchParams.get("groupId");

    return (
         <div className="h-full flex flex-col">
            <div className="flex-1 min-h-0">
                <AdminChatView initialGroupId={initialGroupId} />
            </div>
         </div>
    )
}
