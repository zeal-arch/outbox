"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setIsCollapsed: (collapsed: boolean) => void;
  isComposeOpen: boolean;
  setIsComposeOpen: (isOpen: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isComposeOpen, setIsComposeOpenState] = useState(false);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

  // Sync state with URL hash on mount & hash change
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === "#compose") {
        setIsComposeOpenState(true);
      } else {
        setIsComposeOpenState(false);
      }
    };

    checkHash();
    window.addEventListener("hashchange", checkHash);
    window.addEventListener("popstate", checkHash);

    return () => {
      window.removeEventListener("hashchange", checkHash);
      window.removeEventListener("popstate", checkHash);
    };
  }, []);

  const setIsComposeOpen = (isOpen: boolean) => {
    setIsComposeOpenState(isOpen);
    if (typeof window !== "undefined") {
      if (isOpen) {
        if (window.location.hash !== "#compose") {
          window.history.pushState(null, "", "#compose");
        }
      } else {
        if (window.location.hash === "#compose") {
          window.history.pushState(null, "", window.location.pathname + window.location.search);
        }
      }
    }
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, setIsCollapsed, isComposeOpen, setIsComposeOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

