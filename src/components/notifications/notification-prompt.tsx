"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export function NotificationPrompt() {
    const { data: session } = authClient.useSession();
    const userId = session?.user?.id;
    const [isOpen, setIsOpen] = useState(false);

    // We use a separate state to track if we've already checked the storage
    const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

    const {
        isSupported,
        isSubscribed,
        isLoading,
        permission,
        subscribe,
    } = usePushNotifications({ userId: userId || "" });

    useEffect(() => {
        // Wait for push notification state to load and user to be present
        if (!isSupported || isLoading || !userId || hasCheckedStorage) return;

        // Check if user has already made a choice (Enable or Disable)
        const hasMadeChoice = localStorage.getItem("notification_prompt_choice");

        // Show ONLY if:
        // 1. Permission is default (hasn't been asked/blocked by browser yet)
        // 2. We haven't recorded a choice in localStorage yet
        if (permission === 'default' && !hasMadeChoice) {
            setIsOpen(true);
        }

        // If already granted, ensure it's closed
        if (permission === 'granted') {
            setIsOpen(false);
        }

        setHasCheckedStorage(true);

    }, [isSupported, isLoading, userId, permission, hasCheckedStorage]);

    const handleEnable = async () => {
        if (!userId) return;

        const success = await subscribe();

        if (success) {
            localStorage.setItem("notification_prompt_choice", "true");
            toast.success("Notifications enabled successfully!");
            setIsOpen(false);
        } else {
            // If it failed, don't set the flag so they can try again later
            // unless permission was denied by the browser
            if (Notification.permission === 'denied') {
                localStorage.setItem("notification_prompt_choice", "denied");
                toast.error("Notifications are blocked by your browser settings.");
                setIsOpen(false);
            } else {
                toast.error("Failed to enable notifications. Please try again.");
            }
        }
    };

    const handleDisable = () => {
        // Permanent dismissal
        localStorage.setItem("notification_prompt_choice", "false");
        toast.info("Notifications disabled. You can enable them later in settings.");
        setIsOpen(false);
    };

    if (!isSupported || permission === 'granted') return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[380px] p-0 border-0 shadow-2xl bg-background/95 backdrop-blur-md overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10">

                {/* Premium Header Gradient */}
                <div className="h-16 bg-gradient-to-b from-primary/5 to-transparent w-full flex items-center justify-center pt-6">
                    <div className="rounded-full bg-background shadow-sm p-4 ring-1 ring-border/50">
                        <Bell className="h-6 w-6 text-primary" strokeWidth={2} />
                    </div>
                </div>

                <div className="px-8 pb-4 text-center space-y-6">
                    <div className="space-y-2">
                        <DialogTitle className="text-xl font-medium tracking-tight text-foreground">
                            Enable Notifications
                        </DialogTitle>
                        <DialogDescription className="text-base text-muted-foreground leading-relaxed">
                            Stay instantly updated with real-time alerts for new EODs and important memos.
                        </DialogDescription>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Button
                            size="lg"
                            className="w-full rounded-xl font-medium shadow-md hover:shadow-lg transition-all text-base h-12"
                            onClick={handleEnable}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Allow Notifications"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={handleDisable}
                            className="w-full rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 h-6"
                        >
                            Don't Allow
                        </Button>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
                        <CheckCircle2 className="h-2 w-2" />
                        <span>You can change this anytime in settings.</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
