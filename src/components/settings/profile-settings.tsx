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
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-semibold mb-1.5">Profile</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your public profile and personal information
                </p>
            </div>

            <Card className="border-border/50">
                <div className="p-8 space-y-10">
                    {/* Avatar Selection */}
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="relative group">
                            <Avatar className="h-28 w-28 sm:h-36 sm:w-36 border-2 border-border/50 shadow-lg ring-4 ring-background transition-all">
                                <AvatarImage src={session?.user?.image || ""} className="object-cover" />
                                <AvatarFallback className="text-4xl font-light bg-muted/50 text-muted-foreground">
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

                    <Separator className="bg-border/50" />

                    {/* Form Fields */}
                    <div className="space-y-8">
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
                                className="max-w-md h-11 border-border/50"
                            />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                This is your public display name shown to other team members.
                            </p>
                        </div>

                        <div className="grid gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-muted/50">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                            </div>
                            <Input
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={(session?.user as any)?.role !== "admin"}
                                className={`max-w-md h-11 border-border/50 ${(session?.user as any)?.role !== "admin" ? "bg-muted/30 text-muted-foreground cursor-not-allowed" : ""}`}
                            />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {(session?.user as any)?.role === "admin"
                                    ? "Admins can update their notification email here."
                                    : "Your email address is managed by your organization."}
                            </p>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={handleSave}
                            disabled={isLoading || isUploading || (name === session?.user?.name && email === session?.user?.email)}
                            className="w-full sm:w-auto px-8 h-11"
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
