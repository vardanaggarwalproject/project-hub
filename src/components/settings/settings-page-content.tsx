"use client";

import { useState } from "react";
import { User, Palette, Bell, Settings2 } from "lucide-react";
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
            <div className="w-full px-6 sm:px-8 lg:px-12 py-10 sm:py-16">
                {/* Premium Minimal Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-xl bg-muted/50 border border-border/50">
                            <Settings2 className="h-5 w-5 text-foreground/70" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Settings</h1>
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base ml-14">
                        Manage your account preferences and configurations
                    </p>
                </div>

                <Separator className="mb-10" />

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
                    {/* Sidebar Navigation */}
                    <aside className="w-full lg:w-72 shrink-0">
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
