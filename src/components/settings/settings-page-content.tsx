"use client";

import { useState } from "react";
import { User, Palette, Bell } from "lucide-react";
import { SidebarNav } from "@/components/settings/sidebar-nav";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { Separator } from "@/components/ui/separator";

const sidebarNavItems = [
    {
        title: "Profile",
        href: "profile",
        icon: <User className="h-4 w-4" />,
    },
    {
        title: "Appearance",
        href: "appearance",
        icon: <Palette className="h-4 w-4" />,
    },
    {
        title: "Notifications",
        href: "notifications",
        icon: <Bell className="h-4 w-4" />,
    },
];

export function SettingsPageContent() {
    const [activeTab, setActiveTab] = useState("profile");

    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Settings</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Manage your account preferences and notification settings
                    </p>
                </div>

                <Separator className="mb-8" />

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    {/* Sidebar Navigation */}
                    <aside className="w-full lg:w-64 shrink-0">
                        <SidebarNav 
                            items={sidebarNavItems} 
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0 max-w-3xl">
                        {activeTab === "profile" && <ProfileSettings />}
                        {activeTab === "appearance" && <AppearanceSettings />}
                        {activeTab === "notifications" && <NotificationSettings />}
                    </div>
                </div>
            </div>
        </div>
    );
}
