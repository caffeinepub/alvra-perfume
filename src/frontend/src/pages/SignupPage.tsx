import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerProfile, useSaveCallerProfile } from "../hooks/useQueries";

interface SignupPageProps {
  onNavigate: (path: string) => void;
}

export default function SignupPage({ onNavigate }: SignupPageProps) {
  const { login, isLoggingIn, isLoginSuccess, isInitializing, identity } =
    useInternetIdentity();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const saveProfile = useSaveCallerProfile();
  const { data: existingProfile } = useGetCallerProfile();

  // If already logged in and profile exists, redirect to home
  useEffect(() => {
    if (identity && existingProfile?.name) {
      onNavigate("/");
    }
  }, [identity, existingProfile, onNavigate]);

  // After login, prompt to save profile
  const isLoggedInNeedingProfile =
    isLoginSuccess && identity && !existingProfile?.name && !profileSaved;

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setNameError("Please enter your name");
      return;
    }
    setNameError("");
    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      setProfileSaved(true);
      toast.success("Account created! Welcome to ALVRA.");
      onNavigate("/");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 40%, oklch(0.78 0.13 75 / 0.07) 0%, transparent 70%)",
        }}
      />
      {/* Grain */}
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
        data-ocid="signup.panel"
      >
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
              {isLoggedInNeedingProfile
                ? "Complete Your Profile"
                : "Create Account"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isLoggedInNeedingProfile
                ? "Just one more step to finish setting up"
                : "Join ALVRA and discover premium fragrances"}
            </p>
          </div>

          {isLoggedInNeedingProfile ? (
            /* Profile completion form */
            <div className="space-y-5" data-ocid="signup.profile.panel">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-foreground text-sm font-medium"
                >
                  Your Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveProfile();
                  }}
                  className="bg-background border-border focus:border-gold text-foreground placeholder:text-muted-foreground"
                  data-ocid="signup.name.input"
                  aria-describedby={nameError ? "name-error" : undefined}
                />
                {nameError && (
                  <p
                    id="name-error"
                    className="text-destructive text-xs"
                    data-ocid="signup.name.error_state"
                  >
                    {nameError}
                  </p>
                )}
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={saveProfile.isPending}
                size="lg"
                className="w-full bg-gold text-obsidian font-bold text-base py-6 hover:bg-gold-bright transition-all hover:scale-[1.02] shadow-gold disabled:opacity-60"
                data-ocid="signup.submit_button"
              >
                {saveProfile.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Complete Sign Up"
                )}
              </Button>
            </div>
          ) : (
            /* Initial sign up step */
            <div className="space-y-4">
              <Button
                onClick={login}
                disabled={isLoggingIn || isInitializing}
                size="lg"
                className="w-full bg-gold text-obsidian font-bold text-base py-6 hover:bg-gold-bright transition-all hover:scale-[1.02] shadow-gold disabled:opacity-60"
                data-ocid="signup.identity_button"
              >
                {isLoggingIn ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-obsidian/40 border-t-obsidian rounded-full animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  "Continue with Internet Identity"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                A secure, password-free authentication system by the Internet
                Computer.
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-muted-foreground text-xs">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => onNavigate("/login")}
              className="text-gold hover:text-gold-bright transition-colors font-medium underline-offset-2 hover:underline"
              data-ocid="signup.login.link"
            >
              Sign in
            </button>
          </p>

          {/* Back to store */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => onNavigate("/")}
              className="text-xs text-muted-foreground hover:text-gold transition-colors"
              data-ocid="signup.back.link"
            >
              ← Back to Store
            </button>
          </div>
        </div>

        {/* Corner ornaments */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-gold-dim rounded-tl-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-gold-dim rounded-br-3xl pointer-events-none" />
      </motion.div>
    </div>
  );
}
