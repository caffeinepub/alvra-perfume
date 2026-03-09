import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  ShoppingCart,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAllProducts,
  useGetCart,
  useRemoveFromCart,
  useValidateCoupon,
} from "../hooks/useQueries";

interface CartPageProps {
  onNavigate: (path: string) => void;
}

// ─── Static product data fallback ─────────────────────────────────────────────
const STATIC_PRODUCTS = [
  {
    id: 1n,
    name: "Men Formal",
    image: "/assets/generated/men-formal.dim_400x500.png",
  },
  {
    id: 2n,
    name: "Men Party",
    image: "/assets/generated/men-party.dim_400x500.png",
  },
  {
    id: 3n,
    name: "Women Formal",
    image: "/assets/generated/women-formal.dim_400x500.png",
  },
  {
    id: 4n,
    name: "Women Party",
    image: "/assets/generated/women-party.dim_400x500.png",
  },
];

const ITEM_PRICE = 799;

export default function CartPage({ onNavigate }: CartPageProps) {
  const { identity } = useInternetIdentity();
  const { data: cartItems = [], isLoading: cartLoading } = useGetCart();
  const { data: backendProducts = [] } = useGetAllProducts();
  const removeFromCart = useRemoveFromCart();
  const validateCoupon = useValidateCoupon();

  const [couponInput, setCouponInput] = useState(() => {
    return localStorage.getItem("alvra_coupon") || "";
  });
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(() => {
    const saved = localStorage.getItem("alvra_coupon");
    const savedDiscount = localStorage.getItem("alvra_coupon_discount");
    if (saved && savedDiscount) {
      return { code: saved, discount: Number(savedDiscount) };
    }
    return null;
  });

  const getProductInfo = (productId: bigint) => {
    const backend = backendProducts.find((p) => p.id === productId);
    const staticProduct = STATIC_PRODUCTS.find((p) => p.id === productId);
    return {
      name: backend?.name ?? staticProduct?.name ?? `Product ${productId}`,
      image:
        backend?.imageUrl ??
        staticProduct?.image ??
        "/assets/generated/men-formal.dim_400x500.png",
      price: backend ? Number(backend.price) : ITEM_PRICE,
    };
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const info = getProductInfo(item.productId);
    return sum + info.price * Number(item.quantity);
  }, 0);

  const discount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter a coupon code.");
      return;
    }
    validateCoupon.mutate(code, {
      onSuccess: (result) => {
        const discountAmount = Number(result.discountAmount);
        setAppliedCoupon({ code: result.code, discount: discountAmount });
        localStorage.setItem("alvra_coupon", result.code);
        localStorage.setItem("alvra_coupon_discount", String(discountAmount));
        toast.success(`Coupon applied! ₹${discountAmount} OFF`);
      },
      onError: () => {
        toast.error("Invalid coupon code. Please try again.");
      },
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    localStorage.removeItem("alvra_coupon");
    localStorage.removeItem("alvra_coupon_discount");
  };

  const handleRemoveItem = (productId: bigint) => {
    removeFromCart.mutate(productId, {
      onSuccess: () => {
        toast.success("Item removed from cart.");
      },
      onError: () => {
        toast.error("Failed to remove item. Please try again.");
      },
    });
  };

  const handleProceedToCheckout = () => {
    onNavigate("/checkout");
  };

  // ─── Not logged in ─────────────────────────────────────────────────────────
  if (!identity) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-4"
        data-ocid="cart.page"
      >
        <CartHeader onNavigate={onNavigate} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-gold-dim rounded-3xl p-10 text-center max-w-md mt-16"
        >
          <ShoppingCart className="w-14 h-14 text-gold mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">
            Sign In to View Cart
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Please sign in to access your cart and place orders.
          </p>
          <Button
            onClick={() => onNavigate("/login")}
            className="bg-gold text-obsidian font-bold hover:bg-gold-bright"
            data-ocid="cart.login.primary_button"
          >
            Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (cartLoading) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        data-ocid="cart.loading_state"
      >
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  // ─── Empty ─────────────────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background" data-ocid="cart.page">
        <CartHeader onNavigate={onNavigate} />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm"
            data-ocid="cart.empty_state"
          >
            <div className="w-24 h-24 rounded-full bg-obsidian-2 border border-gold-dim flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-10 h-10 text-gold-dim" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">
              Your Cart is Empty
            </h2>
            <p className="text-muted-foreground text-sm mb-8">
              Discover our premium fragrances and add your favorites to the
              cart.
            </p>
            <Button
              onClick={() => onNavigate("/")}
              className="bg-gold text-obsidian font-bold hover:bg-gold-bright px-8 py-5"
              data-ocid="cart.shop_now.primary_button"
            >
              Shop Now
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Cart with items ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background" data-ocid="cart.page">
      <CartHeader onNavigate={onNavigate} />

      <main className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gold gold-glow">
            Shopping Cart
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in your
            cart
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence initial={false}>
              {cartItems.map((item, index) => {
                const info = getProductInfo(item.productId);
                return (
                  <motion.div
                    key={item.productId.toString()}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    data-ocid={`cart.item.${index + 1}`}
                    className="bg-card border border-border rounded-2xl overflow-hidden flex gap-4 p-4"
                  >
                    {/* Product image */}
                    <div className="w-20 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-obsidian-2">
                      <img
                        src={info.image}
                        alt={info.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display font-bold text-foreground text-lg leading-tight">
                            {info.name}
                          </h3>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            ALVRA Premium Perfume
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          disabled={removeFromCart.isPending}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10 flex-shrink-0"
                          data-ocid={`cart.remove.button.${index + 1}`}
                          aria-label={`Remove ${info.name} from cart`}
                        >
                          {removeFromCart.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-gold-dim text-gold text-xs"
                          >
                            Qty: {Number(item.quantity)}
                          </Badge>
                        </div>
                        <span className="font-luxury font-bold text-gold text-xl">
                          ₹
                          {(info.price * Number(item.quantity)).toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 sticky top-24"
            >
              <h2 className="font-display text-xl font-bold text-gold mb-5 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Order Summary
              </h2>

              {/* Coupon input */}
              <div className="mb-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  Coupon Code
                </p>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-gold/10 border border-gold-dim rounded-xl px-4 py-2.5">
                    <div>
                      <p className="text-gold font-bold text-sm">
                        {appliedCoupon.code}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        −₹{appliedCoupon.discount} discount
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-muted-foreground hover:text-gold transition-colors"
                      aria-label="Remove coupon"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleApplyCoupon()
                      }
                      className="bg-background border-border focus:border-gold text-foreground placeholder:text-muted-foreground text-sm uppercase"
                      data-ocid="cart.coupon.input"
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={validateCoupon.isPending || !couponInput.trim()}
                      variant="outline"
                      className="border-gold-dim text-gold hover:bg-gold hover:text-obsidian text-sm font-bold flex-shrink-0"
                      data-ocid="cart.apply_coupon.button"
                    >
                      {validateCoupon.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <Separator className="bg-border mb-5" />

              {/* Price breakdown */}
              <div className="space-y-2.5 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground font-medium">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Discount ({appliedCoupon?.code})
                    </span>
                    <span className="text-green-400 font-medium">
                      −₹{discount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-green-400 font-medium text-xs">
                    FREE
                  </span>
                </div>
              </div>

              <Separator className="bg-border mb-5" />

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-luxury text-2xl font-bold text-gold">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

              <Button
                onClick={handleProceedToCheckout}
                className="w-full bg-gold text-obsidian font-bold text-base py-5 hover:bg-gold-bright transition-all hover:scale-[1.02] shadow-gold"
                data-ocid="cart.checkout.primary_button"
              >
                Proceed to Checkout →
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-3">
                Free delivery on all orders
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Cart Header ──────────────────────────────────────────────────────────────
function CartHeader({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-b border-gold-dim">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors text-sm"
          data-ocid="cart.back.button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={() => onNavigate("/")}
          className="font-luxury text-2xl font-bold text-gold gold-glow tracking-[0.3em] absolute left-1/2 -translate-x-1/2"
          data-ocid="cart.logo.link"
        >
          ALVRA
        </button>
        <div className="w-16" />
      </div>
    </header>
  );
}
