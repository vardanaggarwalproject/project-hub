"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Bell, Shield, Palette, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UserSettingsPage() {
    return (
         <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">Settings</h2>
                <p className="text-muted-foreground">Customize your account and organization preferences</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-white p-1 border h-auto flex-wrap sm:flex-nowrap justify-start">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-slate-100 font-bold px-6 py-2.5">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-100 font-bold px-6 py-2.5">
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-slate-100 font-bold px-6 py-2.5">
                        <Shield className="h-4 w-4 mr-2" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="data-[state=active]:bg-slate-100 font-bold px-6 py-2.5">
                        <Palette className="h-4 w-4 mr-2" />
                        Appearance
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal details and how others see you.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-muted-foreground border-2 border-dashed border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                                <Plus className="h-6 w-6" />
                            </div>
                            <p className="text-sm text-muted-foreground italic">Profile editing module coming soon...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="notifications">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Preferences</CardTitle>
                            <CardDescription>Choose what updates you want to receive.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-muted-foreground italic">Notification settings coming soon...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
         </div>
    )
}
