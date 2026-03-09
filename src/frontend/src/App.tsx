import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Award,
  Camera,
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
  Settings,
  ShoppingCart,
  Sparkles,
  Star,
  User,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DinoGameModal } from "./components/DinoGame";
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
import SignupPage from "./pages/SignupPage";

// ─── Simple client-side router ───────────────────────────────────────────────
function useRouter() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, "", to);
    setPath(to);
    window.scrollTo({ top: 0 });
  };

  return { path, navigate };
}

// ─── Fade-in wrapper ───────────────────────────────────────────────────────────
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

// ─── Section Heading ─────────────────────────────────────────────────────────
function SectionHeading({
  title,
  subtitle,
}: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-14">
      <h2 className="font-display text-4xl md:text-5xl font-bold text-gold gold-glow mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          {subtitle}
        </p>
      )}
      <div className="flex items-center justify-center gap-2 mt-4">
        <div className="h-px w-16 bg-gold-dim" />
        <Sparkles className="w-4 h-4 text-gold" />
        <div className="h-px w-16 bg-gold-dim" />
      </div>
    </div>
  );
}

// ─── Products data ─────────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    id: 1n,
    name: "Men Formal",
    description: "Fresh elegant fragrance",
    price: "₹799",
    image: "/assets/generated/men-formal.dim_400x500.png",
    tag: "Bestseller",
    category: "Formal",
  },
  {
    id: 2n,
    name: "Men Party",
    description: "Strong night fragrance",
    price: "₹799",
    image: "/assets/generated/men-party.dim_400x500.png",
    tag: "New",
    category: "Party",
  },
  {
    id: 3n,
    name: "Women Formal",
    description: "Soft floral fragrance",
    price: "₹799",
    image: "/assets/generated/women-formal.dim_400x500.png",
    tag: "Popular",
    category: "Formal",
  },
  {
    id: 4n,
    name: "Women Party",
    description: "Sweet seductive fragrance",
    price: "₹799",
    image: "/assets/generated/women-party.dim_400x500.png",
    tag: "Limited",
    category: "Party",
  },
];

// ─── Reviews data ─────────────────────────────────────────────────────────────
const REVIEWS = [
  {
    name: "Rahul S.",
    location: "Mumbai",
    text: "Smells amazing and lasts all day. Worth every rupee! I get compliments wherever I go.",
    product: "Men Formal",
  },
  {
    name: "Priya M.",
    location: "Delhi",
    text: "Best perfume I bought online. Got so many compliments at work and parties!",
    product: "Women Party",
  },
  {
    name: "Amit K.",
    location: "Bangalore",
    text: "The Men Formal fragrance is perfect for office. Highly recommend ALVRA to everyone.",
    product: "Men Formal",
  },
];

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({
  cartCount,
  onNavigate,
}: {
  cartCount: number;
  onNavigate: (path: string) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { identity, clear, isLoggingIn } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const navLinks = [
    { label: "Home", id: "home", ocid: "nav.home.link" },
    { label: "Shop", id: "shop", ocid: "nav.shop.link" },
    { label: "Play & Win", id: "play-win", ocid: "nav.plawin.link" },
    { label: "Offers", id: "offers", ocid: "nav.offers.link" },
    { label: "Contact", id: "contact", ocid: "nav.contact.link" },
  ];

  const handleLogout = () => {
    clear();
    toast.success("Signed out successfully.");
    setMenuOpen(false);
  };

  return (
    <>
      <header
        data-ocid="header.section"
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "glass-dark border-b border-gold-dim shadow-gold"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="text-gold hover:text-gold-bright transition-colors p-2 rounded-lg hover:bg-obsidian-3 md:hidden"
            data-ocid="header.menu_button"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop nav left */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.slice(0, 2).map((link) => (
              <button
                type="button"
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-sm text-muted-foreground hover:text-gold transition-colors font-medium"
                data-ocid={link.ocid}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Center logo */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <button
              type="button"
              onClick={() => onNavigate("/")}
              className="font-luxury text-2xl md:text-3xl font-bold text-gold gold-glow tracking-[0.3em]"
              data-ocid="header.logo.link"
            >
              ALVRA
            </button>
          </div>

          {/* Desktop nav right + auth + cart */}
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.slice(2).map((link) => (
                <button
                  type="button"
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="text-sm text-muted-foreground hover:text-gold transition-colors font-medium"
                  data-ocid={link.ocid}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Auth buttons */}
            {identity ? (
              <div className="hidden md:flex items-center gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onNavigate("/admin")}
                    className="flex items-center gap-1.5 text-xs text-gold hover:text-gold-bright transition-colors px-3 py-1.5 rounded-lg border border-gold-dim hover:bg-gold/10"
                    data-ocid="header.admin.link"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Admin
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors px-3 py-1.5 rounded-lg hover:bg-obsidian-3"
                  data-ocid="header.logout.button"
                  disabled={isLoggingIn}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate("/login")}
                className="hidden md:flex items-center gap-1.5 text-xs text-gold hover:text-gold-bright transition-colors px-3 py-1.5 rounded-lg border border-gold-dim hover:bg-gold/10"
                data-ocid="header.login.link"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate("/cart")}
              className="relative text-gold hover:text-gold-bright transition-colors p-2 rounded-lg hover:bg-obsidian-3"
              data-ocid="header.cart_button"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-obsidian text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-obsidian-2 border-r border-gold-dim p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-luxury text-xl text-gold tracking-widest">
                  ALVRA
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="text-muted-foreground hover:text-gold transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <button
                    type="button"
                    key={link.id}
                    onClick={() => scrollTo(link.id)}
                    className="text-left px-4 py-3 text-foreground hover:text-gold hover:bg-obsidian-3 rounded-lg transition-all font-medium"
                    data-ocid={link.ocid}
                  >
                    {link.label}
                  </button>
                ))}
              </nav>

              {/* Mobile auth */}
              <div className="mt-6 pt-6 border-t border-border flex flex-col gap-2">
                {identity ? (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2 text-muted-foreground text-sm">
                      <User className="w-4 h-4 text-gold" />
                      <span className="text-gold text-xs truncate">
                        {identity.getPrincipal().toString().slice(0, 20)}…
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onNavigate("/admin");
                        }}
                        className="flex items-center gap-2 px-4 py-3 text-gold hover:bg-obsidian-3 rounded-lg transition-all text-sm"
                        data-ocid="header.mobile_admin.link"
                      >
                        <Settings className="w-4 h-4" />
                        Admin Panel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-3 text-muted-foreground hover:text-gold hover:bg-obsidian-3 rounded-lg transition-all text-sm"
                      data-ocid="header.mobile_logout.button"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onNavigate("/login");
                    }}
                    className="flex items-center gap-2 px-4 py-3 text-gold hover:bg-obsidian-3 rounded-lg transition-all text-sm font-medium"
                    data-ocid="header.mobile_login.link"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                )}
              </div>

              <div className="mt-auto pt-8 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Premium Fragrances
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="home"
      data-ocid="hero.section"
      className="relative min-h-screen flex items-center overflow-hidden bg-obsidian"
    >
      {/* Background mesh */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 70% 50%, oklch(0.22 0.04 75 / 0.25) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 20% 80%, oklch(0.15 0.02 75 / 0.15) 0%, transparent 50%)",
        }}
      />
      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen py-24">
          {/* Left content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Badge className="bg-obsidian-3 text-gold border-gold-dim mb-6 text-xs tracking-widest px-3 py-1">
                ✦ PREMIUM COLLECTION 2025
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.35,
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="font-luxury text-6xl sm:text-7xl lg:text-8xl font-bold leading-none mb-6"
            >
              <span className="text-gold gold-glow block">BE</span>
              <span className="text-foreground block">UNFOR-</span>
              <span className="text-gold gold-glow block">GETTABLE</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="text-muted-foreground text-lg md:text-xl mb-10 max-w-md leading-relaxed"
            >
              Premium perfumes designed for{" "}
              <span className="text-gold">Formal</span> &{" "}
              <span className="text-gold">Party</span> moments.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                onClick={() => scrollTo("shop")}
                className="bg-gold text-obsidian font-bold text-base px-8 py-6 hover:bg-gold-bright transition-all hover:scale-105 shadow-gold"
                data-ocid="hero.shop_now.primary_button"
              >
                Shop Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollTo("play-win")}
                className="border-gold text-gold hover:bg-gold hover:text-obsidian font-bold text-base px-8 py-6 transition-all hover:scale-105"
                data-ocid="hero.play_win.secondary_button"
              >
                🎮 Play & Win
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-6 mt-10 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gold" />
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-gold" />
                <span>Premium Quality</span>
              </div>
            </motion.div>
          </div>

          {/* Right — hero image */}
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative">
              {/* Glow rings */}
              <div
                className="absolute inset-0 rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, oklch(0.78 0.13 75 / 0.2) 0%, transparent 70%)",
                  transform: "scale(1.3)",
                }}
              />
              <div className="animate-float relative z-10">
                <img
                  src="/assets/generated/hero-perfume.dim_800x900.png"
                  alt="ALVRA Premium Perfume"
                  className="w-72 sm:w-96 lg:w-[420px] drop-shadow-2xl"
                  style={{
                    filter: "drop-shadow(0 0 40px oklch(0.78 0.13 75 / 0.3))",
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Dino Game Section ────────────────────────────────────────────────────────
function GameSection() {
  return (
    <section
      id="play-win"
      data-ocid="game.section"
      className="py-24 bg-obsidian-2 relative overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, oklch(0.78 0.13 75 / 0.15) 0%, transparent 50%)",
        }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <FadeIn>
          <SectionHeading
            title="🎮 Play & Win Discount"
            subtitle="Play the Dino challenge and unlock exclusive rewards on your next purchase."
          />
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="bg-obsidian border border-gold-dim rounded-2xl p-8 md:p-12 gold-glow-box">
            {/* Reward tiers preview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8 text-sm">
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
                  className="bg-obsidian-3 border border-border rounded-lg px-3 py-2 text-center"
                >
                  <div className="text-base mb-1">{tier.icon}</div>
                  <div className="text-gold font-bold">{tier.score}</div>
                  <div className="text-muted-foreground text-xs">
                    {tier.reward}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <DinoGameModal />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({
  product,
  index,
  onAddToCart,
}: {
  product: (typeof PRODUCTS)[0];
  index: number;
  onAddToCart: (id: bigint) => void;
}) {
  const ocidIndex = index + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      data-ocid={`product.card.${ocidIndex}`}
      className="group bg-obsidian-2 border border-border rounded-2xl overflow-hidden card-hover"
    >
      <div className="relative overflow-hidden bg-obsidian-3 aspect-[4/5]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian/60 to-transparent" />
        <Badge className="absolute top-3 right-3 bg-gold text-obsidian text-xs font-bold border-0">
          {product.tag}
        </Badge>
        <div className="absolute bottom-3 left-3 right-3">
          <Badge
            variant="outline"
            className="border-gold-dim text-gold bg-obsidian/80 text-xs"
          >
            {product.category}
          </Badge>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-display text-xl font-bold text-foreground mb-1">
          {product.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-luxury text-2xl font-bold text-gold">
            {product.price}
          </span>
          <Button
            onClick={() => onAddToCart(product.id)}
            className="bg-gold text-obsidian font-bold hover:bg-gold-bright transition-all hover:scale-105 text-sm"
            data-ocid={`product.buy.button.${ocidIndex}`}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Products Section ─────────────────────────────────────────────────────────
function ProductsSection({
  onAddToCart,
}: {
  onAddToCart: (id: bigint) => void;
}) {
  return (
    <section
      id="shop"
      data-ocid="products.section"
      className="py-24 bg-obsidian"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeading
            title="Our Collection"
            subtitle="Four signature fragrances crafted for every occasion."
          />
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCTS.map((product, index) => (
            <ProductCard
              key={product.id.toString()}
              product={product}
              index={index}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Launch Offer Section ─────────────────────────────────────────────────────
function LaunchOfferSection() {
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
      className="py-24 bg-obsidian-2 relative overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 50% 50%, oklch(0.78 0.13 75 / 0.06) 0%, transparent 70%)",
        }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="bg-obsidian border-2 border-gold rounded-3xl p-8 md:p-12 shadow-gold-lg relative overflow-hidden">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-gold rounded-tl-3xl" />
            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-gold rounded-br-3xl" />

            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🔥</div>
              <h2 className="font-luxury text-4xl md:text-5xl font-bold text-gold gold-glow mb-3">
                Launch Offer
              </h2>
              <p className="text-muted-foreground text-lg mb-2">
                Limited time. Grab it now.
              </p>
              <div className="text-3xl md:text-4xl font-bold text-foreground mt-4">
                Just{" "}
                <span className="text-gold font-luxury text-5xl">₹199</span>
              </div>
              <p className="text-muted-foreground text-sm mt-2 line-through">
                Regular price ₹799
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {inclusions.map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-3 bg-obsidian-3 rounded-xl px-4 py-3 border border-border"
                >
                  <item.icon className="w-5 h-5 text-gold flex-shrink-0" />
                  <span className="text-foreground font-medium">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={() => scrollTo("shop")}
                className="bg-gold text-obsidian font-bold text-lg px-12 py-6 hover:bg-gold-bright transition-all hover:scale-105 shadow-gold animate-pulse-gold"
                data-ocid="offer.grab.primary_button"
              >
                Grab the Offer →
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── EMI Section ──────────────────────────────────────────────────────────────
function EMISection() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section data-ocid="emi.section" className="py-24 bg-obsidian">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <FadeIn>
          <SectionHeading
            title="💳 Buy Now, Pay Later"
            subtitle="Easy flexible payments. Own your fragrance today."
          />
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="bg-obsidian-2 border border-gold-dim rounded-2xl p-8 md:p-10 gold-glow-box mb-8">
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-obsidian-3 rounded-xl p-5 border border-gold">
                <div className="text-3xl font-bold text-gold font-luxury mb-1">
                  ₹199
                </div>
                <div className="text-muted-foreground text-sm">Pay today</div>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-muted-foreground font-bold text-lg">
                  +
                </span>
              </div>
              <div className="bg-obsidian-3 rounded-xl p-5 border border-border">
                <div className="text-3xl font-bold text-foreground font-luxury mb-1">
                  ₹150
                </div>
                <div className="text-muted-foreground text-sm">Every week</div>
              </div>
            </div>

            <div className="space-y-3 text-left mb-8">
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
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-obsidian-3 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gold" />
                    <span className="text-foreground font-medium">
                      {row.week}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gold font-bold">{row.amount}</span>
                    <span className="text-muted-foreground text-xs hidden sm:inline">
                      {row.note}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button
              size="lg"
              onClick={() => scrollTo("shop")}
              className="w-full bg-gold text-obsidian font-bold py-5 hover:bg-gold-bright transition-all hover:scale-[1.02] text-base"
              data-ocid="emi.get_started.primary_button"
            >
              Get Started — Pay ₹199 Now
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Why Choose Section ───────────────────────────────────────────────────────
function WhySection() {
  const features = [
    {
      icon: Clock,
      title: "Long lasting fragrance",
      desc: "Our fragrances last 10–14 hours, keeping you fresh all day and night.",
    },
    {
      icon: Leaf,
      title: "Premium ingredients",
      desc: "Sourced from the world's finest fragrance houses. No compromise on quality.",
    },
    {
      icon: Sparkles,
      title: "Modern scent profiles",
      desc: "Contemporary interpretations of classic oriental and floral notes.",
    },
    {
      icon: Heart,
      title: "Formal & Party occasions",
      desc: "Purpose-built fragrances for every moment of your life.",
    },
  ];

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
              <div className="group bg-obsidian border border-border rounded-2xl p-6 card-hover text-center h-full">
                <div className="w-12 h-12 rounded-full bg-obsidian-3 border border-gold-dim flex items-center justify-center mx-auto mb-4 group-hover:border-gold transition-colors">
                  <feature.icon className="w-6 h-6 text-gold" />
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-gold" />
                  <h3 className="font-bold text-foreground">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
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

// ─── Reviews Section ──────────────────────────────────────────────────────────
function ReviewsSection() {
  return (
    <section data-ocid="reviews.section" className="py-24 bg-obsidian">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeading
            title="What Our Customers Say"
            subtitle="Join thousands of satisfied fragrance lovers."
          />
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((review, i) => (
            <FadeIn key={review.name} delay={i * 0.1}>
              <div
                data-ocid={`review.card.${i + 1}`}
                className="bg-obsidian-2 border border-border rounded-2xl p-6 card-hover relative"
              >
                {/* Quote mark */}
                <div
                  className="absolute top-4 right-5 text-6xl font-display text-gold opacity-10 leading-none select-none"
                  aria-hidden="true"
                >
                  "
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {["s1", "s2", "s3", "s4", "s5"].map((s) => (
                    <Star key={s} className="w-4 h-4 text-gold fill-gold" />
                  ))}
                </div>

                <p className="text-foreground leading-relaxed mb-5 relative z-10">
                  "{review.text}"
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-foreground">
                      {review.name}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {review.location}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-gold-dim text-gold text-xs"
                  >
                    {review.product}
                  </Badge>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Instagram Section ────────────────────────────────────────────────────────
function InstagramSection() {
  const gradients = [
    "from-yellow-900/60 to-orange-900/60",
    "from-pink-900/60 to-purple-900/60",
    "from-blue-900/60 to-indigo-900/60",
    "from-green-900/60 to-teal-900/60",
    "from-red-900/60 to-pink-900/60",
    "from-amber-900/60 to-yellow-900/60",
  ];

  return (
    <section data-ocid="instagram.section" className="py-24 bg-obsidian-2">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <FadeIn>
          <SectionHeading title="Follow Our Journey" />
          <p className="text-gold text-lg font-bold tracking-wider mb-10">
            @alvra.officiai
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="grid grid-cols-3 gap-3 mb-10">
            {gradients.map((grad) => (
              <div
                key={grad}
                className={`aspect-square rounded-xl bg-gradient-to-br ${grad} border border-border relative overflow-hidden group cursor-pointer card-hover`}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <div className="absolute inset-0 bg-obsidian/0 group-hover:bg-obsidian/20 transition-colors" />
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2 text-white text-xs">
                    <span>❤️ {Math.floor(Math.random() * 500) + 100}</span>
                    <span>💬 {Math.floor(Math.random() * 50) + 10}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <a
            href="https://instagram.com/alvra.officiai"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold px-8 py-5 transition-all hover:scale-105"
              data-ocid="instagram.follow.primary_button"
            >
              <Instagram className="w-5 h-5 mr-2" />
              Follow on Instagram
            </Button>
          </a>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const currentYear = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  return (
    <footer
      id="contact"
      data-ocid="footer.section"
      className="bg-obsidian border-t border-gold-dim py-16"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="text-center mb-12">
          <h2 className="font-luxury text-4xl font-bold text-gold gold-glow tracking-[0.4em] mb-2">
            ALVRA
          </h2>
          <p className="text-muted-foreground text-sm tracking-widest">
            PREMIUM FRAGRANCES
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* About */}
          <div>
            <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">
              About ALVRA
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Luxury fragrances crafted for the modern Indian. From formal
              elegance to party nights — ALVRA defines your signature scent.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">
              Get in Touch
            </h3>
            <div className="space-y-3">
              <a
                href="https://wa.me/918787673730"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground hover:text-gold transition-colors text-sm"
                data-ocid="footer.whatsapp.link"
              >
                <MessageCircle className="w-4 h-4 text-green-500" />
                <span>WhatsApp: 8787673730</span>
              </a>
              <a
                href="mailto:kmsworld29@gmail.com"
                className="flex items-center gap-3 text-muted-foreground hover:text-gold transition-colors text-sm"
                data-ocid="footer.email.link"
              >
                <Mail className="w-4 h-4 text-gold" />
                <span>kmsworld29@gmail.com</span>
              </a>
              <a
                href="https://instagram.com/alvra.officiai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground hover:text-gold transition-colors text-sm"
                data-ocid="footer.instagram.link"
              >
                <Instagram className="w-4 h-4 text-pink-500" />
                <span>@alvra.officiai</span>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">
              Quick Links
            </h3>
            <div className="space-y-2">
              {["Privacy Policy", "Terms & Conditions", "Support"].map(
                (link) => (
                  <button
                    type="button"
                    key={link}
                    className="block text-muted-foreground hover:text-gold transition-colors text-sm text-left w-full"
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
          <p>© {currentYear} ALVRA. All rights reserved.</p>
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

// ─── Main Home Page ───────────────────────────────────────────────────────────
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

  // Initialize products on mount
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
    if (addToCart.isPending) return; // prevent double-click
    addToCart.mutate(
      { productId, quantity: 1n },
      {
        onSuccess: () => {
          const product = PRODUCTS.find((p) => p.id === productId);
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
    <div className="bg-obsidian min-h-screen">
      <Header cartCount={cartCount} onNavigate={onNavigate} />
      <main>
        <HeroSection />
        <GameSection />
        <ProductsSection onAddToCart={handleAddToCart} />
        <LaunchOfferSection />
        <EMISection />
        <WhySection />
        <ReviewsSection />
        <InstagramSection />
      </main>
      <Footer />
    </div>
  );
}

// ─── Root App with routing ────────────────────────────────────────────────────
export default function App() {
  const { path, navigate } = useRouter();

  return (
    <>
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(0.12 0 0)",
            border: "1px solid oklch(0.78 0.13 75 / 0.3)",
            color: "oklch(0.94 0.02 85)",
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
    </>
  );
}
