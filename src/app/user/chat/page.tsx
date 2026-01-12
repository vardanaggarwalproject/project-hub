"use client";

import { UserChatView } from "@/components/chat/user-chat-view";
import { useSearchParams } from "next/navigation";

export default function UserChatListPage() {
    const searchParams = useSearchParams();
    const initialGroupId = searchParams.get("groupId");

    return (
         <div className="h-full flex flex-col">
            <div className="flex-1 min-h-0">
                <UserChatView initialGroupId={initialGroupId} />
            </div>
         </div>
    )
}
