"use client";

import { useRouter } from "next/navigation";
import { Search, Filter, RefreshCw, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import Button from "@/components/ui/Button";

export function AppHeader() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [localQuery, setLocalQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      toast.info("Search functionality is a premium feature coming soon!");
      setLocalQuery("");
    }
  };

  const handleRefresh = () => {
    toast.success("Refreshing data...");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-10 flex min-w-0 shrink-0 items-center justify-between border-b border-stroke bg-white px-4 py-3 dark:border-stroke-dark dark:bg-gray-dark md:px-6 font-satoshi">
      {/* Left Area: Search & Actions */}
      <div className="flex items-center gap-3 w-full max-w-xl">
        <div className="relative flex-1">
          <form onSubmit={handleSearch}>
            <input
              type="search"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-xl border-none bg-[#F5F7F9] py-2 pl-9 pr-4 text-sm text-dark outline-none transition-colors focus:ring-1 focus:ring-primary dark:bg-dark-2 dark:text-white"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </form>
        </div>
        
        <Button variant="unstyled" size="none" onClick={() => toast.info("Filter settings coming soon!")} className="p-2 text-gray-400 hover:text-gray-600 transition-colors dark:hover:text-gray-300">
          <Filter className="h-4 w-4" />
        </Button>
        <Button variant="unstyled" size="none" onClick={handleRefresh} className="p-2 text-gray-400 hover:text-gray-600 transition-colors dark:hover:text-gray-300">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="unstyled"
            size="none"
            onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
            aria-label="Toggle Theme"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stroke bg-white text-dark-4 transition-colors hover:bg-gray-2 dark:border-stroke-dark dark:bg-dark-2 dark:text-dark-6 dark:hover:bg-dark-3"
          >
            {resolvedTheme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4 text-amber-400" />
            )}
          </Button>
        )}
      </div>
    </header>
  );
}
