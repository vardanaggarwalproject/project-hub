"use client";

import { useState, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);
        setError(null);

        await authClient.resetPassword({
            newPassword: password,
        }, {
            onSuccess: () => {
                setIsSuccess(true);
                setIsLoading(false);
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            },
            onError: (ctx) => {
                setError(ctx.error.message);
                setIsLoading(false);
            }
        });
    };

    if (isSuccess) {
        return (
            <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl relative overflow-hidden ring-1 ring-slate-200/50">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
                <CardHeader className="pt-10 pb-6 text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-2 ring-1 ring-emerald-100">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">Password Reset!</CardTitle>
                    <CardDescription className="text-slate-500 font-medium">Your password has been successfully reset. Redirecting you to login...</CardDescription>
                </CardHeader>
                <CardFooter className="px-8 pb-10">
                    <Button onClick={() => router.push("/login")} className="w-full h-12 bg-slate-900 font-bold uppercase tracking-widest text-white">
                        Go to Login
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl relative overflow-hidden ring-1 ring-slate-200/50">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
            
            <CardHeader className="pt-10 pb-6 text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-2 ring-1 ring-blue-100">
                    <Lock className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">Reset Password</CardTitle>
                <CardDescription className="text-slate-500 font-medium">Set a new, secure password for your account</CardDescription>
            </CardHeader>

            <form onSubmit={handleResetPassword}>
                <CardContent className="space-y-6 px-8">
                    {error && (
                        <div className="text-sm font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            {error}
                        </div>
                    )}
                    
                    <div className="space-y-2.5">
                        <Label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">New Password</Label>
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
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Confirm Password</Label>
                        <div className="relative group">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <Input 
                                id="confirmPassword" 
                                type={showPassword ? "text" : "password"} 
                                required 
                                className="pl-11 pr-12 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-slate-900 font-medium"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 px-8 pb-10 pt-4">
                    <Button 
                        type="submit" 
                        className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99]" 
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset Password"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
