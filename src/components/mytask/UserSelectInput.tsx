"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Users, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
}

interface UserSelectInputProps {
  selectedUsers: User[];
  onUsersChange: (users: User[]) => void;
  label?: string;
  placeholder?: string;
  maxHeight?: string;
}

export function UserSelectInput({
  selectedUsers,
  onUsersChange,
  label = "Assignees",
  placeholder = "Search team members...",
  maxHeight = "280px",
}: UserSelectInputProps) {
  const [userSearch, setUserSearch] = useState("");
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users?limit=100");
        if (response.ok) {
          const result = await response.json();
          setAvailableUsers(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setAvailableUsers([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const toggleUser = (user: User) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      onUsersChange(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      onUsersChange([...selectedUsers, user]);
    }
  };

  const filteredUsers = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          {label}
        </Label>
        <div className="flex items-center gap-2">
          {/* Selected users avatars */}
          {selectedUsers.length > 0 && (
            <TooltipProvider>
              <div className="flex items-center -space-x-3">
                {selectedUsers.slice(0, 3).map((member) => (
                  <Tooltip key={member.id}>
                    <TooltipTrigger asChild>
                      <Avatar className="h-8 w-8 border-2 border-white shadow-sm cursor-pointer hover:z-10 hover:scale-110 transition-transform">
                        <AvatarImage src={member.image || ""} />
                        <AvatarFallback className="text-xs font-bold bg-blue-500 text-white">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs font-medium">{member.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{member.role}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {selectedUsers.length > 3 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center cursor-pointer hover:z-10 hover:scale-110 transition-transform">
                        <span className="text-xs font-bold text-slate-600">
                          +{selectedUsers.length - 3}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        {selectedUsers.slice(3).map((member) => (
                          <div key={member.id} className="text-xs">
                            <p className="font-medium">{member.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase">{member.role}</p>
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          )}
          <Badge variant="secondary" className="font-mono">
            {selectedUsers.length} selected
          </Badge>
        </div>
      </div>

      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={placeholder}
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* User Checkbox List */}
      <div
        className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-y-auto"
        style={{ maxHeight }}
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-slate-500 mt-2">Loading users...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="p-2 space-y-1">
            {filteredUsers.map((user) => {
              const isSelected = selectedUsers.some((u) => u.id === user.id);
              return (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all hover:bg-blue-50 dark:hover:bg-blue-950",
                    isSelected
                      ? "bg-blue-50/50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800"
                      : "border border-transparent"
                  )}
                  onClick={() => toggleUser(user)}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded border-2 flex items-center justify-center transition-all shrink-0",
                      isSelected
                        ? "bg-blue-500 border-blue-500"
                        : "border-slate-300 dark:border-slate-600 hover:border-blue-400"
                    )}
                  >
                    {isSelected && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
                      {user.role}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              {userSearch ? "No users found" : "No team members available"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
