"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, Settings, User, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";

// Mock session - In production this would come from a context/JWT cookie
const session = {
  user: {
    name: "Mitrajit",
    email: "mitrajit@reachinbox.ai",
    image: null,
  }
};

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const isSearchPage = pathname === "/dashboard/search";
  const [localQuery, setLocalQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim() && !isSearchPage) {
      router.push(`/dashboard/search?q=${encodeURIComponent(localQuery)}`);
    }
  };

  const handleLogout = async () => {
    toast.loading("Logging out...");
    // Simulate logout delay
    await new Promise(resolve => setTimeout(resolve, 800));
    // In production: clear cookies, call API, etc.
    toast.dismiss();
    router.push("/login");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getGlassButtonClass = (isActive: boolean) =>
    cn(
      "group relative isolate flex h-10 w-10 items-center justify-center",
      "overflow-hidden rounded-full",
      "transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out",
      "backdrop-blur-[22px] backdrop-saturate-[170%]",
      "bg-white/[0.075] border border-white/[0.38]",
      "shadow-[0_4px_16px_rgba(72,76,125,0.08),inset_0_1px_0_rgba(255,255,255,0.45)]",
      "before:pointer-events-none before:absolute before:inset-0 before:rounded-full",
      "before:bg-gradient-to-b before:from-white/[0.20] before:to-transparent before:opacity-70",
      "after:pointer-events-none after:absolute after:inset-[1px] after:rounded-full after:border after:border-white/[0.10]",
      "dark:bg-white/[0.045] dark:border-white/[0.14]",
      "dark:shadow-[0_5px_18px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.12)]",
      "dark:before:from-white/[0.10] dark:after:border-white/[0.05]",
      "hover:scale-105",
      isActive && [
        "bg-[#9A9FF2]/[0.13] border-[#A7ABF5]/[0.42] text-[#5D639C]",
        "shadow-[0_5px_18px_rgba(103,108,188,0.10),inset_0_1px_0_rgba(255,255,255,0.52),inset_0_-1px_0_rgba(92,98,164,0.05)]",
        "dark:bg-[#B7B0FF]/[0.10] dark:border-[#C1BBFF]/[0.24] dark:text-[#D8D3FF]",
        "dark:shadow-[0_5px_18px_rgba(120,110,220,0.12),inset_0_1px_0_rgba(255,255,255,0.14)]",
      ]
    );

  return (
    <header className="mb-2 flex w-full items-center justify-between gap-4 px-2 py-1 sm:px-4">
      <div className="flex-1">
        {!isSearchPage && (
          <form onSubmit={handleSearch} className="relative w-full max-w-sm">
            <div className="relative flex items-center rounded-full bg-white/60 dark:bg-dark-2/50 border border-gray-200/80 dark:border-white/10 px-3 py-2 shadow-sm backdrop-blur-md transition-all focus-within:ring-2 focus-within:ring-primary/30">
              <Search className="h-4 w-4 text-gray-400 shrink-0 ml-1" />
              <input
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent px-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none"
              />
            </div>
          </form>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/settings"
          title="Settings"
          className={getGlassButtonClass(pathname === "/dashboard/settings")}
        >
          <Settings className="h-4 w-4 text-gray-600 dark:text-gray-300 transition-transform duration-300 group-hover:rotate-45" />
        </Link>

        <div className="h-8 w-px bg-gray-200/50 dark:bg-white/10" />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 rounded-full border border-transparent p-1 transition-all hover:bg-white/50 hover:border-gray-200/50 dark:hover:bg-white/5 dark:hover:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <div className="hidden flex-col items-end sm:flex text-right">
              <span className="text-sm font-semibold text-gray-800 dark:text-white">
                {session.user.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                {session.user.email}
              </span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20 overflow-hidden relative shadow-sm border border-primary/20">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt="Avatar"
                  width={40}
                  height={40}
                  unoptimized
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-[#1C1C1E] shadow-lg border border-gray-100 dark:border-white/10 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10 sm:hidden">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{session.user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
