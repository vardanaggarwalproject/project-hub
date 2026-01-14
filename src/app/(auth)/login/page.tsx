"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        await authClient.signIn.email({
            email,
            password,
        }, {
            onSuccess: async () => {
                const { data: session } = await authClient.getSession();
                if ((session?.user as any).role === "admin") {
                    router.push("/admin/dashboard");
                } else {
                    router.push("/user/dashboard");
                }
            },
            onError: (ctx) => {
                setError(ctx.error.message);
                setIsLoading(false);
            }
        });
    };

    return (
        <div className="relative w-full overflow-hidden">
            {/* Background elements */}
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

            <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl relative z-10 overflow-hidden ring-1 ring-slate-200/50">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
                
                <CardHeader className="pt-10 pb-6 text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-2 ring-1 ring-blue-100">
                        <Lock className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-900 tracking-tight uppercase">Welcome Back</CardTitle>
                    <CardDescription className="text-slate-500 font-medium">Enter your credentials to access your project dashboard</CardDescription>
                </CardHeader>

                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-6 px-8">
                        {error && (
                            <div className="text-sm font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                {error}
                            </div>
                        )}
                        
                        <div className="space-y-2.5">
                            <Label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Email Address</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="name@company.com" 
                                    required 
                                    className="pl-11 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-slate-900 font-medium"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between ml-1">
                                <Label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Password</Label>
                                <Link 
                                    href="/forgot-password" 
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
                                >
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <Input 
                                    id="password" 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    className="pl-11 pr-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-slate-900 font-medium"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-10 px-3 hover:bg-transparent text-slate-400 hover:text-slate-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 px-8 pb-10 pt-4">
                        <Button 
                            type="submit" 
                            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99] group" 
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In 
                                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
