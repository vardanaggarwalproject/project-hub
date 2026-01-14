"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, EyeOff, User, Mail, Lock, Shield } from "lucide-react";
import { toast } from "sonner";

export function AdminCreateUserForm({ onSuccess }: { onSuccess?: () => void }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState("developer");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/admin/create-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to create user");

            toast.success("User created successfully!", {
                description: `${name} has been added to the system as ${role}`,
            });
            setName("");
            setEmail("");
            setPassword("");
            setRole("developer");
            onSuccess?.();
        } catch (error: any) {
            toast.error("Failed to create user", {
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Full Name</Label>
                    <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Jane Doe" 
                            required 
                            className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                            id="email" 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="jane@example.com" 
                            required 
                            className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Password */}
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
                        <Input 
                            id="password" 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••••" 
                            required 
                            className="pl-10 pr-10 h-11 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4 text-slate-400" />
                            ) : (
                                <Eye className="h-4 w-4 text-slate-400" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Role */}
                <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-semibold text-slate-700">User Role</Label>
                    <div className="relative group">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="pl-10 h-11 bg-white border-slate-200 rounded-xl">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                                <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                        <span>Admin</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="developer">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                        <span>Developer</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="tester">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                        <span>Tester</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="designer">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-pink-500"></div>
                                        <span>Designer</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <Button 
                    type="submit" 
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-all rounded-xl" 
                    disabled={isLoading}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "PROVISIONING..." : "CREATE USER ACCOUNT"}
                </Button>
            </div>
        </form>
    );
}
