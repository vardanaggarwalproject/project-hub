"use client";

import { useState, useEffect } from "react";
import { Bell, Send, Loader2, CheckCircle2, AlertCircle, Mail, MessageSquare, Smartphone, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface NotificationPreferences {
    emailEnabled: boolean;
    slackEnabled: boolean;
    pushEnabled: boolean;
}

interface NotificationRecipient {
    id: string;
    email: string;
    label: string;
    eodEnabled: boolean;
    memoEnabled: boolean;
    projectEnabled: boolean;
}

export function NotificationSettings() {
    const { user, userRole } = useAuth();
    const userId = user?.id;
    const isAdmin = userRole === "admin";
    
    const { 
        isSupported, 
        isSubscribed, 
        isLoading: pushLoading, 
        permission, 
        subscribe, 
        unsubscribe 
    } = usePushNotifications({ userId: userId || "" });

    const [preferences, setPreferences] = useState<NotificationPreferences>({
        emailEnabled: true,
        slackEnabled: true,
        pushEnabled: true,
    });
    const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
    const [newEmail, setNewEmail] = useState("");
    const [newLabel, setNewLabel] = useState("");
    const [isAddingRecipient, setIsAddingRecipient] = useState(false);
    const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        if (!userId) return;
        
        const fetchPreferences = async () => {
            try {
                const response = await fetch("/api/notifications/preferences");
                if (response.ok) {
                    const data = await response.json();
                    setPreferences({
                        emailEnabled: data.emailEnabled ?? true,
                        slackEnabled: data.slackEnabled ?? true,
                        pushEnabled: data.pushEnabled ?? true,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch preferences:", error);
            } finally {
                setIsLoadingPrefs(false);
            }
        };

        const fetchRecipients = async () => {
            if (!isAdmin) return;
            try {
                const response = await fetch("/api/notifications/recipients");
                if (response.ok) {
                    const data = await response.json();
                    setRecipients(data);
                }
            } catch (error) {
                console.error("Failed to fetch recipients:", error);
            }
        };

        fetchPreferences();
        fetchRecipients();
    }, [userId, isAdmin]);

    const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
        if (!userId) {
            toast.error("You must be logged in to manage notifications");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/notifications/preferences", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [key]: value }),
            });

            if (!response.ok) {
                throw new Error("Failed to update preference");
            }

            const updated = await response.json();
            setPreferences({
                emailEnabled: updated.emailEnabled ?? true,
                slackEnabled: updated.slackEnabled ?? true,
                pushEnabled: updated.pushEnabled ?? true,
            });
            toast.success("Settings saved");
        } catch (error) {
            console.error("Failed to update preference:", error);
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const addRecipient = async () => {
        if (!newEmail || !newEmail.includes("@")) {
            toast.error("Please enter a valid email address");
            return;
        }

        setIsAddingRecipient(true);
        try {
            const response = await fetch("/api/notifications/recipients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: newEmail, 
                    label: newLabel || "Admin" 
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to add recipient");
            }

            const added = await response.json();
            setRecipients([...recipients, added]);
            setNewEmail("");
            setNewLabel("");
            toast.success("Recipient added");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to add recipient");
        } finally {
            setIsAddingRecipient(false);
        }
    };

    const updateRecipientToggle = async (id: string, field: string, value: boolean) => {
        try {
            const response = await fetch("/api/notifications/recipients", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, [field]: value }),
            });

            if (!response.ok) throw new Error();

            setRecipients(recipients.map(r => r.id === id ? { ...r, [field]: value } : r));
        } catch (error) {
            toast.error("Failed to update recipient toggles");
        }
    };

    const removeRecipient = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/recipients?id=${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to remove recipient");
            }

            setRecipients(recipients.filter(r => r.id !== id));
            toast.success("Recipient removed");
        } catch (error) {
            toast.error("Failed to remove recipient");
        }
    };

    const handlePushToggle = async (enabled: boolean) => {
        if (!userId) {
            toast.error("You must be logged in to manage notifications");
            return;
        }

        if (enabled) {
            const success = await subscribe();
            if (success) {
                await updatePreference("pushEnabled", true);
                toast.success("Push notifications enabled");
            } else {
                toast.error("Failed to enable notifications. Check browser permissions.");
            }
        } else {
            const success = await unsubscribe();
            if (success) {
                await updatePreference("pushEnabled", false);
                toast.success("Push notifications disabled");
            } else {
                toast.error("Failed to disable notifications");
            }
        }
    };

    const sendTestNotification = async () => {
        setIsTesting(true);
        try {
            const response = await fetch("/api/notifications/test", {
                method: "POST",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to send test notification");
            }

            toast.success("Test notification sent!");
        } catch (error) {
            console.error("Test notification error:", error);
            toast.error(error instanceof Error ? error.message : "Failed to send test notification");
        } finally {
            setIsTesting(false);
        }
    };

    if (!isSupported) {
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-1">Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage how you receive notifications
                    </p>
                </div>

                <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <div className="p-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                                    Browser Not Supported
                                </h4>
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    Your browser doesn't support push notifications. Please use Chrome, Firefox, or Edge for the best experience.
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-1">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                    Manage how you receive notifications
                </p>
            </div>

            <Card>
                <div className="p-6 space-y-6">
                    {/* Push Notifications (Individual) */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-muted">
                                <Smartphone className="h-5 w-5 text-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Label htmlFor="push-notifications" className="text-base font-medium cursor-pointer">
                                        Push Notifications
                                    </Label>
                                    {isSubscribed && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Active
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Receive real-time desktop notifications for important updates
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="push-notifications"
                            checked={isSubscribed}
                            onCheckedChange={handlePushToggle}
                            disabled={pushLoading || isLoadingPrefs}
                            className="shrink-0"
                        />
                    </div>

                    {permission === 'denied' && (
                        <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
                            <Info className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-amber-900 dark:text-amber-100">
                                    <strong className="font-semibold">Permission Denied:</strong> Click the lock icon in your address bar and allow notifications to enable this feature.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Slack Notifications (Individual) */}
                    <Separator />
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-muted">
                                <MessageSquare className="h-5 w-5 text-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Label htmlFor="slack-notifications" className="text-base font-medium cursor-pointer">
                                        Slack Notifications
                                    </Label>
                                    {preferences.slackEnabled && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Active
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Receive notifications in your Slack workspace
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="slack-notifications"
                            checked={preferences.slackEnabled}
                            onCheckedChange={(checked) => updatePreference("slackEnabled", checked)}
                            disabled={isSaving || isLoadingPrefs}
                            className="shrink-0"
                        />
                    </div>

                    {/* Admin-only: Email Recipients Management */}
                    {isAdmin && (
                        <>
                            <Separator />
                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-foreground" />
                                    <h4 className="text-base font-medium">Email Notification Recipients</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Only people listed here will receive email notifications. Any admin can manage this list.
                                </p>

                                {/* New Recipient Form */}
                                <div className="grid gap-4 sm:grid-cols-[1fr,1fr,auto] items-end border p-4 rounded-xl bg-muted/30">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-email" className="text-xs">Email Address</Label>
                                        <input 
                                            id="new-email"
                                            type="email"
                                            placeholder="email@example.com"
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-label" className="text-xs">Label (e.g. Name/Role)</Label>
                                        <input 
                                            id="new-label"
                                            type="text"
                                            placeholder="Admin: John"
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={newLabel}
                                            onChange={(e) => setNewLabel(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={addRecipient} disabled={isAddingRecipient} size="sm" className="w-full sm:w-auto">
                                        {isAddingRecipient ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                                    </Button>
                                </div>

                                {/* Recipients List */}
                                <div className="space-y-4">
                                    {recipients.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed rounded-xl text-muted-foreground">
                                            No recipients configured. No emails will be sent.
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {recipients.map((recipient) => (
                                                <div key={recipient.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border bg-card">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">{recipient.email}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{recipient.label}</p>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4 sm:border-l sm:pl-4">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-[10px] uppercase font-bold text-muted-foreground">EOD</span>
                                                            <Switch 
                                                                checked={recipient.eodEnabled}
                                                                onCheckedChange={(checked) => updateRecipientToggle(recipient.id, 'eodEnabled', checked)}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Memo</span>
                                                            <Switch 
                                                                checked={recipient.memoEnabled}
                                                                onCheckedChange={(checked) => updateRecipientToggle(recipient.id, 'memoEnabled', checked)}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Proj</span>
                                                            <Switch 
                                                                checked={recipient.projectEnabled}
                                                                onCheckedChange={(checked) => updateRecipientToggle(recipient.id, 'projectEnabled', checked)}
                                                            />
                                                        </div>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => removeRecipient(recipient.id)}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 rotate-45" /> 
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Test Notification Button */}
                    {isSubscribed && (
                        <>
                            <Separator />
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-sm font-medium mb-1">Test Notifications</p>
                                    <p className="text-sm text-muted-foreground">
                                        Send a test notification to verify your settings
                                    </p>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={sendTestNotification}
                                    disabled={isTesting}
                                    className="shrink-0"
                                >
                                    {isTesting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Send Test
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}
