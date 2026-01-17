"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/settings/sidebar-nav";
import { User, Palette, Bell, Shield } from "lucide-react";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { PlaceholderSettings } from "@/components/settings/placeholder-settings";

const sidebarNavItems = [
  {
    title: "Profile",
    href: "profile",
    icon: <User className="w-4 h-4" />,
  },
  {
    title: "Appearance",
    href: "appearance",
    icon: <Palette className="w-4 h-4" />,
  },
  {
    title: "Notifications",
    href: "notifications",
    icon: <Bell className="w-4 h-4" />,
  },
  {
    title: "Security",
    href: "security",
    icon: <Shield className="w-4 h-4" />,
  },
];

export default function UserSettingsPage() {
    const [activeTab, setActiveTab] = useState("profile");

    return (
        <div className="hidden space-y-6 pb-16 md:block max-w-7xl mx-auto">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and set e-mail preferences.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:gap-12">
                <aside className="lg:w-1/5 overflow-hidden">
                    <SidebarNav items={sidebarNavItems} activeTab={activeTab} onTabChange={setActiveTab} />
                </aside>
                <div className="flex-1 lg:max-w-2xl">
                    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                         {activeTab === "profile" && <ProfileSettings />}
                         {activeTab === "appearance" && <AppearanceSettings />}
                         {activeTab === "notifications" && <PlaceholderSettings title="Notifications" icon={<Bell className="h-10 w-10 opacity-20"/>} />}
                         {activeTab === "security" && <PlaceholderSettings title="Security" icon={<Shield className="h-10 w-10 opacity-20"/>} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
