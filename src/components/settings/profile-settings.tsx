"use client";

import { useEffect, useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ProfileSettings() {
    const { data: session, refetch } = authClient.useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [name, setName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (session?.user) {
            setName(session.user.name || "");
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
            toast.success("Profile picture updated!");
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
                body: JSON.stringify({ name }),
            });

            if (!res.ok) throw new Error("Failed to update profile");
            
            await refetch();
            toast.success("Profile updated!");
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
                <h3 className="text-lg font-medium">Profile</h3>
                <p className="text-sm text-muted-foreground">
                    This is how others will see you on the site.
                </p>
            </div>
            <Separator />
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
                 <div className="flex flex-col items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                         <Avatar className="h-32 w-32 border-4 border-background shadow-xl ring-1 ring-border transition-all">
                            <AvatarImage src={session?.user?.image || ""} className="object-cover" />
                            <AvatarFallback className="text-4xl font-light bg-secondary text-secondary-foreground">
                                {session?.user?.name?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-[2px]">
                            {isUploading ? (
                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                            ) : (
                                <Camera className="h-8 w-8 text-white" />
                            )}
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageUpload}
                            disabled={isUploading}
                        />
                    </div>
                </div>

                <div className="space-y-4 flex-1 w-full max-w-lg">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Your full name"
                        />
                         <p className="text-[0.8rem] text-muted-foreground">
                            This is your public display name. It can be your real name or a pseudonym.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                         <Input 
                            id="email" 
                            value={session?.user?.email || ""} 
                            disabled 
                            className="bg-muted"
                        />
                        <p className="text-[0.8rem] text-muted-foreground">
                            You cannot change your email address.
                        </p>
                    </div>

                    <Button onClick={handleSave} disabled={isLoading || isUploading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update profile
                    </Button>
                </div>
            </div>
        </div>
    );
}
