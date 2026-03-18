import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  MessageCircle,
  Package,
  ShoppingBag,
  Smartphone,
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
import { readAll } from "../utils/contentStore";

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
// COD_CHARGE and EMI_DISCOUNT are loaded dynamically from contentStore inside the component

type PaymentMethod = "upi" | "cod" | "emi";
type EmiPlan = "3" | "6" | "12";

// ─── Checkout Header ──────────────────────────────────────────────────────────
function CheckoutHeader({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-b border-gold-dim">
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
  paymentMethod,
  onNavigate,
}: {
  orders: Order[];
  totalPaid: number;
  couponUsed: string | null;
  paymentMethod: PaymentMethod;
  onNavigate: (path: string) => void;
}) {
  const firstOrderId = orders[0]?.id?.toString() ?? "—";
  const methodLabel =
    paymentMethod === "upi"
      ? "UPI"
      : paymentMethod === "cod"
        ? "Cash on Delivery"
        : "EMI";
  const whatsappMessage = `Hi, I just placed order #${firstOrderId} for ALVRA perfume! Payment: ${methodLabel}`;
  const whatsappUrl = `https://wa.me/918787673730?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-[60vh] flex items-center justify-center px-4"
      data-ocid="checkout.success.panel"
    >
      <div className="bg-card border border-gold-dim rounded-3xl p-8 md:p-12 text-center max-w-lg w-full gold-glow-box">
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
          <p className="text-muted-foreground text-sm mb-2">
            Thank you for choosing ALVRA. Your order is confirmed!
          </p>
          <div className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            {paymentMethod === "upi" ? (
              <Smartphone className="w-3 h-3" />
            ) : paymentMethod === "cod" ? (
              <Package className="w-3 h-3" />
            ) : (
              <CreditCard className="w-3 h-3" />
            )}
            Payment: {methodLabel}
          </div>

          <div className="bg-obsidian-2 border border-border rounded-2xl p-4 mb-6 text-left space-y-2.5">
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

// ─── Payment Method Card ──────────────────────────────────────────────────────
function PaymentCard({
  selected,
  onSelect,
  icon,
  title,
  subtitle,
  dataOcid,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  dataOcid: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
        selected
          ? "border-teal-500 bg-teal-50 shadow-md"
          : "border-border bg-card hover:border-teal-300"
      }`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      data-ocid={dataOcid}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            selected
              ? "bg-teal-500 text-white"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <p
            className={`font-bold text-sm ${selected ? "text-teal-700" : "text-foreground"}`}
          >
            {title}
          </p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            selected ? "border-teal-500 bg-teal-500" : "border-border"
          }`}
        >
          {selected && <div className="w-2 h-2 bg-white rounded-full" />}
        </div>
      </div>
      {selected && children && (
        <div
          className="mt-4 pt-3 border-t border-teal-200"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
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

  // Load dynamic payment settings from admin contentStore
  const cm = readAll();
  const ADMIN_UPI = cm["settings.admin_upi"] || "alvra@upi";
  const PAYMENT_INSTRUCTIONS =
    cm["settings.payment_instructions"] ||
    "Pay to the UPI ID above and share screenshot on WhatsApp.";
  const COD_CHARGE = Number.parseInt(cm["settings.cod_charge"] || "50");
  const EMI_DISCOUNT = Number.parseInt(cm["settings.emi_discount"] || "600");

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

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [upiId, setUpiId] = useState("");
  const [emiPlan, setEmiPlan] = useState<EmiPlan>("3");

  const [isPlacing, setIsPlacing] = useState(false);
  const [completedOrders, setCompletedOrders] = useState<Order[] | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedUpi = localStorage.getItem("alvra_upi_id");
    if (savedUpi) setUpiId(savedUpi);
  }, []);

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

  const couponDiscount = appliedCoupon?.discount ?? 0;
  const emiDiscount =
    paymentMethod === "emi" ? EMI_DISCOUNT * cartItems.length : 0;
  const codSurcharge = paymentMethod === "cod" ? COD_CHARGE : 0;
  const totalDiscount = couponDiscount + emiDiscount;
  const total = Math.max(0, subtotal - totalDiscount + codSurcharge);

  const emiMonthly = (months: number, interestRate: number) =>
    Math.ceil((total * (1 + interestRate)) / months);

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
    if (paymentMethod === "upi" && !upiId.trim())
      newErrors.upiId = "UPI ID is required.";
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
      const paymentNote =
        paymentMethod === "upi"
          ? `UPI: ${upiId}`
          : paymentMethod === "cod"
            ? "Cash on Delivery"
            : `EMI: ${emiPlan} months`;

      const orders = await Promise.all(
        cartItems.map((item) =>
          placeOrder.mutateAsync({
            productId: item.productId,
            quantity: item.quantity,
            couponCode,
            customerName: name.trim(),
            customerPhone: phone.trim(),
            street: `${street.trim()} | Payment: ${paymentNote}`,
            city: city.trim(),
            pinCode: pin.trim(),
          }),
        ),
      );

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
      <div className="min-h-screen bg-background">
        <CheckoutHeader onNavigate={onNavigate} />
        <div className="flex items-center justify-center min-h-screen px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-gold-dim rounded-3xl p-10 text-center max-w-md"
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
      <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background">
        <CheckoutHeader onNavigate={onNavigate} />
        <div className="pt-20">
          <OrderSuccess
            orders={completedOrders}
            totalPaid={total || subtotal}
            couponUsed={appliedCoupon?.code ?? null}
            paymentMethod={paymentMethod}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    );
  }

  // ─── Checkout form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
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
          {/* ── Left: Delivery + Payment ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h2 className="font-display text-xl font-bold text-gold mb-6 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Delivery Details
              </h2>

              <div className="space-y-4">
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
                    className="bg-background border-border focus:border-gold text-foreground placeholder:text-muted-foreground"
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
                    className="bg-background border-border focus:border-gold text-foreground placeholder:text-muted-foreground"
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
                    className="bg-background border-border focus:border-gold text-foreground placeholder:text-muted-foreground"
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
                      className="bg-background border-border focus:border-gold text-foreground placeholder:text-muted-foreground"
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
                      className="bg-background border-border focus:border-gold text-foreground placeholder:text-muted-foreground"
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
                      className="bg-background border-border focus:border-gold text-foreground placeholder:text-muted-foreground uppercase"
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

            {/* ── Payment Method ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h2 className="font-display text-xl font-bold text-gold mb-5 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Choose Payment Method
              </h2>

              <div className="space-y-3">
                {/* UPI */}
                <PaymentCard
                  selected={paymentMethod === "upi"}
                  onSelect={() => setPaymentMethod("upi")}
                  icon={<Smartphone className="w-5 h-5" />}
                  title="UPI Payment"
                  subtitle="PhonePe, GPay, Paytm & more"
                  dataOcid="checkout.payment_method.upi.radio"
                >
                  <div className="space-y-2">
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-3">
                      <p className="text-xs text-teal-600 font-medium uppercase tracking-wide mb-1">
                        Pay To
                      </p>
                      <p className="text-teal-800 font-bold text-lg">
                        {ADMIN_UPI}
                      </p>
                      <p className="text-teal-600 text-xs mt-1">
                        {PAYMENT_INSTRUCTIONS}
                      </p>
                    </div>
                    <Label className="text-xs font-semibold text-teal-700">
                      Enter Your UPI ID (for payment confirmation) *
                    </Label>
                    <Input
                      value={upiId}
                      onChange={(e) => {
                        setUpiId(e.target.value);
                        if (errors.upiId)
                          setErrors((prev) => ({ ...prev, upiId: "" }));
                      }}
                      placeholder="9876543210@upi or name@okaxis"
                      className="bg-white border-teal-200 focus:border-teal-500"
                      data-ocid="checkout.upi_id.input"
                    />
                    {errors.upiId && (
                      <p className="text-xs text-destructive">{errors.upiId}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Supported: PhonePe, Google Pay, Paytm, BHIM, Amazon Pay
                    </p>
                  </div>
                </PaymentCard>

                {/* COD */}
                <PaymentCard
                  selected={paymentMethod === "cod"}
                  onSelect={() => setPaymentMethod("cod")}
                  icon={<Banknote className="w-5 h-5" />}
                  title="Cash on Delivery"
                  subtitle={`Pay when you receive • ₹${COD_CHARGE} COD charges apply`}
                  dataOcid="checkout.payment_method.cod.radio"
                >
                  <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
                    <span className="text-amber-500 text-lg">📦</span>
                    <p className="text-xs text-amber-700">
                      ₹{COD_CHARGE} COD charge will be added to your total. Keep
                      exact change ready.
                    </p>
                  </div>
                </PaymentCard>

                {/* EMI */}
                <PaymentCard
                  selected={paymentMethod === "emi"}
                  onSelect={() => setPaymentMethod("emi")}
                  icon={<CreditCard className="w-5 h-5" />}
                  title="EMI — Easy Monthly Installments"
                  subtitle="No-cost EMI on 3 months • Save ₹600!"
                  dataOcid="checkout.payment_method.emi.radio"
                >
                  <div className="space-y-3">
                    {/* EMI Offer badge */}
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <Sparkles className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <p className="text-xs text-green-700 font-semibold">
                        EMI Offer Applied: ₹{EMI_DISCOUNT} OFF per item!
                      </p>
                    </div>

                    {/* EMI Plan Selector */}
                    <Label className="text-xs font-semibold text-teal-700">
                      Select EMI Plan
                    </Label>
                    <div
                      className="grid grid-cols-3 gap-2"
                      data-ocid="checkout.emi_plan.select"
                    >
                      {(
                        [
                          { months: "3", rate: 0, label: "No interest" },
                          { months: "6", rate: 0.05, label: "5% interest" },
                          { months: "12", rate: 0.1, label: "10% interest" },
                        ] as const
                      ).map(({ months, rate, label }) => (
                        <button
                          key={months}
                          type="button"
                          onClick={() => setEmiPlan(months)}
                          className={`rounded-lg p-2.5 border-2 text-center transition-all ${
                            emiPlan === months
                              ? "border-teal-500 bg-teal-50"
                              : "border-border hover:border-teal-300"
                          }`}
                        >
                          <p
                            className={`font-black text-lg ${
                              emiPlan === months
                                ? "text-teal-700"
                                : "text-foreground"
                            }`}
                          >
                            {months}mo
                          </p>
                          <p
                            className={`text-xs font-bold ${
                              emiPlan === months
                                ? "text-teal-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            ₹{emiMonthly(Number(months), rate)}/mo
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {label}
                          </p>
                        </button>
                      ))}
                    </div>

                    {/* Banks */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        Available on cards from:
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {["HDFC", "ICICI", "SBI", "Axis"].map((bank) => (
                          <Badge
                            key={bank}
                            variant="outline"
                            className="text-xs border-teal-200 text-teal-700 bg-teal-50"
                          >
                            {bank}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </PaymentCard>
              </div>
            </motion.div>
          </div>

          {/* ── Order Summary ── */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-2xl p-6 sticky top-24"
            >
              <h2 className="font-display text-xl font-bold text-gold mb-5 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Order Summary
              </h2>

              <div className="space-y-3 mb-5">
                {cartItems.map((item, index) => {
                  const info = getProductInfo(item.productId);
                  return (
                    <div
                      key={item.productId.toString()}
                      className="flex items-center gap-3"
                      data-ocid={`checkout.order.item.${index + 1}`}
                    >
                      <div className="w-12 h-14 rounded-lg overflow-hidden bg-obsidian-2 flex-shrink-0">
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

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Coupon Discount
                    </span>
                    <span className="text-green-400">
                      −₹{couponDiscount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                {emiDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-green-500" />
                      EMI Offer
                    </span>
                    <span className="text-green-400 font-semibold">
                      −₹{emiDiscount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                {codSurcharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">COD Charge</span>
                    <span className="text-amber-500">+₹{codSurcharge}</span>
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

              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-luxury text-2xl font-bold text-gold">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

              {paymentMethod === "emi" && (
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 mb-4 text-center">
                  <p className="text-xs text-teal-600 font-semibold">
                    ₹
                    {emiMonthly(
                      Number(emiPlan),
                      emiPlan === "3" ? 0 : emiPlan === "6" ? 0.05 : 0.1,
                    )}
                    /month for {emiPlan} months
                  </p>
                </div>
              )}

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
