import { Suspense } from "react";
import { SignupForm } from "./SignupForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | ReachInbox Scheduler",
  description: "Create an account to start scheduling your emails.",
};

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-brand-cream">
          <div className="w-8 h-8 rounded-full border-2 border-brand-mauve/30 border-t-brand-softPeriwinkle animate-spin" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
