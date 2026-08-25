"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { playfair } from "@/lib/fonts";
import { apiUrl } from "@/lib/api";
import { GoogleIcon } from "@/components/icons/GoogleIcon";

export function LoginForm() {
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = () => {
    if (!apiUrl) {
      toast.error("Configuration error: API URL is not set.");
      return;
    }

    setGoogleLoading(true);
    try {
      window.location.href = `${apiUrl}/api/auth/google`;
    } catch (err) {
      setGoogleLoading(false);
      toast.error("Failed to redirect to Google authentication.");
    }
  };

  return (
    <div className="min-h-dvh flex bg-brand-cream lg:border-t lg:border-brand-lightGray/30 items-center justify-center font-sans">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000 p-6 sm:p-0">
        <div className="mb-12 text-center">
          <h1
            className={`text-5xl tracking-tight mb-4 text-brand-nearBlack ${playfair.className}`}
          >
            Welcome <span className="italic opacity-90">Back.</span>
          </h1>
          <p className="text-brand-warmGray text-sm md:text-base font-light tracking-wide">
            Please sign in to access the portal.
          </p>
        </div>

        <div className="w-full flex justify-center mt-8">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            aria-busy={googleLoading}
            aria-label="Sign in with Google"
            className="w-full bg-brand-softPeriwinkle text-white transition-all duration-500 px-12 py-4 rounded-full text-xs font-semibold uppercase tracking-[0.2em] relative overflow-hidden group/btn shadow-[0_4px_20px_rgba(142,148,242,0.3)] hover:shadow-[0_6px_25px_rgba(159,160,255,0.4)] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="relative z-10 flex items-center justify-center gap-4">
              <GoogleIcon />
              {googleLoading ? "Signing in..." : "Sign in with Google"}
            </span>
            <div className="absolute inset-0 h-full w-0 bg-brand-wisteriaBlue transition-all duration-500 ease-out group-hover/btn:w-full z-0"></div>
          </button>
        </div>
        
        <div className="flex justify-center mt-8">
          <Link
            href="/auth/signup"
            className="text-[12px] uppercase tracking-wider text-brand-lavenderGrey hover:text-brand-softPeriwinkle transition-colors focus-visible:outline-brand-softPeriwinkle"
          >
            Don&apos;t have an account? Sign Up
          </Link>
        </div>

        {/* Development Only Bypasser */}
        {process.env.NODE_ENV === "development" && (
          <div className="flex justify-center mt-6">
            <Link
              href="/dashboard"
              className="text-[10px] uppercase tracking-wider text-muted-foreground/50 hover:text-primary transition-colors border-b border-transparent hover:border-primary pb-0.5"
            >
              Skip to Dashboard (Dev Mode)
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
