
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Building2, ArrowLeft } from "lucide-react";

export default function NewClientPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    address,
                    description
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create client");
            }

            router.push("/admin/clients");
            router.refresh();
        } catch (error: any) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.back()}
                    className="h-9 w-9 p-0 rounded-full"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
                        Add New Client
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Create a new client profile for your organization
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <Card className="border-none shadow-md bg-app-card overflow-hidden">
                <CardHeader className="border-b bg-app-subtle pb-4">
                    <CardTitle className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        Client Information
                    </CardTitle>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6 p-6 pt-6">
                        {/* Client Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Client Name
                            </Label>
                            <Input
                                id="name"
                                placeholder="Enter client name (e.g., Acme Corp)"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-11 border-slate-200 focus-visible:ring-blue-500 font-medium"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Email Address
                                    <span className="text-[10px] font-normal text-slate-400 ml-1">(Optional)</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="contact@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11 border-slate-200 focus-visible:ring-blue-500 font-medium"
                                />
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Location
                                    <span className="text-[10px] font-normal text-slate-400 ml-1">(Optional)</span>
                                </Label>
                                <Input
                                    id="address"
                                    placeholder="Enter location or address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="h-11 border-slate-200 focus-visible:ring-blue-500 font-medium"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Description
                                <span className="text-[10px] font-normal text-slate-400 ml-1">(Optional)</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Add notes or description about the client..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[120px] border-slate-200 focus-visible:ring-blue-500 resize-none font-medium"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t bg-app-subtle p-6">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            type="button"
                            className="font-bold text-slate-500"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !name}
                            className="bg-blue-600 hover:bg-blue-700 shadow-lg px-8 py-6 font-bold text-base rounded-xl transition-all hover:scale-[1.02]"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Client
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
