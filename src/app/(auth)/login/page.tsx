"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";

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
                if (session?.user.role === "admin") {
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
        <Card>
            <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Enter your email below to sign in to your account</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="m@example.com" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input 
                                id="password" 
                                type={showPassword ? "text" : "password"} 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Sign In
                    </Button>
                    <div className="text-sm text-center text-muted-foreground">
                        Don't have an account?{" "}
                        <Link href="/register" className="underline hover:text-primary">
                            Sign up
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
