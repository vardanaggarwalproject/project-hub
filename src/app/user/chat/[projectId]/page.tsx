"use client";

import { UserChatView } from "@/components/chat/user-chat-view";
import { use } from "react";

export default function UserProjectChatPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);
    
    return (
         <div className="h-full flex flex-col">
            <div className="flex-1 min-h-0">
                <UserChatView initialProjectId={projectId} />
            </div>
         </div>
    )
}
