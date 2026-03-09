import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const { login, isLoggingIn, isLoginSuccess, isInitializing, identity } =
    useInternetIdentity();

  // Redirect when login succeeds
  useEffect(() => {
    if (isLoginSuccess && identity) {
      onNavigate("/");
    }
  }, [isLoginSuccess, identity, onNavigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 40%, oklch(0.65 0.13 20 / 0.06) 0%, transparent 70%)",
        }}
      />
      {/* Grain texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
        data-ocid="login.panel"
      >
        {/* Card */}
        <div className="bg-card border border-gold-dim rounded-3xl p-8 md:p-10 shadow-gold-lg">
          {/* Logo */}
          <div className="text-center mb-10">
            <button
              type="button"
              onClick={() => onNavigate("/")}
              className="inline-block"
            >
              <h1 className="font-luxury text-4xl font-bold text-gold gold-glow tracking-[0.4em] mb-2">
                ALVRA
              </h1>
            </button>
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-px w-12 bg-gold-dim" />
              <Sparkles className="w-3 h-3 text-gold" />
              <div className="h-px w-12 bg-gold-dim" />
            </div>
            <p className="text-muted-foreground text-sm tracking-widest uppercase">
              Premium Fragrances
            </p>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Welcome Back
            </h2>
            <p className="text-muted-foreground text-sm">
              Sign in to your ALVRA account
            </p>
          </div>

          {/* Login button */}
          <div className="space-y-4">
            <Button
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              size="lg"
              className="w-full bg-gold text-obsidian font-bold text-base py-6 hover:bg-gold-bright transition-all hover:scale-[1.02] shadow-gold disabled:opacity-60 disabled:cursor-not-allowed"
              data-ocid="login.submit_button"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-obsidian/40 border-t-obsidian rounded-full animate-spin" />
                  Connecting...
                </span>
              ) : (
                "Sign In with Internet Identity"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Internet Identity is a secure, privacy-first authentication system
              — no passwords needed.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-muted-foreground text-xs">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-muted-foreground">
            New to ALVRA?{" "}
            <button
              type="button"
              onClick={() => onNavigate("/signup")}
              className="text-gold hover:text-gold-bright transition-colors font-medium underline-offset-2 hover:underline"
              data-ocid="login.signup.link"
            >
              Create an account
            </button>
          </p>

          {/* Back to store */}
          <div className="mt-6 text-center space-y-2">
            <button
              type="button"
              onClick={() => onNavigate("/")}
              className="block w-full text-xs text-muted-foreground hover:text-gold transition-colors"
              data-ocid="login.back.link"
            >
              ← Back to Store
            </button>
            <p className="text-xs text-muted-foreground/60">
              Website owner?{" "}
              <button
                type="button"
                onClick={() => onNavigate("/admin")}
                className="text-gold hover:text-gold-bright transition-colors underline underline-offset-2"
                data-ocid="login.admin.link"
              >
                Go to Admin Panel
              </button>
            </p>
          </div>
        </div>

        {/* Corner ornaments */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-gold-dim rounded-tl-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-gold-dim rounded-br-3xl pointer-events-none" />
      </motion.div>
    </div>
  );
}
