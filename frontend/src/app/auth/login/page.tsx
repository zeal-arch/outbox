import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | ReachInbox Scheduler",
  description: "Sign in to access your dashboard.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-brand-cream">
          <div className="w-8 h-8 rounded-full border-2 border-brand-mauve/30 border-t-brand-softPeriwinkle animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
