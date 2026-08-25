"use client";

import { ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { LayoutGroup } from "motion/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider } from "./AuthProvider";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Root-level provider wrapper.
 * Add global providers (theme, auth, toast, smooth-scroll, etc.) here
 * so the root layout stays clean.
 */
export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ReactLenis root options={{ autoRaf: true }}>
        <LayoutGroup>
          <AuthProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </AuthProvider>
        </LayoutGroup>
      </ReactLenis>
    </ThemeProvider>
  );
}
