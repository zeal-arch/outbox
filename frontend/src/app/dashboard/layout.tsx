import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";

export const metadata: Metadata = {
  title: {
    template: "%s | ReachInbox",
    default: "ReachInbox Dashboard",
  },
  description: "A modern email outreach dashboard.",
};

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <div data-admin-layout className="font-satoshi relative flex h-screen w-full overflow-hidden bg-linear-to-br from-[#e0e5ff] to-[#f3e7e9] dark:from-[#0B1425] dark:to-[#1A1A2E]">
    
    {/* Dreamy Pastel Lilac/Purple Mesh Gradient */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#f8f6fc] dark:bg-[#1a112c]">
      <div className="absolute -left-[10%] -top-[10%] h-[70%] w-[70%] rounded-full bg-primary/25 blur-[150px] dark:bg-primary/20" />
      <div className="absolute top-[20%] -right-[10%] h-[60%] w-[50%] rounded-full bg-fuchsia-300/20 blur-[130px] dark:bg-fuchsia-600/20" />
      <div className="absolute -bottom-[20%] left-[20%] h-[70%] w-[60%] rounded-full bg-[#d0bdf4]/35 blur-[160px] dark:bg-primary/20" />
    </div>

    {/* Sidebar */}
    <div className="relative z-10 hidden sm:flex">
      <AppSidebar />
    </div>

    {/* Main Application Window (Dreamy Glass Panel) */}
    <div className="relative z-10 flex flex-1 flex-col overflow-hidden p-4 sm:py-6 sm:pr-6 sm:pl-0">
      <AppHeader />
      <main className="flex h-full w-full flex-col overflow-y-auto rounded-[2.5rem] border-2 border-white/80 bg-white/50 px-4 py-4 shadow-[0_8px_40px_rgb(142,148,242,0.15)] backdrop-blur-2xl custom-scrollbar dark:border-white/10 dark:bg-black/20 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        <div className="w-full h-full">
          {children}
        </div>
      </main>
    </div>

    </div>
  );
}
