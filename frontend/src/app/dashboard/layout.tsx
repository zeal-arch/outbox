import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";

export const metadata: Metadata = {
  title: {
    template: "%s | ReachInbox",
    default: "ReachInbox Dashboard",
  },
  description: "A modern email outreach dashboard.",
};

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <div data-admin-layout className="font-satoshi flex h-screen w-full overflow-hidden bg-white dark:bg-gray-dark">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content Area */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden dark:text-gray-300">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
