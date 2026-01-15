
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Building2, Mail, MapPin, FileText, ArrowLeft } from "lucide-react";

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-12 w-12 rounded-xl hover:bg-white/80 transition-all"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                Add New Client
                            </h1>
                            <p className="text-slate-500 font-medium mt-1">
                                Create a new client profile
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <Card className="border-none shadow-xl bg-white/90 backdrop-blur-sm">
                    <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100/50">
                        <CardTitle className="text-xl font-bold text-slate-900">
                            Client Information
                        </CardTitle>
                        <CardDescription className="text-slate-600">
                            Enter the client details below
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6 p-6">
                            {/* Client Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    Client Name
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="Enter client name (e.g., Acme Corp)"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-11 bg-white border-slate-200 focus-visible:ring-blue-500"
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-blue-600" />
                                    Email Address
                                    <span className="text-xs font-normal text-slate-500">(Optional)</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="contact@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11 bg-white border-slate-200 focus-visible:ring-blue-500"
                                />
                            </div>

                            {/* Location */}
                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-blue-600" />
                                    Location
                                    <span className="text-xs font-normal text-slate-500">(Optional)</span>
                                </Label>
                                <Input
                                    id="address"
                                    placeholder="Enter location or address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="h-11 bg-white border-slate-200 focus-visible:ring-blue-500"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    Description
                                    <span className="text-xs font-normal text-slate-500">(Optional)</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="Add notes or description about the client..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="min-h-[120px] bg-white border-slate-200 focus-visible:ring-blue-500 resize-none"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t bg-gradient-to-r from-slate-50/50 to-slate-100/30 p-6">
                            <Button
                                variant="outline"
                                onClick={() => router.back()}
                                type="button"
                                className="h-11 px-6 border-slate-200 hover:bg-white font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 font-semibold"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Client
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
