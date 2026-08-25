"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Send, ChevronDown, LogOut, FileEdit } from "lucide-react";

import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { useAuth } from "@/components/providers";
import { useSidebar } from "./SidebarContext";
import { toast } from "sonner";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard/Scheduled", icon: Clock, label: "Scheduled", count: null },
  { href: "/dashboard/sent", icon: Send, label: "Sent", count: null },
  { href: "/dashboard/draft", icon: FileEdit, label: "Drafts", count: null },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { setIsComposeOpen } = useSidebar();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
  };

  if (pathname === '/dashboard/compose') {
    return null;
  }

  return (
    <aside className="flex h-full shrink-0 flex-col border-r border-stroke bg-white p-4 font-satoshi w-[260px] dark:border-stroke-dark dark:bg-gray-dark">
      {/* Brand Logo */}
      <div className="mb-6 px-2 mt-2">
        <span className="font-mono text-4xl font-black tracking-widest text-dark dark:text-white">
          ONB
        </span>
      </div>

      {/* User Profile */}
      <div className="relative mb-6">
        <div
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center justify-between rounded-xl bg-[#F5F7F9] p-2 dark:bg-dark-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="h-9 w-9 shrink-0 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-full bg-gray-300 dark:bg-dark-3" />
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-dark dark:text-white">
                {user?.name}
              </span>
              <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                {user?.email}
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 mr-1" />
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-stroke bg-white p-1 shadow-lg dark:border-stroke-dark dark:bg-dark-2 z-50">
            <Button
              variant="unstyled"
              size="none"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        )}
      </div>

      {/* Compose Button */}
      <Button
        variant="brand"
        className="mb-8 w-full"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.href = "/dashboard/compose";
          }
        }}
      >
        Compose
      </Button>

      {/* Navigation */}
      <div className="flex-1">
        <div className="mb-3 px-2 text-xs font-semibold text-gray-400 tracking-wider">CORE</div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname === '/dashboard' && item.href === '/dashboard/Scheduled');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#EEF5F0] text-dark font-semibold dark:bg-[#1E293B] dark:text-white"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-dark-2"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-dark dark:text-white" : "text-gray-500"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.count != null && (
                  <span className={cn(
                    "text-xs",
                    isActive ? "text-gray-600 font-semibold dark:text-gray-300" : "text-gray-400"
                  )}>
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
