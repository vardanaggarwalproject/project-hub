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
                <h3 className="text-lg font-semibold mb-1">Profile</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your public profile and personal information
                </p>
            </div>

            <Card>
                <div className="p-6 space-y-8">
                    {/* Avatar Selection */}
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-md ring-1 ring-border transition-all">
                                <AvatarImage src={session?.user?.image || ""} className="object-cover" />
                                <AvatarFallback className="text-3xl font-light bg-muted text-muted-foreground">
                                    {session?.user?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-[2px]"
                            >
                                {isUploading ? (
                                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-spin" />
                                ) : (
                                    <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
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
                        <div className="text-center sm:text-left space-y-1">
                            <h4 className="font-semibold text-base">Profile Picture</h4>
                            <p className="text-sm text-muted-foreground max-w-[240px]">
                                Click on the avatar to upload a new photo. PNG or JPG, max 5MB.
                            </p>
                            {session?.user?.image && (
                                <p className="text-[10px] text-green-600 dark:text-green-500 flex items-center gap-1 justify-center sm:justify-start mt-2">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Custom image active
                                </p>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Form Fields */}
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <Label htmlFor="name" className="text-sm font-medium">Display Name</Label>
                            </div>
                            <Input 
                                id="name" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                placeholder="Your full name"
                                className="max-w-md h-10"
                            />
                            <p className="text-xs text-muted-foreground">
                                This is your public display name shown to other team members.
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                            </div>
                            <Input 
                                id="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={(session?.user as any)?.role !== "admin"} 
                                className={`max-w-md h-10 ${(session?.user as any)?.role !== "admin" ? "bg-muted/50 text-muted-foreground" : ""}`}
                            />
                            <p className="text-xs text-muted-foreground">
                                {(session?.user as any)?.role === "admin" 
                                    ? "Admins can update their notification email here." 
                                    : "Your email address is managed by your organization."}
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                        <Button 
                            onClick={handleSave} 
                            disabled={isLoading || isUploading || (name === session?.user?.name && email === session?.user?.email)}
                            className="w-full sm:w-auto px-8"
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
