import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Package,
  ShoppingBag,
  Sparkles,
  Tag,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Order } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useClearCart,
  useGetAllProducts,
  useGetCart,
  usePlaceOrderWithAddress,
  useValidateCoupon,
} from "../hooks/useQueries";

interface CheckoutPageProps {
  onNavigate: (path: string) => void;
}

// ─── Static product fallback ──────────────────────────────────────────────────
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

// ─── Checkout Header ──────────────────────────────────────────────────────────
function CheckoutHeader({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-dark border-b border-gold-dim">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate("/cart")}
          className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors text-sm"
          data-ocid="checkout.back.button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>
        <button
          type="button"
          onClick={() => onNavigate("/")}
          className="font-luxury text-2xl font-bold text-gold gold-glow tracking-[0.3em] absolute left-1/2 -translate-x-1/2"
          data-ocid="checkout.logo.link"
        >
          ALVRA
        </button>
        <div className="w-20" />
      </div>
    </header>
  );
}

// ─── Order Success Screen ─────────────────────────────────────────────────────
function OrderSuccess({
  orders,
  totalPaid,
  couponUsed,
  onNavigate,
}: {
  orders: Order[];
  totalPaid: number;
  couponUsed: string | null;
  onNavigate: (path: string) => void;
}) {
  const firstOrderId = orders[0]?.id?.toString() ?? "—";
  const whatsappMessage = `Hi, I just placed order #${firstOrderId} for ALVRA perfume!`;
  const whatsappUrl = `https://wa.me/918787673730?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-[60vh] flex items-center justify-center px-4"
      data-ocid="checkout.success.panel"
    >
      <div className="bg-obsidian-2 border border-gold-dim rounded-3xl p-8 md:p-12 text-center max-w-lg w-full gold-glow-box">
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
          className="w-20 h-20 rounded-full bg-gold/10 border border-gold-dim flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-gold" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-luxury text-3xl font-bold text-gold gold-glow mb-2">
            Order Placed!
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Thank you for choosing ALVRA. Your order is confirmed!
          </p>

          {/* Order details */}
          <div className="bg-obsidian-3 border border-border rounded-2xl p-4 mb-6 text-left space-y-2.5">
            {orders.map((order) => (
              <div
                key={order.id.toString()}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-muted-foreground">
                  Order #{order.id.toString()}
                </span>
                <span className="text-foreground font-medium">
                  ₹{Number(order.totalPrice).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
            <Separator className="bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-foreground font-bold">Total Paid</span>
              <span className="font-luxury text-xl font-bold text-gold">
                ₹{totalPaid.toLocaleString("en-IN")}
              </span>
            </div>
            {couponUsed && (
              <div className="flex items-center gap-2 text-xs text-green-400 mt-1">
                <Tag className="w-3 h-3" />
                <span>Coupon {couponUsed} applied</span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
            We will deliver your premium fragrance within 5–7 business days.
            You'll receive updates via WhatsApp.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
              data-ocid="checkout.whatsapp.button"
            >
              <Button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold gap-2 py-5">
                <MessageCircle className="w-4 h-4" />
                Message on WhatsApp
              </Button>
            </a>
            <Button
              onClick={() => {
                localStorage.removeItem("alvra_coupon");
                localStorage.removeItem("alvra_coupon_discount");
                onNavigate("/");
              }}
              variant="outline"
              className="flex-1 border-gold-dim text-gold hover:bg-gold hover:text-obsidian font-bold py-5"
              data-ocid="checkout.continue.button"
            >
              Continue Shopping
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Checkout Page ────────────────────────────────────────────────────────────
export default function CheckoutPage({ onNavigate }: CheckoutPageProps) {
  const { identity } = useInternetIdentity();
  const { data: cartItems = [], isLoading: cartLoading } = useGetCart();
  const { data: backendProducts = [] } = useGetAllProducts();
  const placeOrder = usePlaceOrderWithAddress();
  const clearCart = useClearCart();
  const validateCoupon = useValidateCoupon();

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [pin, setPin] = useState("");
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

  const [isPlacing, setIsPlacing] = useState(false);
  const [completedOrders, setCompletedOrders] = useState<Order[] | null>(null);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!code) return;
    validateCoupon.mutate(code, {
      onSuccess: (result) => {
        const discountAmount = Number(result.discountAmount);
        setAppliedCoupon({ code: result.code, discount: discountAmount });
        localStorage.setItem("alvra_coupon", result.code);
        localStorage.setItem("alvra_coupon_discount", String(discountAmount));
        toast.success(`Coupon applied! ₹${discountAmount} OFF`);
      },
      onError: () => {
        toast.error("Invalid coupon code.");
      },
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Full name is required.";
    if (!phone.trim()) newErrors.phone = "Phone number is required.";
    else if (!/^\d{10}$/.test(phone.trim()))
      newErrors.phone = "Enter a valid 10-digit phone number.";
    if (!street.trim()) newErrors.street = "Street address is required.";
    if (!city.trim()) newErrors.city = "City is required.";
    if (!pin.trim()) newErrors.pin = "PIN code is required.";
    else if (!/^\d{6}$/.test(pin.trim()))
      newErrors.pin = "Enter a valid 6-digit PIN code.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) {
      toast.error("Please fix the errors before placing your order.");
      return;
    }

    setIsPlacing(true);
    try {
      const couponCode = appliedCoupon?.code ?? null;
      const orders = await Promise.all(
        cartItems.map((item) =>
          placeOrder.mutateAsync({
            productId: item.productId,
            quantity: item.quantity,
            couponCode,
            customerName: name.trim(),
            customerPhone: phone.trim(),
            street: street.trim(),
            city: city.trim(),
            pinCode: pin.trim(),
          }),
        ),
      );

      // Clear cart after success
      await clearCart.mutateAsync();

      setCompletedOrders(orders);
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  // ─── Auth guard ────────────────────────────────────────────────────────────
  if (!identity) {
    return (
      <div className="min-h-screen bg-obsidian">
        <CheckoutHeader onNavigate={onNavigate} />
        <div className="flex items-center justify-center min-h-screen px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-obsidian-2 border border-gold-dim rounded-3xl p-10 text-center max-w-md"
          >
            <ShoppingBag className="w-14 h-14 text-gold mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">
              Sign In to Checkout
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Please sign in to complete your purchase.
            </p>
            <Button
              onClick={() => onNavigate("/login")}
              className="bg-gold text-obsidian font-bold hover:bg-gold-bright"
              data-ocid="checkout.login.primary_button"
            >
              Sign In
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (cartLoading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  // ─── Empty cart ────────────────────────────────────────────────────────────
  if (cartItems.length === 0 && !completedOrders) {
    return (
      <div className="min-h-screen bg-obsidian">
        <CheckoutHeader onNavigate={onNavigate} />
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm"
          >
            <Package className="w-16 h-16 text-gold-dim mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">
              No Items to Checkout
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Your cart is empty. Add some products before proceeding.
            </p>
            <Button
              onClick={() => onNavigate("/")}
              className="bg-gold text-obsidian font-bold hover:bg-gold-bright"
              data-ocid="checkout.shop_now.primary_button"
            >
              Shop Now
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Success screen ────────────────────────────────────────────────────────
  if (completedOrders) {
    return (
      <div className="min-h-screen bg-obsidian">
        <CheckoutHeader onNavigate={onNavigate} />
        <div className="pt-20">
          <OrderSuccess
            orders={completedOrders}
            totalPaid={total || subtotal}
            couponUsed={appliedCoupon?.code ?? null}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    );
  }

  // ─── Checkout form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-obsidian">
      <CheckoutHeader onNavigate={onNavigate} />

      <main className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gold gold-glow">
            Checkout
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete your order in just a few steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Delivery Details Form ── */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-obsidian-2 border border-border rounded-2xl p-6"
            >
              <h2 className="font-display text-xl font-bold text-gold mb-6 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Delivery Details
              </h2>

              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Full Name *
                  </Label>
                  <Input
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name)
                        setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    className="bg-obsidian-3 border-border focus:border-gold text-foreground placeholder:text-muted-foreground"
                    data-ocid="checkout.name.input"
                  />
                  {errors.name && (
                    <p
                      className="text-xs text-destructive mt-1"
                      data-ocid="checkout.name.error_state"
                    >
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Phone Number *
                  </Label>
                  <Input
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                      if (errors.phone)
                        setErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                    className="bg-obsidian-3 border-border focus:border-gold text-foreground placeholder:text-muted-foreground"
                    data-ocid="checkout.phone.input"
                    inputMode="numeric"
                  />
                  {errors.phone && (
                    <p
                      className="text-xs text-destructive mt-1"
                      data-ocid="checkout.phone.error_state"
                    >
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Street */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Street Address *
                  </Label>
                  <Input
                    placeholder="House no., Street, Area, Locality"
                    value={street}
                    onChange={(e) => {
                      setStreet(e.target.value);
                      if (errors.street)
                        setErrors((prev) => ({ ...prev, street: "" }));
                    }}
                    className="bg-obsidian-3 border-border focus:border-gold text-foreground placeholder:text-muted-foreground"
                    data-ocid="checkout.street.input"
                  />
                  {errors.street && (
                    <p
                      className="text-xs text-destructive mt-1"
                      data-ocid="checkout.street.error_state"
                    >
                      {errors.street}
                    </p>
                  )}
                </div>

                {/* City & PIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      City *
                    </Label>
                    <Input
                      placeholder="City"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        if (errors.city)
                          setErrors((prev) => ({ ...prev, city: "" }));
                      }}
                      className="bg-obsidian-3 border-border focus:border-gold text-foreground placeholder:text-muted-foreground"
                      data-ocid="checkout.city.input"
                    />
                    {errors.city && (
                      <p
                        className="text-xs text-destructive mt-1"
                        data-ocid="checkout.city.error_state"
                      >
                        {errors.city}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      PIN Code *
                    </Label>
                    <Input
                      placeholder="6-digit PIN code"
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                        if (errors.pin)
                          setErrors((prev) => ({ ...prev, pin: "" }));
                      }}
                      className="bg-obsidian-3 border-border focus:border-gold text-foreground placeholder:text-muted-foreground"
                      data-ocid="checkout.pin.input"
                      inputMode="numeric"
                    />
                    {errors.pin && (
                      <p
                        className="text-xs text-destructive mt-1"
                        data-ocid="checkout.pin.error_state"
                      >
                        {errors.pin}
                      </p>
                    )}
                  </div>
                </div>

                {/* Coupon */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3 h-3" />
                    Coupon Code (optional)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleApplyCoupon()
                      }
                      className="bg-obsidian-3 border-border focus:border-gold text-foreground placeholder:text-muted-foreground uppercase"
                      data-ocid="checkout.coupon.input"
                      disabled={!!appliedCoupon}
                    />
                    {appliedCoupon ? (
                      <Button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponInput("");
                        }}
                        variant="outline"
                        className="border-destructive/50 text-destructive hover:bg-destructive/10 text-sm"
                        data-ocid="checkout.remove_coupon.button"
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={
                          validateCoupon.isPending || !couponInput.trim()
                        }
                        variant="outline"
                        className="border-gold-dim text-gold hover:bg-gold hover:text-obsidian text-sm font-bold flex-shrink-0"
                        data-ocid="checkout.apply_coupon.button"
                      >
                        {validateCoupon.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {appliedCoupon.code} applied — ₹{appliedCoupon.discount}{" "}
                      OFF
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Order Summary ── */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-obsidian-2 border border-border rounded-2xl p-6 sticky top-24"
            >
              <h2 className="font-display text-xl font-bold text-gold mb-5 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Order Summary
              </h2>

              {/* Items list */}
              <div className="space-y-3 mb-5">
                {cartItems.map((item, index) => {
                  const info = getProductInfo(item.productId);
                  return (
                    <div
                      key={item.productId.toString()}
                      className="flex items-center gap-3"
                      data-ocid={`checkout.order.item.${index + 1}`}
                    >
                      <div className="w-12 h-14 rounded-lg overflow-hidden bg-obsidian-3 flex-shrink-0">
                        <img
                          src={info.image}
                          alt={info.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {info.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {Number(item.quantity)}
                        </p>
                      </div>
                      <span className="text-gold font-bold text-sm flex-shrink-0">
                        ₹
                        {(info.price * Number(item.quantity)).toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Separator className="bg-border mb-4" />

              {/* Price breakdown */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-400">
                      −₹{discount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-green-400 text-xs font-medium">
                    FREE
                  </span>
                </div>
              </div>

              <Separator className="bg-border mb-4" />

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-luxury text-2xl font-bold text-gold">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

              <Button
                onClick={handlePlaceOrder}
                disabled={isPlacing}
                className="w-full bg-gold text-obsidian font-bold text-base py-5 hover:bg-gold-bright transition-all hover:scale-[1.02] shadow-gold disabled:opacity-70 disabled:scale-100"
                data-ocid="checkout.place_order.primary_button"
              >
                {isPlacing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order →"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-3">
                Secure order • Free delivery
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
