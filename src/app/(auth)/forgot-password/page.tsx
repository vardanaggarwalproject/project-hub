"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        await (authClient as any).forgetPassword({
            email,
            redirectTo: "/reset-password",
        }, {
            onSuccess: () => {
                setIsSubmitted(true);
                setIsLoading(false);
            },
            onError: (ctx: any) => {
                setError(ctx.error.message);
                setIsLoading(false);
            }
        });
    };

    if (isSubmitted) {
        return (
            <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl relative overflow-hidden ring-1 ring-slate-200/50">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
                <CardHeader className="pt-10 pb-6 text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-2 ring-1 ring-emerald-100">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">Check your email</CardTitle>
                    <CardDescription className="text-slate-500 font-medium whitespace-pre-line">
                        We've sent a password reset link to <span className="font-bold text-slate-900">{email}</span>
                    </CardDescription>
                </CardHeader>
                <CardFooter className="px-8 pb-10">
                    <Button asChild variant="outline" className="w-full h-12 font-bold uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                        <Link href="/login">
                            <ArrowLeft className="mr-2 w-4 h-4" />
                            Back to Login
                        </Link>
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
                    <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">Forgot Password?</CardTitle>
                <CardDescription className="text-slate-500 font-medium">Enter your email and we'll send you a link to reset your password</CardDescription>
            </CardHeader>

            <form onSubmit={handleForgotPassword}>
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
                            "Send Reset Link"
                        )}
                    </Button>
                    <Button asChild variant="ghost" className="w-full h-12 font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">
                        <Link href="/login">
                            <ArrowLeft className="mr-2 w-4 h-4" />
                            Back to Login
                        </Link>
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
