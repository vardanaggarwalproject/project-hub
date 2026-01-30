"use client";

import { useEffect, useState, useRef } from "react";
import { Camera, Loader2, User, Mail, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ProfileSettings() {
    const { data: session, refetch } = authClient.useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (session?.user) {
            setName(session.user.name || "");
            setEmail(session.user.email || "");
        }
    }, [session]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!session?.user?.id) {
            toast.error("User ID not found");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) throw new Error("Failed to upload image");
            const uploadData = await uploadRes.json();
            const imageUrl = uploadData.secure_url;

            const updateRes = await fetch(`/api/users/${session.user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: imageUrl }),
            });

            if (!updateRes.ok) throw new Error("Failed to update profile image");

            await refetch();
            toast.success("Profile picture updated");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile picture");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!session?.user?.id) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/users/${session.user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email }),
            });

            if (!res.ok) throw new Error("Failed to update profile");

            await refetch();
            toast.success("Profile updated");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold mb-1">Profile</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your public profile and personal information
                </p>
            </div>

            <Card className="border-border/50 shadow-sm">
                <div className="p-6 space-y-6">
                    {/* Avatar Selection */}
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-2 border-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 shadow-md ring-2 ring-background transition-all">
                                <AvatarImage src={session?.user?.image || ""} className="object-cover" />
                                <AvatarFallback className="text-3xl font-semibold bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 text-blue-600 dark:text-blue-400">
                                    {session?.user?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
                            >
                                {isUploading ? (
                                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                                ) : (
                                    <Camera className="h-8 w-8 text-white" />
                                )}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                            />
                        </div>
                        <div className="text-center sm:text-left space-y-2">
                            <h4 className="font-medium text-base">Profile Picture</h4>
                            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                                Click on the avatar to upload a new photo. Recommended size: 400x400px. PNG or JPG, max 5MB.
                            </p>
                            {session?.user?.image && (
                                <p className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1.5 justify-center sm:justify-start mt-3">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Custom image active
                                </p>
                            )}
                        </div>
                    </div>

                    <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

                    {/* Form Fields */}
                    <div className="space-y-5">
                        <div className="grid gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-muted/50">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <Label htmlFor="name" className="text-sm font-medium">Display Name</Label>
                            </div>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your full name"
                                className="max-w-md h-10 border-border/50 focus-visible:ring-blue-500"
                            />
                            <p className="text-xs text-muted-foreground">
                                This is your public display name shown to other team members.
                            </p>
                        </div>

                        <div className="grid gap-2.5">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/30">
                                    <Mail className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                            </div>
                            <Input
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={(session?.user as any)?.role !== "admin"}
                                className={`max-w-md h-10 border-border/50 focus-visible:ring-purple-500 ${(session?.user as any)?.role !== "admin" ? "bg-muted/30 text-muted-foreground cursor-not-allowed" : ""}`}
                            />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {(session?.user as any)?.role === "admin"
                                    ? "Admins can update their notification email here."
                                    : "Your email address is managed by your organization."}
                            </p>
                        </div>
                    </div>

                    <div className="pt-1 flex flex-col sm:flex-row gap-2">
                        <Button
                            onClick={handleSave}
                            disabled={isLoading || isUploading || (name === session?.user?.name && email === session?.user?.email)}
                            className="w-full sm:w-auto h-10 px-6"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
