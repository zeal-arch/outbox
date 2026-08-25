import type { ReactNode } from "react";
import { Header } from "./Header";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-neutral-50">
      <Header />
      <section className="mx-auto max-w-6xl px-6 py-6">{children}</section>
    </main>
  );
}
