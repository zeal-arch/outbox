"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Send, Heart, Moon, Sun, TrendingUp, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", icon: Inbox, label: "Inbox" },
  { href: "/dashboard/sent", icon: Send, label: "Sent" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  const getGlassButtonClass = (isActive: boolean) =>
    cn(
      "group relative isolate flex h-10 w-10 items-center justify-center",
      "overflow-hidden rounded-full",
      "transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out",
      "backdrop-blur-[22px] backdrop-saturate-[170%]",
      "bg-white/[0.075]",
      "border border-white/[0.38]",
      "shadow-[0_4px_16px_rgba(72,76,125,0.08),inset_0_1px_0_rgba(255,255,255,0.45)]",
      "before:pointer-events-none before:absolute before:inset-0 before:rounded-full",
      "before:bg-gradient-to-b before:from-white/[0.20] before:to-transparent",
      "before:opacity-70",
      "after:pointer-events-none after:absolute after:inset-[1px] after:rounded-full",
      "after:border after:border-white/[0.10]",
      "dark:bg-white/[0.045]",
      "dark:border-white/[0.14]",
      "dark:shadow-[0_5px_18px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.12)]",
      "dark:before:from-white/[0.10]",
      "dark:after:border-white/[0.05]",
      isActive && [
        "bg-[#9A9FF2]/[0.13]",
        "border-[#A7ABF5]/[0.42]",
        "text-[#5D639C]",
        "shadow-[0_5px_18px_rgba(103,108,188,0.10),inset_0_1px_0_rgba(255,255,255,0.52),inset_0_-1px_0_rgba(92,98,164,0.05)]",
        "dark:bg-[#B7B0FF]/[0.10]",
        "dark:border-[#C1BBFF]/[0.24]",
        "dark:text-[#D8D3FF]",
        "dark:shadow-[0_5px_18px_rgba(120,110,220,0.12),inset_0_1px_0_rgba(255,255,255,0.14)]",
      ]
    );

  return (
    <aside className="relative flex h-full w-20 flex-col items-center py-8">
      <div className="absolute top-8 flex flex-col items-center">
      </div>

      <nav className="my-auto flex flex-col items-center gap-4">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              className={getGlassButtonClass(isActive)}
            >
              <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-8 flex flex-col items-center gap-4">
        {mounted && (
          <button
            onClick={() => {
              const newTheme = resolvedTheme === "light" ? "dark" : "light";
              setTheme(newTheme);
            }}
            title="Toggle Theme"
            aria-label="Toggle Theme"
            className={getGlassButtonClass(false)}
          >
            {resolvedTheme === "light" ? (
              <Moon className="h-5 w-5 text-gray-700 transition-transform duration-300 group-hover:-rotate-12" />
            ) : (
              <Sun className="h-5 w-5 text-amber-300 transition-transform duration-300 group-hover:rotate-45" />
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
