import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  Crown,
  Heart,
  Package,
  Shield,
  Smartphone,
  Star,
  Trophy,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Profile {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Order {
  id: string;
  date: string;
  items: string[];
  total: number;
  status: "Delivered" | "Processing" | "Confirmed";
}

interface WishlistProduct {
  id: number;
  name: string;
  image: string;
  price: number;
  mrp: number;
}

export default function ProfilePage({
  onNavigate,
}: { onNavigate: (path: string) => void }) {
  const [profile, setProfile] = useState<Profile>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // Payment details
  const [upiId, setUpiId] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankHolder, setBankHolder] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);
  const [highScore, setHighScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<
    { name: string; score: number }[]
  >([]);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("alvra_profile");
    if (stored) setProfile(JSON.parse(stored));

    setUpiId(localStorage.getItem("alvra_upi_id") || "");
    setBankAccount(localStorage.getItem("alvra_bank_account") || "");
    setBankIfsc(localStorage.getItem("alvra_bank_ifsc") || "");
    setBankHolder(localStorage.getItem("alvra_bank_holder") || "");

    const storedOrders = localStorage.getItem("alvra_orders");
    if (storedOrders) setOrders(JSON.parse(storedOrders));

    const storedWishlist = localStorage.getItem("alvra_wishlist");
    if (storedWishlist) setWishlist(JSON.parse(storedWishlist));

    const hs = localStorage.getItem("alvra_highscore");
    if (hs) setHighScore(Number(hs));

    const lb = localStorage.getItem("alvra_leaderboard");
    if (lb) setLeaderboard(JSON.parse(lb));

    const dn = localStorage.getItem("alvra_displayname");
    if (dn) setDisplayName(dn);
  }, []);

  const saveProfile = () => {
    localStorage.setItem("alvra_profile", JSON.stringify(profile));
    toast.success("Profile saved!");
  };

  const savePaymentDetails = () => {
    localStorage.setItem("alvra_upi_id", upiId.trim());
    localStorage.setItem("alvra_bank_account", bankAccount.trim());
    localStorage.setItem("alvra_bank_ifsc", bankIfsc.trim().toUpperCase());
    localStorage.setItem("alvra_bank_holder", bankHolder.trim());
    toast.success("Payment details saved securely!");
  };

  const removeFromWishlist = (id: number) => {
    const updated = wishlist.filter((p) => p.id !== id);
    setWishlist(updated);
    localStorage.setItem("alvra_wishlist", JSON.stringify(updated));
    toast.success("Removed from wishlist");
  };

  const saveDisplayName = () => {
    localStorage.setItem("alvra_displayname", displayName);
    toast.success("Display name updated!");
  };

  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const statusColor = (status: Order["status"]) => {
    if (status === "Delivered") return "bg-emerald-100 text-emerald-700";
    if (status === "Processing") return "bg-amber-100 text-amber-700";
    return "bg-teal-100 text-teal-700";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-border shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate("/")}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            data-ocid="profile.back.button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-luxury font-bold text-lg text-foreground">
            My Profile
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-lg mb-3"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.58 0.16 186), oklch(0.72 0.18 55))",
            }}
          >
            {initials !== "U" ? initials : <User className="w-9 h-9" />}
          </div>
          <p className="font-bold text-foreground text-base">
            {profile.name || "Guest User"}
          </p>
          <p className="text-muted-foreground text-sm">
            {profile.email || "No email set"}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details">
          <TabsList className="grid grid-cols-5 w-full mb-4">
            <TabsTrigger
              value="details"
              className="text-[10px] px-1"
              data-ocid="profile.tabs.details.tab"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="payment"
              className="text-[10px] px-1"
              data-ocid="profile.tabs.payment.tab"
            >
              Payment
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="text-[10px] px-1"
              data-ocid="profile.tabs.orders.tab"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="wishlist"
              className="text-[10px] px-1"
              data-ocid="profile.tabs.wishlist.tab"
            >
              Wishlist
            </TabsTrigger>
            <TabsTrigger
              value="scores"
              className="text-[10px] px-1"
              data-ocid="profile.tabs.scores.tab"
            >
              Scores
            </TabsTrigger>
          </TabsList>

          {/* My Details */}
          <TabsContent value="details">
            <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Full Name
                </Label>
                <Input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  placeholder="Your full name"
                  data-ocid="profile.name.input"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Email
                </Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  placeholder="your@email.com"
                  data-ocid="profile.email.input"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Phone
                </Label>
                <Input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  placeholder="+91 9876543210"
                  data-ocid="profile.phone.input"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Delivery Address
                </Label>
                <Textarea
                  value={profile.address}
                  onChange={(e) =>
                    setProfile({ ...profile, address: e.target.value })
                  }
                  placeholder="House/Flat no., Street, City, State, PIN"
                  rows={3}
                  data-ocid="profile.address.textarea"
                />
              </div>
              <Button
                className="w-full font-bold text-white"
                style={{ background: "oklch(0.58 0.16 186)" }}
                onClick={saveProfile}
                data-ocid="profile.save.button"
              >
                Save Profile
              </Button>
            </div>
          </TabsContent>

          {/* Payment Details */}
          <TabsContent value="payment">
            <div className="space-y-4">
              {/* UPI Section */}
              <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">
                      UPI Details
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      PhonePe, GPay, Paytm & more
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                    UPI ID
                  </Label>
                  <Input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="9876543210@upi or name@okaxis"
                    data-ocid="profile.payment.upi_id.input"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    e.g., 9876543210@paytm, yourname@oksbi
                  </p>
                </div>
              </div>

              {/* Bank Details Section */}
              <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Banknote className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">
                      Bank Account
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      For refunds and transfers
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                    Account Holder Name
                  </Label>
                  <Input
                    value={bankHolder}
                    onChange={(e) => setBankHolder(e.target.value)}
                    placeholder="Name as on bank account"
                    data-ocid="profile.payment.holder.input"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                    Account Number
                  </Label>
                  <Input
                    value={bankAccount}
                    onChange={(e) =>
                      setBankAccount(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Enter bank account number"
                    inputMode="numeric"
                    data-ocid="profile.payment.bank_account.input"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                    IFSC Code
                  </Label>
                  <Input
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g., HDFC0001234"
                    data-ocid="profile.payment.ifsc.input"
                  />
                </div>
              </div>

              {/* Security Note */}
              <div className="flex items-start gap-3 bg-teal-50 rounded-xl p-3 border border-teal-100">
                <Shield className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-teal-700">
                  Your payment details are saved securely on your device. We
                  never store them on our servers.
                </p>
              </div>

              <Button
                className="w-full font-bold text-white"
                style={{ background: "oklch(0.58 0.16 186)" }}
                onClick={savePaymentDetails}
                data-ocid="profile.payment.save.button"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Save Payment Details
              </Button>
            </div>
          </TabsContent>

          {/* My Orders */}
          <TabsContent value="orders">
            {orders.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-border"
                data-ocid="profile.orders.empty_state"
              >
                <Package className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="font-bold text-foreground mb-1">No orders yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Start shopping!
                </p>
                <Button
                  variant="outline"
                  onClick={() => onNavigate("/")}
                  className="text-sm"
                >
                  Browse Products
                </Button>
              </div>
            ) : (
              <div className="space-y-3" data-ocid="profile.orders.list">
                {orders.map((order, i) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl border border-border p-4 shadow-sm"
                    data-ocid={`profile.orders.item.${i + 1}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-foreground text-sm">
                          Order #{order.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.date}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="space-y-1 mb-2">
                      {order.items.map((item, j) => (
                        <p
                          key={`${order.id}-${j}`}
                          className="text-xs text-foreground"
                        >
                          • {item}
                        </p>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Total
                      </span>
                      <span className="font-bold text-gold text-sm">
                        ₹{order.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Wishlist */}
          <TabsContent value="wishlist">
            {wishlist.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-border"
                data-ocid="profile.wishlist.empty_state"
              >
                <Heart className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="font-bold text-foreground mb-1">
                  Your wishlist is empty
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Save products you love!
                </p>
                <Button
                  variant="outline"
                  onClick={() => onNavigate("/")}
                  className="text-sm"
                >
                  Browse Products
                </Button>
              </div>
            ) : (
              <div className="space-y-3" data-ocid="profile.wishlist.list">
                {wishlist.map((product, i) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-border p-3 shadow-sm flex items-center gap-3"
                    data-ocid={`profile.wishlist.item.${i + 1}`}
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-bold text-gold text-sm">
                          ₹{product.price}
                        </span>
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{product.mrp}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className="w-2.5 h-2.5 text-amber-400 fill-amber-400"
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromWishlist(product.id)}
                      className="p-2 rounded-full hover:bg-rose-50 transition-colors"
                      aria-label="Remove from wishlist"
                    >
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Game Scores */}
          <TabsContent value="scores">
            <div className="space-y-4" data-ocid="profile.scores.panel">
              {/* Personal Best */}
              <div
                className="rounded-xl p-5 text-white text-center shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.58 0.16 186), oklch(0.48 0.18 265))",
                }}
              >
                <Trophy className="w-10 h-10 mx-auto mb-2 text-amber-300" />
                <p className="text-sm font-semibold opacity-80 mb-1">
                  Your Best Score
                </p>
                <p className="text-5xl font-black">{highScore || 0}</p>
                <p className="text-xs opacity-70 mt-1">ALVRA Runner</p>
              </div>

              {/* Display Name */}
              <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Leaderboard Display Name
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    data-ocid="profile.displayname.input"
                  />
                  <Button
                    onClick={saveDisplayName}
                    className="text-white font-bold flex-shrink-0"
                    style={{ background: "oklch(0.58 0.16 186)" }}
                    data-ocid="profile.displayname.save.button"
                  >
                    Save
                  </Button>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" /> Leaderboard
                  </h3>
                </div>
                {leaderboard.length === 0 ? (
                  <div
                    className="py-8 text-center text-sm text-muted-foreground"
                    data-ocid="profile.scores.empty_state"
                  >
                    No scores yet. Play ALVRA Runner!
                  </div>
                ) : (
                  <div>
                    {leaderboard
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 10)
                      .map((entry, i) => {
                        const medals = ["🥇", "🥈", "🥉"];
                        const bgClass =
                          i === 0
                            ? "bg-amber-50"
                            : i === 1
                              ? "bg-slate-50"
                              : i === 2
                                ? "bg-orange-50"
                                : "";
                        return (
                          <div
                            key={`${entry.name}-${entry.score}-${i}`}
                            className={`flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 ${bgClass}`}
                          >
                            <span className="text-lg w-6 text-center">
                              {i < 3 ? medals[i] : `${i + 1}`}
                            </span>
                            <span className="flex-1 font-semibold text-foreground text-sm">
                              {entry.name || "Anonymous"}
                            </span>
                            <span className="font-black text-gold">
                              {entry.score}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="text-center mt-10 text-xs text-muted-foreground px-4">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </div>
    </div>
  );
}
