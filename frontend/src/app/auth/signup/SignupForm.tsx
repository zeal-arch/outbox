"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";

export function SignupForm() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
    } catch (err: any) {
      setGoogleLoading(false);
      toast.error(err.message || "Failed to redirect to Google authentication.");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    // Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address (e.g., name@gmail.com)");
      return;
    }

    // Password Strength Validation (at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error("Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, a number, and a special symbol.");
      return;
    }
    
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign up");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex bg-white items-center justify-center font-sans">
      <div className="w-full max-w-[440px] rounded-xl border border-gray-100 p-8 sm:p-10 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
        <h1 className="text-[32px] font-semibold text-center text-[#111111] mb-8">
          Sign Up
        </h1>

        <Button
          variant="unstyled" size="none"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || emailLoading}
          aria-busy={googleLoading}
          aria-label="Sign up with Google"
          className="w-full flex items-center justify-center gap-3 bg-[#E9F6ED] hover:bg-[#dcf0e2] text-[#111111] transition-colors duration-200 px-4 py-3.5 rounded-lg font-medium text-[15px] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          <GoogleIcon className="w-5 h-5" />
          {googleLoading ? "Signing up..." : "Sign up with Google"}
        </Button>

        <div className="flex items-center my-7 gap-4">
          <div className="h-[1px] bg-gray-100 flex-1"></div>
          <Link 
            href="/auth/login"
            className="text-[#A1A1A1] hover:text-[#555] transition-colors text-[13px] font-medium tracking-wide"
          >
            or login with email
          </Link>
          <div className="h-[1px] bg-gray-100 flex-1"></div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@gmail.com" 
              required
              className="w-full bg-[#F5F5F5] text-gray-900 text-[15px] px-4 py-3.5 rounded-lg outline-none focus:ring-1 focus:ring-gray-300 transition-all placeholder:text-[#A1A1A1]"
            />
          </div>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min. 8 characters)" 
              required
              className="w-full bg-[#F5F5F5] text-gray-900 text-[15px] px-4 py-3.5 pr-12 rounded-lg outline-none focus:ring-1 focus:ring-gray-300 transition-all placeholder:text-[#A1A1A1]"
            />
            <Button
              variant="unstyled" size="none"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </Button>
          </div>

          
          <Button
            variant="creative-liquid"
            type="submit"
            disabled={emailLoading || googleLoading}
            className="w-full mt-2 text-[15px] rounded-lg"
          >
            {emailLoading ? "Please wait..." : "Sign Up"}
          </Button>
        </form>
      </div>
    </div>
  );
}
