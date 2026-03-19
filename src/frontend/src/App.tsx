import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Award,
  CheckCircle2,
  ChevronDown,
  Clock,
  Heart,
  Instagram,
  Leaf,
  LogIn,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Star,
  User,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import React, { createContext, useContext } from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DinoGame, DinoGameModal } from "./components/DinoGame";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useAddToCart,
  useGetCart,
  useInitializeProducts,
  useIsAdmin,
} from "./hooks/useQueries";
import AdminPage from "./pages/AdminPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SignupPage from "./pages/SignupPage";
import { onContentUpdate, readAll } from "./utils/contentStore";

// ─── Simple client-side router (hash-based for ICP hosting compatibility) ────
function readHashPath(): string {
  const hash = window.location.hash;
  if (hash.startsWith("#/")) return hash.slice(1);
  if (hash === "#" || hash === "") return "/";
  if (hash.startsWith("#")) return `/${hash.slice(1)}`;
  return "/";
}

function useRouter() {
  const [path, setPath] = useState<string>(readHashPath);

  useEffect(() => {
    setPath(readHashPath());
    const handleChange = () => setPath(readHashPath());
    window.addEventListener("popstate", handleChange);
    window.addEventListener("hashchange", handleChange);
    return () => {
      window.removeEventListener("popstate", handleChange);
      window.removeEventListener("hashchange", handleChange);
    };
  }, []);

  const navigate = (to: string) => {
    window.location.hash = to;
    setPath(to);
    window.scrollTo({ top: 0 });
  };

  return { path, navigate };
}

// ─── Fade-in wrapper ─────────────────────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Section Heading ───────────────────────────────────────────────────────────────────
function SectionHeading({
  title,
  subtitle,
}: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-14">
      <h2 className="font-display text-4xl md:text-5xl font-bold text-gold mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          {subtitle}
        </p>
      )}
      <div className="flex items-center justify-center gap-3 mt-5">
        <div className="h-0.5 w-20 rounded-full bg-gold" />
        <div className="w-2 h-2 rounded-full bg-gold" />
        <div className="h-0.5 w-20 rounded-full bg-gold" />
      </div>
    </div>
  );
}

// ─── Products data (with content map overrides) ─────────────────────────────────────────────────
function getProducts(cm: Record<string, string> = readAll()) {
  const BASE = [
    {
      id: 1n,
      name: "Men Formal",
      description:
        "A crisp, woody fragrance with notes of cedar & musk — perfect for boardrooms and formal events.",
      price: "₹799",
      image: "/assets/generated/men-formal.dim_400x500.png",
      tag: "Bestseller",
      category: "Formal",
    },
    {
      id: 2n,
      name: "Men Party",
      description:
        "Bold & intense with hints of oud and spice — made for nights you'll never forget.",
      price: "₹799",
      image: "/assets/generated/men-party.dim_400x500.png",
      tag: "New",
      category: "Party",
    },
    {
      id: 3n,
      name: "Women Formal",
      description:
        "Delicate floral notes of rose & jasmine — elegance in every spritz.",
      price: "₹799",
      image: "/assets/generated/women-formal.dim_400x500.png",
      tag: "Popular",
      category: "Formal",
    },
    {
      id: 4n,
      name: "Women Party",
      description:
        "Sensual and alluring with vanilla & amber — captivate every room you enter.",
      price: "₹799",
      image: "/assets/generated/women-party.dim_400x500.png",
      tag: "Limited",
      category: "Party",
    },
  ];
  return BASE.map((p, i) => ({
    ...p,
    name: cm[`product.${i + 1}.name`] ?? p.name,
    description: cm[`product.${i + 1}.desc`] ?? p.description,
    price: cm[`product.${i + 1}.price`] ?? p.price,
    image: cm[`product.${i + 1}.image`] ?? p.image,
  }));
}

// ─── Banner ticker items ───────────────────────────────────────────────────────────────────────
const _TICKER_ITEMS = [
  {
    icon: "🎉",
    text: "Launch Offer: Get ALVRA for just ₹199 today!",
    sub: "Limited time",
  },
  {
    icon: "💳",
    text: "Buy Now, Pay Later — ₹199 today, rest weekly",
    sub: "Easy EMI",
  },
  {
    icon: "🎮",
    text: "Play Dino Game & Win up to FREE Perfume!",
    sub: "Play & Win",
  },
  {
    icon: "🌸",
    text: "Free Flower Seeds Gift with every order",
    sub: "Special Gift",
  },
  {
    icon: "✨",
    text: "Premium ingredients. Long lasting fragrance.",
    sub: "ALVRA Promise",
  },
  {
    icon: "🎮🌸",
    text: "Play Dino & Win a FREE Perfume!",
    sub: "Win Now",
  },
  {
    icon: "📦",
    text: "Free mini travel spray with every purchase",
    sub: "Bundle Offer",
  },
];

// ─── Custom Sectors types ───────────────────────────────────────────────────────────────────────
type CustomSector = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  style: string;
  image?: string;
};

const SECTOR_STYLE_MAP: Record<
  string,
  { bg: string; text: string; sub: string; border: string; badge: string }
> = {
  Minimal: {
    bg: "bg-white",
    text: "text-gray-900",
    sub: "text-gray-500",
    border: "border border-gray-200",
    badge: "bg-gray-100 text-gray-700",
  },
  Bold: {
    bg: "bg-gray-950",
    text: "text-white",
    sub: "text-yellow-400",
    border: "border border-yellow-500",
    badge: "bg-yellow-500 text-black",
  },
  Elegant: {
    bg: "bg-amber-50",
    text: "text-amber-900 font-semibold",
    sub: "text-amber-700",
    border: "border border-amber-300",
    badge: "bg-amber-200 text-amber-900",
  },
  "Dark Luxury": {
    bg: "bg-zinc-950",
    text: "text-amber-300",
    sub: "text-amber-200/70",
    border: "border border-amber-700/50",
    badge: "bg-amber-700/30 text-amber-300",
  },
  Floral: {
    bg: "bg-pink-50",
    text: "text-rose-800",
    sub: "text-rose-600",
    border: "border border-pink-200",
    badge: "bg-pink-200 text-rose-800",
  },
  Fresh: {
    bg: "bg-teal-50",
    text: "text-teal-900",
    sub: "text-teal-600",
    border: "border border-teal-200",
    badge: "bg-teal-200 text-teal-800",
  },
};

function CustomSectorsSection() {
  const [sectors, setSectors] = React.useState<CustomSector[]>([]);

  React.useEffect(() => {
    const cm = readAll();
    if (cm["custom.sectors"]) {
      try {
        const parsed = JSON.parse(cm["custom.sectors"]) as CustomSector[];
        if (Array.isArray(parsed)) setSectors(parsed);
      } catch {
        /* ignore */
      }
    }
    const unsub = onContentUpdate(() => {
      const cm2 = readAll();
      if (cm2["custom.sectors"]) {
        try {
          const parsed = JSON.parse(cm2["custom.sectors"]) as CustomSector[];
          if (Array.isArray(parsed)) setSectors(parsed);
        } catch {
          /* ignore */
        }
      }
    });
    return unsub;
  }, []);

  if (sectors.length === 0) return null;

  return (
    <section className="py-24 bg-obsidian-2" data-ocid="custom.sectors.section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeading
            title="Our Perfume Collections"
            subtitle="Curated collections for every personality and occasion."
          />
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectors.map((sector, i) => {
            const styles =
              SECTOR_STYLE_MAP[sector.style] ?? SECTOR_STYLE_MAP.Minimal;
            return (
              <FadeIn key={sector.id} delay={i * 0.1}>
                <div
                  className={`rounded-2xl overflow-hidden shadow-lg ${styles.bg} ${styles.border} flex flex-col`}
                  data-ocid={`custom.sectors.item.${i + 1}`}
                >
                  {sector.image && (
                    <div className="w-full aspect-video overflow-hidden">
                      <img
                        src={sector.image}
                        alt={sector.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 flex flex-col gap-2 flex-1">
                    <span
                      className={`self-start text-xs font-bold px-2 py-0.5 rounded-full ${styles.badge}`}
                    >
                      {sector.style}
                    </span>
                    <h3 className={`text-xl font-bold ${styles.text}`}>
                      {sector.name}
                    </h3>
                    <p className={`text-sm ${styles.sub}`}>{sector.tagline}</p>
                    {sector.price && (
                      <p
                        className={`text-lg font-bold mt-auto pt-3 ${styles.text}`}
                      >
                        {sector.price}
                      </p>
                    )}
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────────────────────
function Header({
  cartCount,
  onNavigate,
}: {
  cartCount: number;
  onNavigate: (path: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { identity, clear } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const navLinks = [
    { label: "Home", id: "home" },
    { label: "Shop", id: "shop" },
    { label: "Play & Win", id: "play-win" },
    { label: "Offers", id: "offers" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <>
      <header
        data-ocid="header.section"
        className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-border shadow-xs"
      >
        <div className="flex items-center justify-between px-4 h-14">
          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
            data-ocid="header.menu_button"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Centered ALVRA logo */}
          <button
            type="button"
            onClick={() => onNavigate("/")}
            className="absolute left-1/2 -translate-x-1/2 font-luxury font-black text-2xl tracking-[0.3em] text-gold hover:opacity-80 transition-opacity"
            data-ocid="header.logo.link"
          >
            ALVRA
          </button>

          {/* Right: search + cart */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
              aria-label="Search"
              data-ocid="header.search.button"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("/profile")}
              className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
              aria-label="Profile"
              data-ocid="header.profile.button"
            >
              <User className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("/cart")}
              className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors relative"
              aria-label="Cart"
              data-ocid="header.cart.button"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white shadow-xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-luxury font-black text-xl tracking-[0.3em] text-gold">
                  ALVRA
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  data-ocid="header.menu.close_button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {navLinks.map((link) => (
                  <button
                    type="button"
                    key={link.id}
                    onClick={() => scrollTo(link.id)}
                    className="w-full text-left px-4 py-3 rounded-xl text-foreground font-semibold hover:bg-muted hover:text-gold transition-colors"
                    data-ocid={`nav.${link.id}.link`}
                  >
                    {link.label}
                  </button>
                ))}
                <div className="pt-3 border-t border-border mt-3">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate("/admin");
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl text-gold font-semibold hover:bg-muted transition-colors flex items-center gap-2"
                      data-ocid="nav.admin.link"
                    >
                      <Settings className="w-4 h-4" />
                      Admin Panel
                    </button>
                  )}
                  {identity ? (
                    <button
                      type="button"
                      onClick={() => {
                        clear();
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl text-destructive font-semibold hover:bg-destructive/10 transition-colors flex items-center gap-2"
                      data-ocid="nav.logout.button"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate("/login");
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl text-foreground font-semibold hover:bg-muted transition-colors flex items-center gap-2"
                      data-ocid="nav.login.link"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </button>
                  )}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── useContent hook ──────────────────────────────────────────────────────────────────────
function useContent() {
  const [cm, setCm] = useState<Record<string, string>>(() => readAll());
  useEffect(() => {
    const refresh = () => setCm(readAll());
    const unsub = onContentUpdate(refresh);
    return unsub;
  }, []);
  return cm;
}

const ContentContext = createContext<Record<string, string>>({});

// ─── Promo Slider (top banner, auto-advances every 5s) ──────────────────────────────────
const PROMO_SLIDES = [
  {
    id: "delivery",
    icon: "🚚",
    text: "Free Delivery on All Orders",
    sub: "No Minimum Order",
    bg: "oklch(0.42 0.16 175)",
    highlight: true,
    link: null,
  },
  {
    id: "dino",
    icon: "🎮",
    text: "Play Dino Game & Win a FREE Perfume!",
    sub: "Tap to Play Now",
    bg: "oklch(0.38 0.18 280)",
    highlight: true,
    link: "#play-win",
  },
  {
    id: "launch",
    icon: "🎉",
    text: "Launch Offer: Get ALVRA for just ₹199 today!",
    sub: "Limited Time",
    bg: "oklch(0.52 0.17 186)",
    highlight: false,
    link: null,
  },
  {
    id: "emi",
    icon: "💳",
    text: "Easy EMI — Pay ₹199 today, rest in easy instalments",
    sub: "No Cost EMI",
    bg: "oklch(0.46 0.15 205)",
    highlight: false,
    link: null,
  },
  {
    id: "gift",
    icon: "🌸",
    text: "Free Flower Seeds Gift with every order!",
    sub: "Special Offer",
    bg: "oklch(0.52 0.14 340)",
    highlight: false,
    link: null,
  },
  {
    id: "travel",
    icon: "📦",
    text: "Free mini travel spray with every purchase",
    sub: "Bundle Offer",
    bg: "oklch(0.48 0.13 160)",
    highlight: false,
    link: null,
  },
];

function PromoTicker() {
  const handleDinoClick = () => {
    const el = document.querySelector("#play-win");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const items = [...PROMO_SLIDES, ...PROMO_SLIDES]; // duplicate for seamless loop

  return (
    <div
      data-ocid="ticker.section"
      className="w-full overflow-hidden border-b border-border"
      style={{
        background:
          "linear-gradient(90deg, oklch(0.22 0.08 220), oklch(0.28 0.12 186), oklch(0.22 0.08 220))",
      }}
    >
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-scroll 28s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="flex items-center py-2 overflow-hidden">
        {/* Left label */}
        <div className="flex-shrink-0 px-3 border-r border-white/20 mr-2">
          <span className="text-teal-300 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
            LIVE
          </span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-track">
            {items.map((s, i) => (
              <span
                key={`${s.id}-${i}`}
                onClick={s.link ? handleDinoClick : undefined}
                onKeyUp={
                  s.link
                    ? (e) => {
                        if (e.key === "Enter") handleDinoClick();
                      }
                    : undefined
                }
                role={s.link ? "button" : undefined}
                tabIndex={s.link ? 0 : undefined}
                className="flex items-center gap-1.5 px-4 whitespace-nowrap cursor-default"
                style={{ cursor: s.link ? "pointer" : "default" }}
              >
                <span className="text-sm">{s.icon}</span>
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: s.highlight ? "#5eead4" : "rgba(255,255,255,0.9)",
                  }}
                >
                  {s.text}
                </span>
                {s.highlight && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ml-1"
                    style={{ background: "oklch(0.52 0.20 186)" }}
                  >
                    TAP →
                  </span>
                )}
                <span className="text-white/25 mx-2 text-base">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero Carousel ──────────────────────────────────────────────────────────────────────
const CAROUSEL_SLIDES = [
  {
    id: 1,
    image: "/assets/generated/hero-carousel-1.dim_800x600.jpg",
    title: "Floral Elegance",
    subtitle: "New Launch 2025",
    tag: "Bestseller",
    gradient: "from-amber-50/90 via-transparent to-transparent",
  },
  {
    id: 2,
    image: "/assets/generated/hero-carousel-2.dim_800x600.jpg",
    title: "Men's Signature",
    subtitle: "Formal & Party",
    tag: "Top Pick",
    gradient: "from-slate-900/80 via-transparent to-transparent",
  },
  {
    id: 3,
    image: "/assets/generated/hero-carousel-3.dim_800x600.jpg",
    title: "Women's Collection",
    subtitle: "Rose & Bloom",
    tag: "New Arrival",
    gradient: "from-pink-900/70 via-transparent to-transparent",
  },
  {
    id: 4,
    image: "/assets/generated/perfume-hero.dim_800x400.jpg",
    title: "ALVRA Collection",
    subtitle: "Signature Fragrances",
    tag: "New 2025",
    gradient: "from-purple-900/80 via-transparent to-transparent",
  },
];

function HeroCarousel({
  onNavigate: _onNavigate,
}: { onNavigate: (path: string) => void }) {
  const [active, setActive] = useState(0);
  const [showGamePopup, setShowGamePopup] = useState(false);
  const [_autoPlay, setAutoPlay] = useState(false);

  // Auto-advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = CAROUSEL_SLIDES[active];

  return (
    <section
      id="home"
      data-ocid="hero.section"
      className="relative bg-muted overflow-hidden"
    >
      {/* Main image */}
      <div
        className="relative w-full"
        style={{ aspectRatio: "4/3", maxHeight: 420 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="absolute inset-0"
            style={{ cursor: (slide as any).link ? "pointer" : "default" }}
            onClick={() => {
              const lnk = (slide as any).link;
              if (lnk) {
                setShowGamePopup(true);
              }
            }}
          >
            {(slide as any).link ? (
              <div
                className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #0a0a1a 0%, #0d2535 35%, #0a3d2e 65%, #071a12 100%)",
                }}
              >
                <style>{`
                  @keyframes dino-run { 0%,100%{transform:translateY(0) scaleX(1)} 25%{transform:translateY(-8px) scaleX(1)} 50%{transform:translateY(-3px) scaleX(-1)} 75%{transform:translateY(-10px) scaleX(-1)} }
                  @keyframes neon-pulse { 0%,100%{text-shadow:0 0 10px #00ff88,0 0 30px #00ff88,0 0 60px #00cc66} 50%{text-shadow:0 0 20px #00ffaa,0 0 50px #00ffaa,0 0 90px #00ff88} }
                  @keyframes float-cactus { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                  @keyframes cta-pulse { 0%,100%{box-shadow:0 0 12px #00ff88,0 0 24px #00cc66} 50%{box-shadow:0 0 24px #00ffaa,0 0 48px #00ff88} }
                  @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
                  @keyframes score-blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
                `}</style>
                {/* Scanline effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                  <div
                    style={{
                      width: "100%",
                      height: 2,
                      background: "rgba(0,255,136,0.5)",
                      animation: "scanline 3s linear infinite",
                    }}
                  />
                </div>
                {/* Stars */}
                {[
                  "s1",
                  "s2",
                  "s3",
                  "s4",
                  "s5",
                  "s6",
                  "s7",
                  "s8",
                  "s9",
                  "s10",
                  "s11",
                  "s12",
                  "s13",
                  "s14",
                  "s15",
                  "s16",
                  "s17",
                  "s18",
                  "s19",
                  "s20",
                ].map((k, idx) => (
                  <div
                    key={k}
                    className="absolute rounded-full bg-white"
                    style={{
                      width: idx % 3 === 0 ? 3 : 2,
                      height: idx % 3 === 0 ? 3 : 2,
                      top: `${(idx * 17 + 11) % 90}%`,
                      left: `${(idx * 23 + 7) % 95}%`,
                      opacity: 0.4 + (idx % 4) * 0.1,
                    }}
                  />
                ))}
                {/* Floating cacti */}
                {[
                  { id: "c1", top: "15%", left: "8%", delay: "0s" },
                  { id: "c2", top: "65%", left: "5%", delay: "0.8s" },
                  { id: "c3", top: "20%", right: "10%", delay: "0.4s" },
                  { id: "c4", top: "70%", right: "6%", delay: "1.2s" },
                ].map((pos) => (
                  <div
                    key={pos.id}
                    className="absolute text-2xl pointer-events-none"
                    style={{
                      ...(pos as any),
                      animation: "float-cactus 3s ease-in-out infinite",
                      animationDelay: pos.delay,
                      opacity: 0.7,
                    }}
                  >
                    🌵
                  </div>
                ))}
                {/* Pixel ground line */}
                <div
                  className="absolute bottom-8 left-0 right-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, #00ff88, #00cc66, #00ff88, transparent)",
                    opacity: 0.5,
                  }}
                />
                <div className="absolute bottom-6 left-0 right-0 flex justify-around px-8">
                  {["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"].map(
                    (k, i) => (
                      <div
                        key={k}
                        className="w-2 h-2"
                        style={{
                          background: "#00aa55",
                          opacity: 0.3 + (i % 3) * 0.2,
                        }}
                      />
                    ),
                  )}
                </div>
                {/* DINO GAME title */}
                <div className="text-center mb-1 z-10 relative">
                  <div
                    className="font-black tracking-widest text-xs uppercase mb-1"
                    style={{
                      color: "#00ff88",
                      letterSpacing: "0.3em",
                      opacity: 0.8,
                    }}
                  >
                    ⬛ ALVRA PRESENTS ⬛
                  </div>
                  <div
                    className="font-black text-4xl sm:text-5xl uppercase tracking-tight z-10"
                    style={{
                      color: "#00ff88",
                      fontFamily: "monospace",
                      animation: "neon-pulse 2s ease-in-out infinite",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    DINO
                    <br />
                    GAME
                  </div>
                </div>
                {/* Dino emoji */}
                <div
                  className="text-5xl z-10 my-2"
                  style={{ animation: "dino-run 1.8s ease-in-out infinite" }}
                >
                  🦕
                </div>
                {/* Prize text */}
                <div className="z-10 text-center">
                  <div
                    className="font-black text-lg tracking-wide"
                    style={{
                      color: "#ffd700",
                      textShadow: "0 0 15px #ffd700, 0 0 30px #ffaa00",
                    }}
                  >
                    🏆 WIN FREE PERFUME
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    Score high → unlock exclusive coupon
                  </div>
                </div>
                {/* Score */}
                <div
                  className="z-10 mt-1 font-mono text-xs"
                  style={{
                    color: "#00ff88",
                    animation: "score-blink 1.5s ease-in-out infinite",
                    opacity: 0.8,
                  }}
                >
                  HIGH SCORE: ∞
                </div>
                {/* CTA button */}
                <button
                  type="button"
                  className="z-10 mt-3 font-black text-sm px-6 py-2 rounded-none uppercase tracking-widest transition-all"
                  style={{
                    color: "#000",
                    background: "#00ff88",
                    animation: "cta-pulse 1.5s ease-in-out infinite",
                    fontFamily: "monospace",
                    clipPath:
                      "polygon(4px 0,100% 0,calc(100% - 4px) 100%,0 100%)",
                  }}
                >
                  ▶ PLAY NOW →
                </button>
              </div>
            ) : (
              <>
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                {slide.id === 1 && (
                  <div
                    className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-white text-xs font-black"
                    style={{
                      background: "linear-gradient(135deg, #059669, #10b981)",
                      boxShadow:
                        "0 0 12px rgba(16,185,129,0.7), 0 0 24px rgba(16,185,129,0.4)",
                      animation: "cta-pulse 2s ease-in-out infinite",
                    }}
                  >
                    <style>
                      {
                        "@keyframes cta-pulse { 0%,100%{box-shadow:0 0 12px rgba(16,185,129,0.7),0 0 24px rgba(16,185,129,0.4)} 50%{box-shadow:0 0 20px rgba(16,185,129,0.9),0 0 40px rgba(16,185,129,0.6)} }"
                      }
                    </style>
                    🎮 Play &amp; Win FREE!
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Arrows */}
        <button
          type="button"
          onClick={() => {
            setAutoPlay(false);
            setActive(
              (p) => (p - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length,
            );
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow hover:bg-white transition-colors z-10"
          data-ocid="carousel.pagination_prev"
        >
          <ChevronDown className="w-4 h-4 rotate-90 text-foreground" />
        </button>
        <button
          type="button"
          onClick={() => {
            setAutoPlay(false);
            setActive((p) => (p + 1) % CAROUSEL_SLIDES.length);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow hover:bg-white transition-colors z-10"
          data-ocid="carousel.pagination_next"
        >
          <ChevronDown className="w-4 h-4 -rotate-90 text-foreground" />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-3 right-4 flex items-center gap-1.5 z-10">
          {CAROUSEL_SLIDES.map((s, i) => (
            <button
              key={`dot-${s.id}`}
              type="button"
              onClick={() => {
                setAutoPlay(false);
                setActive(i);
              }}
              data-ocid={`carousel.item.${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === active ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Game Popup Modal */}
      {showGamePopup && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.95)" }}
        >
          <div className="relative w-full max-w-3xl mx-4">
            <button
              type="button"
              onClick={() => setShowGamePopup(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white flex items-center gap-2 text-sm font-bold"
              data-ocid="game.popup.close_button"
            >
              <X className="w-5 h-5" /> Close
            </button>
            <DinoGame />
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Products Section (MEN / WOMEN split grid) ────────────────────────────────────────────────────────
function ProductsSection({
  onAddToCart,
}: {
  onAddToCart: (id: bigint) => void;
}) {
  const cm = useContext(ContentContext);
  const allProducts = getProducts(cm);
  const [activeCategory] = useState("All");

  const menProducts = allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes("men") &&
      !p.name.toLowerCase().includes("women"),
  );
  const womenProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes("women"),
  );

  const filterProducts = (products: typeof allProducts) => {
    if (activeCategory === "All") return products;
    return products.filter(
      (p) =>
        p.category === activeCategory ||
        p.name.toLowerCase().includes(activeCategory.toLowerCase()),
    );
  };

  const filteredMen = filterProducts(menProducts);
  const filteredWomen = filterProducts(womenProducts);
  const otherProducts = allProducts.filter(
    (p) =>
      !p.name.toLowerCase().includes("men") &&
      !p.name.toLowerCase().includes("women"),
  );
  const filteredOther = filterProducts(otherProducts);

  return (
    <div id="shop" data-ocid="products.section">
      <section className="bg-background pb-8 pt-4">
        <div className="max-w-2xl mx-auto px-3">
          {/* MEN & WOMEN Stacked */}
          {(filteredMen.length > 0 || filteredWomen.length > 0) && (
            <div className="flex flex-col gap-8 mb-6">
              {/* MEN Column */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-border" />
                  <h2 className="font-display font-black text-sm tracking-[0.2em] text-foreground uppercase">
                    MEN
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {filteredMen.map((product, i) => (
                    <MiniProductCard
                      key={product.id.toString()}
                      product={product}
                      index={i}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>
              </div>
              {/* WOMEN Column */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-border" />
                  <h2 className="font-display font-black text-sm tracking-[0.2em] text-foreground uppercase">
                    WOMEN
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {filteredWomen.map((product, i) => (
                    <MiniProductCard
                      key={product.id.toString()}
                      product={product}
                      index={i}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Other / unfiltered */}
          {filteredOther.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="h-px flex-1 bg-border" />
                <h2 className="font-display font-black text-base tracking-[0.2em] text-foreground uppercase">
                  FEATURED
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {filteredOther.map((product, i) => (
                  <MiniProductCard
                    key={product.id.toString()}
                    product={product}
                    index={i}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredMen.length === 0 &&
            filteredWomen.length === 0 &&
            filteredOther.length === 0 && (
              <div
                data-ocid="products.empty_state"
                className="py-16 text-center text-muted-foreground"
              >
                <p className="text-lg font-semibold mb-1">
                  No products in this category
                </p>
                <p className="text-sm">Try a different filter</p>
              </div>
            )}
        </div>
      </section>
    </div>
  );
}

// ─── Mini Product Card (compact for MEN/WOMEN grid) ──────────────────────────────────────
type FeedbackEntry = {
  name: string;
  rating: number;
  text: string;
  date: string;
};

const SIZE_CONFIGS = {
  "50ml": { price: 199, mrp: 799, emi: { today: 99, weekly: 34 } },
} as const;
type SizeKey = keyof typeof SIZE_CONFIGS;

function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
}: {
  product: ReturnType<typeof getProducts>[0];
  onClose: () => void;
  onAddToCart: (id: bigint) => void;
}) {
  const [displayProduct, setDisplayProduct] = useState(product);
  const selectedSize: SizeKey = "50ml";
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`alvra_feedback_${product.id}`) || "[]",
      );
    } catch {
      return [];
    }
  });
  const [fbName, setFbName] = useState("");
  const [fbRating, setFbRating] = useState(5);
  const [fbText, setFbText] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const sizeConfig = SIZE_CONFIGS[selectedSize];
  const cm = useContext(ContentContext);
  const allProducts = getProducts(cm);
  const similarProducts = allProducts.filter(
    (p) => String(p.id) !== String(displayProduct.id),
  );

  const handleFeedbackSubmit = () => {
    if (!fbName.trim() || !fbText.trim()) {
      toast.error("Please fill in your name and feedback.");
      return;
    }
    const newEntry: FeedbackEntry = {
      name: fbName.trim(),
      rating: fbRating,
      text: fbText.trim(),
      date: new Date().toLocaleDateString(),
    };
    const updated = [newEntry, ...feedbackList];
    setFeedbackList(updated);
    try {
      localStorage.setItem(
        `alvra_feedback_${displayProduct.id}`,
        JSON.stringify(updated),
      );
    } catch {}
    toast.success("Thank you for your feedback! 🌸");
    setFbName("");
    setFbText("");
    setFbRating(5);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        data-ocid="product.detail.modal"
      >
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92vh] overflow-y-auto z-10"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
        >
          <button
            type="button"
            onClick={onClose}
            data-ocid="product.detail.close_button"
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="aspect-square w-full bg-muted overflow-hidden">
            <img
              src={displayProduct.image}
              alt={displayProduct.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-luxury text-2xl font-black text-foreground">
                    {displayProduct.name}
                  </h2>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                    style={{ background: "oklch(0.52 0.12 186)" }}
                  >
                    50ml
                  </span>
                </div>
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full text-white flex-shrink-0"
                style={{ background: "oklch(0.58 0.16 186)" }}
              >
                {displayProduct.tag}
              </span>
            </div>

            {/* About this fragrance */}
            <div
              className="rounded-xl p-3 mb-4 border-l-4"
              style={{
                background: "oklch(0.97 0.02 186)",
                borderLeftColor: "oklch(0.58 0.16 186)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: "oklch(0.58 0.16 186)" }}
              >
                About this fragrance
              </p>
              <p className="text-foreground text-sm leading-relaxed">
                {displayProduct.description}
              </p>
            </div>

            <div className="flex items-center gap-1 mb-5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className="w-4 h-4 text-amber-400 fill-amber-400"
                />
              ))}
              <span className="text-sm text-muted-foreground ml-2">
                (128 reviews)
              </span>
            </div>

            <div
              className="rounded-2xl border-2 border-gold p-4 mb-3"
              style={{ background: "oklch(0.98 0.02 55)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-foreground text-sm">
                  💳 Buy via EMI
                </span>
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                  style={{ background: "oklch(0.72 0.18 55)" }}
                >
                  EMI DISCOUNT
                </span>
              </div>
              <div className="text-gold font-luxury font-black text-3xl mb-1">
                ₹{sizeConfig.emi.today}
                <span className="text-base font-bold opacity-80">
                  {" "}
                  today + ₹{sizeConfig.emi.weekly}/wk×3
                </span>
              </div>
              <div className="text-muted-foreground text-xs">
                Total via EMI:{" "}
                <span className="line-through">₹{sizeConfig.price}</span>{" "}
                <span className="text-gold font-bold">
                  ₹{sizeConfig.emi.today + sizeConfig.emi.weekly * 3}
                </span>{" "}
                — discount only with EMI
              </div>
            </div>

            <div className="rounded-2xl border border-border p-4 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Full price (no EMI)
                </span>
                <span className="font-luxury font-black text-foreground text-2xl">
                  ₹{sizeConfig.price}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full bg-gold text-white font-bold rounded-full hover:bg-gold-bright transition-all hover:scale-[1.02] shadow-gold"
                onClick={() => {
                  onAddToCart(displayProduct.id);
                  onClose();
                }}
                data-ocid="product.detail.primary_button"
              >
                Buy Now via EMI — Pay ₹{sizeConfig.emi.today}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full border-gold text-gold hover:bg-gold hover:text-white transition-all rounded-full"
                onClick={() => {
                  onAddToCart(displayProduct.id);
                  onClose();
                }}
                data-ocid="product.detail.secondary_button"
              >
                Add to Cart
              </Button>
            </div>

            {/* Similar Products */}
            {similarProducts.length > 0 && (
              <div className="mt-6 pt-5 border-t border-border">
                <p className="text-sm font-bold text-foreground mb-3">
                  You May Also Like
                </p>
                <div
                  className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
                  style={{ scrollbarWidth: "none" }}
                >
                  {similarProducts.slice(0, 8).map((sp, idx) => (
                    <button
                      key={String(sp.id)}
                      type="button"
                      data-ocid={`product.similar.item.${idx + 1}`}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group"
                      onClick={() => {
                        setDisplayProduct(sp);
                      }}
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-teal-400 transition-all">
                        <img
                          src={sp.image}
                          alt={sp.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground text-center max-w-[80px] leading-tight truncate w-20">
                        {sp.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Feedback */}
            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-sm font-bold text-foreground mb-3">
                Customer Reviews
              </p>
              {feedbackList.length === 0 ? (
                <p
                  className="text-xs text-muted-foreground mb-4"
                  data-ocid="feedback.empty_state"
                >
                  No reviews yet. Be the first!
                </p>
              ) : (
                <div className="space-y-3 mb-4">
                  {feedbackList.slice(0, 3).map((fb) => (
                    <div
                      key={`${fb.name}-${fb.date}`}
                      className="rounded-xl p-3 border border-border bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-foreground">
                          {fb.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {fb.date}
                        </span>
                      </div>
                      <div className="flex gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${s <= fb.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{fb.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit review form */}
              <div
                className="rounded-xl border border-border p-4 space-y-3"
                style={{ background: "oklch(0.98 0.01 186)" }}
              >
                <p className="text-xs font-bold text-foreground">
                  Write a Review
                </p>
                <input
                  type="text"
                  placeholder="Your name"
                  value={fbName}
                  onChange={(e) => setFbName(e.target.value)}
                  data-ocid="feedback.name.input"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <div className="flex gap-1" data-ocid="feedback.rating.toggle">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setFbRating(s)}
                      className="p-0.5"
                    >
                      <Star
                        className={`w-5 h-5 ${s <= (hoverRating || fbRating) ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Share your experience..."
                  value={fbText}
                  onChange={(e) => setFbText(e.target.value)}
                  data-ocid="feedback.text.textarea"
                  rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
                <Button
                  size="sm"
                  onClick={handleFeedbackSubmit}
                  data-ocid="feedback.submit_button"
                  className="w-full font-bold rounded-full"
                  style={{ background: "oklch(0.58 0.16 186)", color: "white" }}
                >
                  Submit Review
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function MiniProductCard({
  product,
  index,
  onAddToCart,
}: {
  product: ReturnType<typeof getProducts>[0];
  index: number;
  onAddToCart: (id: bigint) => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const ocidIndex = index + 1;
  const [inWishlist, setInWishlist] = useState(() => {
    try {
      const wl = JSON.parse(localStorage.getItem("alvra_wishlist") || "[]");
      return wl.some((p: { id: number }) => p.id === Number(product.id));
    } catch {
      return false;
    }
  });
  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wl = JSON.parse(localStorage.getItem("alvra_wishlist") || "[]");
    if (inWishlist) {
      const updated = wl.filter(
        (p: { id: number }) => p.id !== Number(product.id),
      );
      localStorage.setItem("alvra_wishlist", JSON.stringify(updated));
      setInWishlist(false);
    } else {
      wl.push({
        id: Number(product.id),
        name: product.name,
        image: product.image,
        price: 199,
        mrp: 799,
      });
      localStorage.setItem("alvra_wishlist", JSON.stringify(wl));
      setInWishlist(true);
    }
  };
  return (
    <>
      {showDetail && (
        <ProductDetailModal
          product={product}
          onClose={() => setShowDetail(false)}
          onAddToCart={onAddToCart}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        data-ocid={`product.card.${ocidIndex}`}
        className="bg-white rounded-xl overflow-hidden border border-border shadow-xs hover:shadow-md transition-shadow group cursor-pointer"
        onClick={() => setShowDetail(true)}
      >
        <div className="relative overflow-hidden bg-muted aspect-square">
          <img
            src={
              product.image ||
              (product.name.toLowerCase().includes("men")
                ? "/assets/generated/perfume-men.dim_400x500.png"
                : product.name.toLowerCase().includes("women")
                  ? "/assets/generated/perfume-women.dim_400x500.png"
                  : "/assets/generated/perfume-teal.dim_400x500.png")
            }
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
          />
          <div className="absolute top-1.5 left-1.5">
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: "oklch(0.58 0.16 186)" }}
            >
              {product.tag}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleWishlist}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/80 hover:bg-white transition-colors"
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            data-ocid={`product.wishlist.button.${ocidIndex}`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${inWishlist ? "text-rose-500 fill-rose-500" : "text-muted-foreground"}`}
            />
          </button>
        </div>

        <div className="p-2.5">
          <h3 className="font-bold text-foreground text-xs leading-tight mb-0.5 truncate">
            {product.name}
          </h3>
          <div
            className="mb-1.5 pl-2 border-l-2 rounded-sm"
            style={{ borderLeftColor: "oklch(0.58 0.16 186)" }}
          >
            <p
              className="text-[11px] leading-snug font-medium line-clamp-2"
              style={{ color: "oklch(0.30 0.10 186)" }}
            >
              {product.description}
            </p>
          </div>
          <div className="flex items-center gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className="w-2.5 h-2.5 text-amber-400 fill-amber-400"
              />
            ))}
            <span className="text-[9px] text-muted-foreground ml-1">(128)</span>
          </div>
          <div className="mb-2">
            {/* Price row */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-luxury font-black text-gold text-lg leading-none">
                ₹199
              </span>
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ background: "oklch(0.50 0.20 145)" }}
              >
                75% OFF
              </span>
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ background: "oklch(0.52 0.12 186)" }}
              >
                50ml
              </span>
            </div>
            {/* MRP line */}
            <div className="flex items-center gap-1 mb-2">
              <span className="text-[9px] text-muted-foreground line-through">
                M.R.P: ₹799
              </span>
              <span className="text-[8px] text-muted-foreground">
                · EMI price
              </span>
            </div>
            {/* Side-by-side buttons */}
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product.id);
                }}
                data-ocid={`product.buy.button.${ocidIndex}`}
                className="flex-1 text-[9px] font-bold py-1.5 rounded-full text-white hover:opacity-90 transition-opacity active:scale-95"
                style={{ background: "oklch(0.52 0.12 186)" }}
              >
                Add
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetail(true);
                }}
                data-ocid={`product.buynow.button.${ocidIndex}`}
                className="flex-1 text-[9px] font-bold py-1.5 rounded-full text-white hover:opacity-90 transition-opacity active:scale-95"
                style={{ background: "oklch(0.72 0.18 55)" }}
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Game Section ──────────────────────────────────────────────────────────────────────────────────
function DinoLeaderboard() {
  const [entries, setEntries] = useState<
    { name: string; score: number; date: string }[]
  >([]);
  useEffect(() => {
    try {
      const data = JSON.parse(
        localStorage.getItem("alvra_leaderboard") || "[]",
      );
      setEntries(data);
    } catch {
      setEntries([]);
    }
  }, []);
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div
      className="mt-8 rounded-2xl p-6"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
      data-ocid="leaderboard.panel"
    >
      <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
        <span>🏆</span> Top Players
      </h3>
      {entries.length === 0 ? (
        <p
          className="text-white/60 text-sm text-center py-4"
          data-ocid="leaderboard.empty_state"
        >
          Be the first to make the leaderboard!
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((e, i) => (
            <div
              key={`${e.name}-${e.score}`}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
              data-ocid={`leaderboard.item.${i + 1}`}
              style={{
                background:
                  i === 0
                    ? "rgba(212,160,23,0.25)"
                    : i === 1
                      ? "rgba(180,180,180,0.18)"
                      : i === 2
                        ? "rgba(180,120,60,0.2)"
                        : "rgba(255,255,255,0.07)",
                border: i < 3 ? "1px solid rgba(255,255,255,0.2)" : "none",
              }}
            >
              <span className="text-xl w-7 text-center">
                {medals[i] ?? `${i + 1}`}
              </span>
              <span className="flex-1 text-white font-semibold text-sm truncate">
                {e.name}
              </span>
              <span className="text-white/80 text-sm font-bold font-mono">
                {e.score.toLocaleString()}
              </span>
              <span className="text-white/40 text-xs ml-1">{e.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GameSection() {
  return (
    <section
      id="play-win"
      data-ocid="game.section"
      className="py-24 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.36 0.13 205) 0%, oklch(0.48 0.16 188) 50%, oklch(0.42 0.15 175) 100%)",
      }}
    >
      {/* Background circles */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
          transform: "translate(30%, -30%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none opacity-15"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
          transform: "translate(-30%, 30%)",
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
        <FadeIn>
          <div className="mb-4">
            <span
              className="text-xs font-bold tracking-[0.25em] uppercase px-4 py-2 rounded-full"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              🎮 Play & Win
            </span>
          </div>
          <h2
            className="font-display font-black text-white mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Win Free Perfume
          </h2>
          <p className="text-white/75 text-lg mb-10 max-w-lg mx-auto">
            Play the Dino challenge and unlock exclusive discount coupons on
            your next purchase.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div
            className="rounded-3xl p-8 md:p-10"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Reward tiers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {[
                { score: "500+", reward: "₹20 OFF", icon: "🎯" },
                { score: "1000+", reward: "₹50 OFF", icon: "🏆" },
                { score: "2000+", reward: "₹100 OFF", icon: "💫" },
                { score: "3000+", reward: "₹150 OFF", icon: "⚡" },
                { score: "5000+", reward: "₹200 OFF", icon: "🔥" },
                { score: "10000+", reward: "FREE PERFUME", icon: "🎉" },
              ].map((tier) => (
                <div
                  key={tier.score}
                  className="rounded-xl px-3 py-3 text-center"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <div className="text-xl mb-1">{tier.icon}</div>
                  <div className="text-white font-bold text-sm">
                    {tier.score}
                  </div>
                  <div className="text-white/70 text-xs mt-0.5">
                    {tier.reward}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <DinoGameModal />
            </div>
            <DinoLeaderboard />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Launch Offer Section ───────────────────────────────────────────────────────────────────────
function OfferAndEMISection() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const inclusions = [
    { icon: Package, text: "50ml perfume" },
    { icon: Zap, text: "Mini travel spray" },
    { icon: Heart, text: "Thank you card" },
    { icon: Award, text: "Exclusive coupon code" },
    { icon: Leaf, text: "Flower seeds gift" },
  ];

  return (
    <section
      id="offers"
      data-ocid="offer.section"
      className="py-16 bg-background"
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🔥</span>
                <h2 className="font-luxury text-2xl font-black text-foreground">
                  Launch Offer + Easy EMI
                </h2>
              </div>
              <p className="text-muted-foreground text-sm">
                Everything in the box. Pay your way.
              </p>
            </div>

            {/* Inclusions */}
            <div className="px-6 py-4 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                What's included
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {inclusions.map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <item.icon className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* EMI pricing */}
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-sm">
                  💳 Buy via EMI
                </h3>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                  style={{ background: "oklch(0.52 0.18 145)" }}
                >
                  EMI DISCOUNT
                </span>
              </div>
              <p className="text-muted-foreground text-xs mb-3">
                Exclusive discount — only when you choose EMI at checkout
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl border border-border p-3 text-center">
                  <div className="text-xl font-bold text-gold font-luxury">
                    ₹199
                  </div>
                  <div className="text-muted-foreground text-xs">Pay today</div>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <div className="text-xl font-bold text-foreground font-luxury">
                    ₹150<span className="text-xs">/wk</span>
                  </div>
                  <div className="text-muted-foreground text-xs">× 3 weeks</div>
                </div>
              </div>
              <div className="space-y-1.5 mb-3">
                {[
                  {
                    week: "Today",
                    amount: "₹199",
                    note: "Pay & get it delivered",
                  },
                  { week: "Week 1", amount: "₹150", note: "Auto-deducted" },
                  { week: "Week 2", amount: "₹150", note: "Auto-deducted" },
                  { week: "Week 3", amount: "₹150", note: "Final payment" },
                ].map((row) => (
                  <div
                    key={row.week}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-foreground text-sm">
                        {row.week}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gold font-semibold text-sm">
                        {row.amount}
                      </span>
                      <span className="text-muted-foreground text-xs hidden sm:inline">
                        {row.note}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                Total via EMI: <span className="line-through">₹799</span> →{" "}
                <span className="text-gold font-semibold">₹649</span>
              </div>
              <Button
                size="default"
                onClick={() => scrollTo("shop")}
                className="w-full bg-gold text-white font-semibold hover:bg-gold-bright transition-colors rounded-xl"
                data-ocid="offer.emi.primary_button"
              >
                Buy with EMI — Pay ₹199 Now
              </Button>
            </div>

            {/* Full price option */}
            <div className="px-6 py-4 flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Prefer full price?{" "}
                <span className="text-foreground font-medium">
                  ₹799 one-time
                </span>{" "}
                <span className="text-xs text-muted-foreground">
                  (no EMI discount)
                </span>
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => scrollTo("shop")}
                className="border-border text-foreground hover:border-gold hover:text-gold transition-colors rounded-xl ml-4 flex-shrink-0"
                data-ocid="offer.fullprice.secondary_button"
              >
                Buy ₹799
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Why Choose Section ────────────────────────────────────────────────────────────────────────────────
function WhySection() {
  const cm = useContext(ContentContext);
  const ICON_MAP = [Clock, Leaf, Sparkles, Heart];
  const DEFAULT_FEATURES = [
    {
      title: "Long lasting fragrance",
      desc: "Our fragrances last 10–14 hours, keeping you fresh all day and night.",
    },
    {
      title: "Premium ingredients",
      desc: "Sourced from the world's finest fragrance houses. No compromise on quality.",
    },
    {
      title: "Modern scent profiles",
      desc: "Contemporary interpretations of classic oriental and floral notes.",
    },
    {
      title: "Formal & Party occasions",
      desc: "Purpose-built fragrances for every moment of your life.",
    },
  ];
  const features = DEFAULT_FEATURES.map((f, i) => ({
    icon: ICON_MAP[i],
    title: cm[`why.${i + 1}.title`] ?? f.title,
    desc: cm[`why.${i + 1}.desc`] ?? f.desc,
  }));

  return (
    <section data-ocid="why.section" className="py-24 bg-obsidian-2">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeading
            title="Why Choose ALVRA"
            subtitle="Built on the promise of lasting impressions."
          />
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <FadeIn key={feature.title} delay={i * 0.1}>
              <div className="group bg-white border border-border rounded-2xl p-6 card-hover text-center h-full shadow-sm">
                <div
                  className="w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4 transition-all"
                  style={{
                    background: "oklch(0.95 0.04 195)",
                    borderColor: "oklch(0.84 0.08 186)",
                    borderWidth: "1px",
                  }}
                >
                  <feature.icon
                    className="w-6 h-6 transition-colors"
                    style={{ color: "oklch(0.58 0.16 186)" }}
                  />
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-gold" />
                  <h3 className="font-bold text-foreground">{feature.title}</h3>
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {feature.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────────────────────────
function Footer() {
  const currentYear = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  return (
    <footer
      id="contact"
      data-ocid="footer.section"
      className="border-t border-border py-16"
      style={{
        background:
          "linear-gradient(135deg, #042f2e 0%, #065a5a 50%, #042f2e 100%)",
        color: "white",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="text-center mb-12">
          <h2
            className="font-luxury text-4xl font-black tracking-[0.4em] mb-2"
            style={{
              color: "#2dd4bf",
              textShadow: "0 0 20px rgba(45,212,191,0.3)",
            }}
          >
            ALVRA
          </h2>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div
              className="h-0.5 w-12"
              style={{ background: "rgba(45,212,191,0.4)" }}
            />
            <p
              className="text-xs tracking-widest uppercase"
              style={{ color: "rgba(94,234,212,0.6)" }}
            >
              Premium Fragrances
            </p>
            <div
              className="h-0.5 w-12"
              style={{ background: "rgba(45,212,191,0.4)" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* About */}
          <div>
            <h3
              className="font-bold mb-4 text-sm uppercase tracking-wider"
              style={{ color: "rgba(45,212,191,0.9)" }}
            >
              About ALVRA
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Luxury fragrances crafted for the modern Indian. From formal
              elegance to party nights — ALVRA defines your signature scent.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3
              className="font-bold mb-4 text-sm uppercase tracking-wider"
              style={{ color: "rgba(45,212,191,0.9)" }}
            >
              Get in Touch
            </h3>
            <div className="space-y-3">
              <a
                href="https://wa.me/918787673730"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition-colors text-sm"
                style={{ color: "rgba(255,255,255,0.65)" }}
                data-ocid="footer.whatsapp.link"
              >
                <MessageCircle className="w-4 h-4 text-green-500" />
                <span>WhatsApp: 8787673730</span>
              </a>
              <a
                href="mailto:kmsworld29@gmail.com"
                className="flex items-center gap-3 transition-colors text-sm"
                style={{ color: "rgba(255,255,255,0.65)" }}
                data-ocid="footer.email.link"
              >
                <Mail className="w-4 h-4 text-gold" />
                <span>kmsworld29@gmail.com</span>
              </a>
              <a
                href="https://instagram.com/alvra.officiai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition-colors text-sm"
                style={{ color: "rgba(255,255,255,0.65)" }}
                data-ocid="footer.instagram.link"
              >
                <Instagram className="w-4 h-4 text-pink-500" />
                <span>@alvra.officiai</span>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3
              className="font-bold mb-4 text-sm uppercase tracking-wider"
              style={{ color: "rgba(45,212,191,0.9)" }}
            >
              Quick Links
            </h3>
            <div className="space-y-2">
              {["Privacy Policy", "Terms & Conditions", "Support"].map(
                (link) => (
                  <button
                    type="button"
                    key={link}
                    className="block transition-colors text-sm text-left w-full"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    {link}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-muted-foreground text-xs">
          <p style={{ color: "rgba(255,255,255,0.5)" }}>
            © {currentYear} ALVRA. All rights reserved.
          </p>
          <p>
            Built with <Heart className="w-3 h-3 text-gold inline" /> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:text-gold-bright transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Home Page ─────────────────────────────────────────────────────────────────────────────────────
// ─── Home Page ─────────────────────────────────────────────────────────────────────────────────────
function HomePage({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const { data: cartItems = [] } = useGetCart();
  const addToCart = useAddToCart();
  const initializeProducts = useInitializeProducts();

  const { mutate: initMutate } = initializeProducts;
  useEffect(() => {
    if (actor) {
      initMutate();
    }
  }, [actor, initMutate]);

  const handleAddToCart = (productId: bigint) => {
    if (!identity) {
      toast.info("Please sign in to add items to your cart.", {
        description: "You need an account to shop.",
        action: {
          label: "Sign In",
          onClick: () => onNavigate("/login"),
        },
      });
      return;
    }
    if (addToCart.isPending) return;
    addToCart.mutate(
      { productId, quantity: 1n },
      {
        onSuccess: () => {
          const product = getProducts(readAll()).find(
            (p) => p.id === productId,
          );
          toast.success("Added to cart!", {
            description: product
              ? `${product.name} added to your cart.`
              : "Item added.",
          });
        },
        onError: (error) => {
          const msg = error instanceof Error ? error.message : "";
          if (msg.includes("loading")) {
            toast.info("Please wait a moment and try again.");
          } else {
            toast.error("Failed to add to cart. Please try again.");
          }
        },
      },
    );
  };

  const cartCount = cartItems.reduce(
    (acc, item) => acc + Number(item.quantity),
    0,
  );

  return (
    <div className="bg-background min-h-screen">
      <Header cartCount={cartCount} onNavigate={onNavigate} />
      <div className="pt-14">
        <PromoTicker />
        <HeroCarousel onNavigate={onNavigate} />
        <main>
          <ProductsSection onAddToCart={handleAddToCart} />
          <GameSection />
          <CustomSectorsSection />
          <OfferAndEMISection />
          <WhySection />
        </main>
        <Footer />
      </div>
    </div>
  );
}

// ─── Root App with routing ───────────────────────────────────────────────────────────────────────────────
export default function App() {
  const { path, navigate } = useRouter();
  const cm = useContent();

  return (
    <ContentContext.Provider value={cm}>
      <Toaster
        theme="light"
        toastOptions={{
          style: {
            background: "#fff",
            border: "1px solid oklch(0.84 0.08 186 / 0.4)",
            color: "oklch(0.15 0.025 255)",
          },
        }}
      />
      <AnimatePresence mode="wait">
        {path === "/login" ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LoginPage onNavigate={navigate} />
          </motion.div>
        ) : path === "/signup" ? (
          <motion.div
            key="signup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SignupPage onNavigate={navigate} />
          </motion.div>
        ) : path === "/admin" ? (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AdminPage onNavigate={navigate} />
          </motion.div>
        ) : path === "/cart" ? (
          <motion.div
            key="cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CartPage onNavigate={navigate} />
          </motion.div>
        ) : path === "/profile" ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ProfilePage onNavigate={navigate} />
          </motion.div>
        ) : path === "/checkout" ? (
          <motion.div
            key="checkout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CheckoutPage onNavigate={navigate} />
          </motion.div>
        ) : (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <HomePage onNavigate={navigate} />
          </motion.div>
        )}
      </AnimatePresence>
    </ContentContext.Provider>
  );
}
