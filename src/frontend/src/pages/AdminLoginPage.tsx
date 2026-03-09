import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Settings, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

// Simple hardcoded admin credentials
// Username: admin
// Password: alvra2025
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "alvra2025";
const ADMIN_SESSION_KEY = "alvra_admin_session";

export function isAdminLoggedIn(): boolean {
  try {
    return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

export function adminLogout() {
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // ignore
  }
}

interface AdminLoginPageProps {
  onSuccess: () => void;
  onNavigate: (path: string) => void;
}

export default function AdminLoginPage({
  onSuccess,
  onNavigate,
}: AdminLoginPageProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("alvra2025");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      if (
        username.trim().toLowerCase() === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD
      ) {
        try {
          localStorage.setItem(ADMIN_SESSION_KEY, "true");
        } catch {
          // localStorage might be blocked in some browsers
        }
        toast.success("Welcome to the Admin Panel!");
        onSuccess();
      } else {
        setError(
          `Incorrect credentials. Use username: "admin" and password: "alvra2025"`,
        );
        toast.error("Incorrect username or password.");
        setIsLoading(false);
      }
    }, 500);
  };

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

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
        data-ocid="admin_login.panel"
      >
        {/* ── Important Notice Banner ── */}
        <div className="mb-4 bg-gold/10 border-2 border-gold rounded-2xl px-5 py-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-gold" />
            <span className="text-gold font-bold text-sm uppercase tracking-wider">
              ADMIN LOGIN — Website Owner Only
            </span>
          </div>
          <p className="text-xs text-foreground/80">
            This is NOT the customer login. Use username &amp; password below to
            access the admin panel.
          </p>
        </div>

        <div className="bg-card border border-gold-dim rounded-3xl p-8 md:p-10 shadow-gold-lg">
          {/* Logo */}
          <div className="text-center mb-6">
            <button
              type="button"
              onClick={() => onNavigate("/")}
              className="inline-block"
            >
              <h1 className="font-luxury text-3xl font-bold text-gold gold-glow tracking-[0.4em] mb-1">
                ALVRA
              </h1>
            </button>
            <p className="text-muted-foreground text-xs tracking-widest uppercase">
              Admin Panel
            </p>
          </div>

          {/* Credentials Box */}
          <div className="mb-6 bg-obsidian-2 border-2 border-gold rounded-2xl px-5 py-4">
            <p className="text-xs text-gold font-bold mb-3 uppercase tracking-wider text-center">
              Your Login Credentials
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-obsidian-2 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Username</p>
                <p className="text-gold font-mono font-bold text-lg">admin</p>
              </div>
              <div className="bg-obsidian-2 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Password</p>
                <p className="text-gold font-mono font-bold text-lg">
                  alvra2025
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              These fields are pre-filled — just click{" "}
              <span className="text-gold font-semibold">Sign In</span>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <Label
                htmlFor="admin-username"
                className="text-sm text-muted-foreground"
              >
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  placeholder="admin"
                  className="pl-10 bg-background border-gold-dim focus:border-gold text-foreground placeholder:text-muted-foreground"
                  autoComplete="off"
                  data-ocid="admin_login.input"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="admin-password"
                className="text-sm text-muted-foreground"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="alvra2025"
                  className="pl-10 pr-10 bg-background border-gold-dim focus:border-gold text-foreground placeholder:text-muted-foreground"
                  autoComplete="off"
                  data-ocid="admin_login.password.input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors"
                  data-ocid="admin_login.show_password.toggle"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="bg-red-950/50 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300"
                data-ocid="admin_login.error_state"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !username || !password}
              size="lg"
              className="w-full bg-gold text-obsidian font-bold text-base py-6 hover:bg-gold-bright transition-all hover:scale-[1.02] shadow-gold disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              data-ocid="admin_login.submit_button"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-obsidian/40 border-t-obsidian rounded-full animate-spin" />
                  Signing In...
                </span>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Sign In to Admin Panel
                </>
              )}
            </Button>
          </form>

          {/* Back to store */}
          <div className="mt-5 pt-5 border-t border-border text-center space-y-2">
            <button
              type="button"
              onClick={() => onNavigate("/")}
              className="block w-full text-xs text-muted-foreground hover:text-gold transition-colors"
              data-ocid="admin_login.back.link"
            >
              ← Back to Store
            </button>
            <p className="text-xs text-muted-foreground/60">
              Looking for the customer login?{" "}
              <button
                type="button"
                onClick={() => onNavigate("/login")}
                className="text-gold hover:text-gold-bright transition-colors underline underline-offset-2"
                data-ocid="admin_login.customer_login.link"
              >
                Sign in here
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
