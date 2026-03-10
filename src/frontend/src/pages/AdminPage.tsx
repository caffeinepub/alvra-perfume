import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  GripVertical,
  Loader2,
  LogOut,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { clearAll, readAll, writeKey, writeMany } from "../utils/contentStore";
import AdminLoginPage, { adminLogout, isAdminLoggedIn } from "./AdminLoginPage";

// ─── Image compression ────────────────────────────────────────────────────────
function compressToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select an image file (jpg, png, webp, etc.)"));
      return;
    }
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const MAX = 700;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const r = Math.min(MAX / width, MAX / height);
        width = Math.round(width * r);
        height = Math.round(height * r);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      let q = 0.78;
      let url = canvas.toDataURL("image/jpeg", q);
      while (url.length > 180_000 && q > 0.2) {
        q -= 0.1;
        url = canvas.toDataURL("image/jpeg", q);
      }
      resolve(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      reject(new Error("Could not read image"));
    };
    img.src = objUrl;
  });
}

// ─── Image Drop Zone ──────────────────────────────────────────────────────────
function ImageDropZone({
  currentSrc,
  fallbackSrc,
  label,
  onImageChange,
  ocid,
}: {
  currentSrc?: string;
  fallbackSrc: string;
  label: string;
  onImageChange: (dataUrl: string) => void;
  ocid: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const displaySrc = currentSrc || fallbackSrc;

  const handleFile = async (file: File) => {
    setProcessing(true);
    try {
      const dataUrl = await compressToDataUrl(file);
      onImageChange(dataUrl);
      toast.success("Image ready — click Save to apply it.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load image");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <button
      type="button"
      className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all cursor-pointer w-full ${
        dragOver
          ? "border-gold bg-gold/10"
          : "border-border hover:border-gold/60"
      }`}
      style={{ minHeight: 120 }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) void handleFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      data-ocid={ocid}
      aria-label={`Image upload for ${label}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      {processing ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2 text-gold">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-xs">Compressing image...</span>
        </div>
      ) : (
        <div className="relative group">
          <img
            src={displaySrc}
            alt={label}
            className="w-full h-32 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackSrc;
            }}
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Upload className="w-5 h-5 text-gold" />
            <span className="text-gold text-sm font-medium">Change Image</span>
          </div>
          {currentSrc && currentSrc !== fallbackSrc && (
            <div className="absolute top-2 right-2 bg-gold text-obsidian text-xs font-bold px-2 py-0.5 rounded-full">
              Custom
            </div>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Editable Field ───────────────────────────────────────────────────────────
function EditableField({
  label,
  value,
  onChange,
  multiline = false,
  ocid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  ocid: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="bg-background border-border focus:border-gold text-foreground resize-none text-sm"
          data-ocid={ocid}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-background border-border focus:border-gold text-foreground text-sm"
          data-ocid={ocid}
        />
      )}
    </div>
  );
}

// ─── Draggable Section Wrapper ────────────────────────────────────────────────
function Section({
  sectionId,
  title,
  children,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: {
  sectionId: string;
  title: string;
  children: React.ReactNode;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (id: string) => void;
  isDragging: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(sectionId)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(sectionId)}
      className={`bg-card border rounded-2xl transition-all ${
        isDragging ? "border-gold opacity-50" : "border-border"
      }`}
      data-ocid={`admin.${sectionId}.card`}
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border cursor-grab active:cursor-grabbing">
        <GripVertical
          className="w-5 h-5 text-muted-foreground hover:text-gold transition-colors flex-shrink-0"
          data-ocid={`admin.${sectionId}.drag_handle`}
        />
        <h3 className="font-display text-lg font-bold text-gold">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Save Button ──────────────────────────────────────────────────────────────
function SaveBtn({
  onClick,
  saving,
  label,
  ocid,
}: {
  onClick: () => void;
  saving: boolean;
  label: string;
  ocid: string;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={saving}
      className="bg-gold text-obsidian font-bold hover:bg-gold-bright gap-2 text-sm"
      data-ocid={ocid}
    >
      {saving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          {label}
        </>
      )}
    </Button>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
interface AdminPageProps {
  onNavigate: (path: string) => void;
}

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const [loggedIn, setLoggedIn] = useState(() => isAdminLoggedIn());
  const [saving, setSaving] = useState<string | null>(null);

  // Section ordering
  const DEFAULT_ORDER = ["hero", "products", "offer", "why", "custom-sectors"];
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_ORDER);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Custom sectors
  type CustomSectorItem = {
    id: string;
    name: string;
    tagline: string;
    price: string;
    style: string;
    image?: string;
  };
  const [customSectors, setCustomSectors] = useState<CustomSectorItem[]>([]);
  const [newSector, setNewSector] = useState<Omit<CustomSectorItem, "id">>({
    name: "",
    tagline: "",
    price: "",
    style: "Minimal",
  });
  const [newSectorImage, setNewSectorImage] = useState<string | undefined>();

  // Hero
  const [heroTitle, setHeroTitle] = useState("BE UNFORGETTABLE");
  const [heroSubtitle, setHeroSubtitle] = useState(
    "Premium perfumes designed for Formal & Party moments.",
  );
  const [heroImage, setHeroImage] = useState<string | undefined>();

  // Products
  const defaultProducts = [
    {
      name: "Men Formal",
      desc: "Fresh elegant fragrance",
      price: "₹799",
      image: undefined as string | undefined,
    },
    {
      name: "Men Party",
      desc: "Strong night fragrance",
      price: "₹799",
      image: undefined as string | undefined,
    },
    {
      name: "Women Formal",
      desc: "Soft floral fragrance",
      price: "₹799",
      image: undefined as string | undefined,
    },
    {
      name: "Women Party",
      desc: "Sweet seductive fragrance",
      price: "₹799",
      image: undefined as string | undefined,
    },
  ];
  const [products, setProducts] = useState(defaultProducts);

  // Offer
  const [offerTitle, setOfferTitle] = useState("🔥 Launch Offer");
  const [offerDesc, setOfferDesc] = useState(
    "Get ALVRA perfume today for just ₹199. Includes 50ml perfume, travel spray, thank you card, coupon & flower seeds.",
  );

  // Why
  const [features, setFeatures] = useState([
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
  ]);

  // ─── Load saved data on mount ────────────────────────────────────────────
  useEffect(() => {
    const cm = readAll();
    if (cm["hero.title"]) setHeroTitle(cm["hero.title"]);
    if (cm["hero.subtitle"]) setHeroSubtitle(cm["hero.subtitle"]);
    if (cm["hero.image"]) setHeroImage(cm["hero.image"]);
    if (cm["offer.title"]) setOfferTitle(cm["offer.title"]);
    if (cm["offer.desc"]) setOfferDesc(cm["offer.desc"]);
    setProducts((prev) =>
      prev.map((p, i) => ({
        name: cm[`product.${i + 1}.name`] ?? p.name,
        desc: cm[`product.${i + 1}.desc`] ?? p.desc,
        price: cm[`product.${i + 1}.price`] ?? p.price,
        image: cm[`product.${i + 1}.image`],
      })),
    );
    setFeatures((prev) =>
      prev.map((f, i) => ({
        title: cm[`why.${i + 1}.title`] ?? f.title,
        desc: cm[`why.${i + 1}.desc`] ?? f.desc,
      })),
    );
    if (cm["section.order"]) {
      try {
        const saved = JSON.parse(cm["section.order"]) as string[];
        if (Array.isArray(saved) && saved.length > 0) setSectionOrder(saved);
      } catch {
        /* ignore */
      }
    }
    if (cm["custom.sectors"]) {
      try {
        const saved = JSON.parse(cm["custom.sectors"]) as CustomSectorItem[];
        if (Array.isArray(saved)) setCustomSectors(saved);
      } catch {
        /* ignore */
      }
    }
  }, []);

  // ─── Generic save helper ─────────────────────────────────────────────────
  const doSave = (
    updates: Record<string, string>,
    sectionKey: string,
    sectionLabel: string,
  ) => {
    setSaving(sectionKey);
    try {
      writeMany(updates);
      toast.success(
        `${sectionLabel} saved! Changes are now live on your website.`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to save ${sectionLabel}.`,
      );
    } finally {
      setSaving(null);
    }
  };

  // ─── Section save handlers ───────────────────────────────────────────────
  const saveHero = () => {
    const updates: Record<string, string> = {
      "hero.title": heroTitle,
      "hero.subtitle": heroSubtitle,
    };
    if (heroImage) {
      updates["hero.image"] = heroImage;
    }
    doSave(updates, "hero", "Hero section");
  };

  const saveProduct = (i: number) => {
    const p = products[i];
    const updates: Record<string, string> = {
      [`product.${i + 1}.name`]: p.name,
      [`product.${i + 1}.desc`]: p.desc,
      [`product.${i + 1}.price`]: p.price,
    };
    if (p.image) {
      try {
        writeKey(`product.${i + 1}.image`, p.image);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Image too large");
        return;
      }
    }
    // Save text separately (won't fail due to image quota)
    doSave(updates, `product-${i + 1}`, `Product ${i + 1}`);
  };

  const saveOffer = () => {
    doSave(
      { "offer.title": offerTitle, "offer.desc": offerDesc },
      "offer",
      "Launch Offer",
    );
  };

  const saveWhy = () => {
    const updates: Record<string, string> = {};
    for (let i = 0; i < features.length; i++) {
      updates[`why.${i + 1}.title`] = features[i].title;
      updates[`why.${i + 1}.desc`] = features[i].desc;
    }
    doSave(updates, "why", "Why Choose ALVRA");
  };

  // ─── Drag & Drop ─────────────────────────────────────────────────────────
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    const newOrder = [...sectionOrder];
    const from = newOrder.indexOf(draggedId);
    const to = newOrder.indexOf(targetId);
    if (from !== -1 && to !== -1) {
      newOrder.splice(from, 1);
      newOrder.splice(to, 0, draggedId);
      setSectionOrder(newOrder);
      try {
        writeKey("section.order", JSON.stringify(newOrder));
        toast.success("Section order saved!");
      } catch {
        toast.error("Failed to save order.");
      }
    }
    setDraggedId(null);
  };

  const handleLogout = () => {
    adminLogout();
    setLoggedIn(false);
    toast.success("Signed out.");
  };

  if (!loggedIn) {
    return (
      <AdminLoginPage
        onSuccess={() => setLoggedIn(true)}
        onNavigate={onNavigate}
      />
    );
  }

  // ─── Section definitions ──────────────────────────────────────────────────
  const PRODUCT_FALLBACKS = [
    "men-formal",
    "men-party",
    "women-formal",
    "women-party",
  ];

  const sectionDefs: Record<
    string,
    { title: string; content: React.ReactNode }
  > = {
    hero: {
      title: "Hero Section",
      content: (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <EditableField
              label="Headline"
              value={heroTitle}
              onChange={setHeroTitle}
              ocid="admin.hero.title.input"
            />
            <EditableField
              label="Subtitle"
              value={heroSubtitle}
              onChange={setHeroSubtitle}
              multiline
              ocid="admin.hero.subtitle.textarea"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Hero Image
            </Label>
            <ImageDropZone
              currentSrc={heroImage}
              fallbackSrc="/assets/generated/hero-perfume.dim_800x900.png"
              label="Hero Image"
              onImageChange={setHeroImage}
              ocid="admin.hero.image.dropzone"
            />
          </div>
          <div className="flex justify-end">
            <SaveBtn
              onClick={saveHero}
              saving={saving === "hero"}
              label="Save Hero"
              ocid="admin.hero.save_button"
            />
          </div>
        </div>
      ),
    },
    products: {
      title: "Products",
      content: (
        <div className="space-y-6">
          {products.map((p, i) => (
            <div
              key={`product-${i + 1}`}
              className="bg-obsidian-2 rounded-xl p-4 border border-border"
              data-ocid={`admin.product.item.${i + 1}`}
            >
              <p className="text-gold text-xs font-bold uppercase tracking-wider mb-3">
                Product {i + 1}
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <EditableField
                  label="Name"
                  value={p.name}
                  onChange={(v) =>
                    setProducts((prev) =>
                      prev.map((pr, j) => (j === i ? { ...pr, name: v } : pr)),
                    )
                  }
                  ocid={`admin.product.${i + 1}.name.input`}
                />
                <EditableField
                  label="Price"
                  value={p.price}
                  onChange={(v) =>
                    setProducts((prev) =>
                      prev.map((pr, j) => (j === i ? { ...pr, price: v } : pr)),
                    )
                  }
                  ocid={`admin.product.${i + 1}.price.input`}
                />
                <div className="sm:col-span-2">
                  <EditableField
                    label="Description"
                    value={p.desc}
                    onChange={(v) =>
                      setProducts((prev) =>
                        prev.map((pr, j) =>
                          j === i ? { ...pr, desc: v } : pr,
                        ),
                      )
                    }
                    ocid={`admin.product.${i + 1}.desc.textarea`}
                  />
                </div>
              </div>
              <div className="mb-4">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Product Image
                </Label>
                <ImageDropZone
                  currentSrc={p.image}
                  fallbackSrc={`/assets/generated/${PRODUCT_FALLBACKS[i]}.dim_400x500.png`}
                  label={p.name}
                  onImageChange={(url) =>
                    setProducts((prev) =>
                      prev.map((pr, j) =>
                        j === i ? { ...pr, image: url } : pr,
                      ),
                    )
                  }
                  ocid={`admin.product.${i + 1}.image.dropzone`}
                />
              </div>
              <div className="flex justify-end">
                <SaveBtn
                  onClick={() => saveProduct(i)}
                  saving={saving === `product-${i + 1}`}
                  label={`Save Product ${i + 1}`}
                  ocid={`admin.product.save_button.${i + 1}`}
                />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    offer: {
      title: "Launch Offer",
      content: (
        <div className="space-y-4">
          <EditableField
            label="Offer Title"
            value={offerTitle}
            onChange={setOfferTitle}
            ocid="admin.offer.title.input"
          />
          <EditableField
            label="Offer Description"
            value={offerDesc}
            onChange={setOfferDesc}
            multiline
            ocid="admin.offer.desc.textarea"
          />
          <div className="flex justify-end">
            <SaveBtn
              onClick={saveOffer}
              saving={saving === "offer"}
              label="Save Offer"
              ocid="admin.offer.save_button"
            />
          </div>
        </div>
      ),
    },
    why: {
      title: "Why Choose ALVRA",
      content: (
        <div className="space-y-4">
          {features.map((f, i) => (
            <div
              key={`why-${i + 1}`}
              className="bg-obsidian-2 rounded-xl p-4 border border-border"
              data-ocid={`admin.why.item.${i + 1}`}
            >
              <p className="text-gold text-xs font-bold uppercase tracking-wider mb-3">
                Feature {i + 1}
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <EditableField
                  label="Title"
                  value={f.title}
                  onChange={(v) =>
                    setFeatures((prev) =>
                      prev.map((ft, j) => (j === i ? { ...ft, title: v } : ft)),
                    )
                  }
                  ocid={`admin.why.${i + 1}.title.input`}
                />
                <EditableField
                  label="Description"
                  value={f.desc}
                  onChange={(v) =>
                    setFeatures((prev) =>
                      prev.map((ft, j) => (j === i ? { ...ft, desc: v } : ft)),
                    )
                  }
                  ocid={`admin.why.${i + 1}.desc.textarea`}
                />
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <SaveBtn
              onClick={saveWhy}
              saving={saving === "why"}
              label="Save Features"
              ocid="admin.why.save_button"
            />
          </div>
        </div>
      ),
    },
    "custom-sectors": {
      title: "Add New Perfume Sector",
      content: (
        <div className="space-y-6" data-ocid="admin.custom_sectors.section">
          {/* Existing sectors list */}
          {customSectors.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider block">
                Your Perfume Sectors ({customSectors.length})
              </Label>
              {customSectors.map((sector, i) => (
                <div
                  key={sector.id}
                  className="flex items-center justify-between gap-3 bg-obsidian-2 border border-border rounded-xl p-4"
                  data-ocid={`admin.custom_sectors.item.${i + 1}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {sector.image && (
                      <img
                        src={sector.image}
                        alt={sector.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-foreground font-semibold text-sm truncate">
                        {sector.name}
                      </p>
                      <p className="text-muted-foreground text-xs truncate">
                        {sector.tagline}
                      </p>
                      <p className="text-gold text-xs font-bold">
                        {sector.price}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="bg-gold/20 text-gold text-xs px-2 py-0.5 rounded-full">
                      {sector.style}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = customSectors.filter((_, j) => j !== i);
                        setCustomSectors(updated);
                        writeKey("custom.sectors", JSON.stringify(updated));
                        toast.success("Sector deleted.");
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors p-1.5 rounded-lg hover:bg-red-900/20"
                      data-ocid={`admin.custom_sectors.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add new sector form */}
          <div className="bg-obsidian-2 border border-border rounded-xl p-5 space-y-4">
            <p className="text-gold text-xs font-bold uppercase tracking-wider">
              Add New Perfume Sector
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <EditableField
                label="Perfume Name"
                value={newSector.name}
                onChange={(v) => setNewSector((prev) => ({ ...prev, name: v }))}
                ocid="admin.custom_sectors.name.input"
              />
              <EditableField
                label="Tagline / Description"
                value={newSector.tagline}
                onChange={(v) =>
                  setNewSector((prev) => ({ ...prev, tagline: v }))
                }
                ocid="admin.custom_sectors.tagline.input"
              />
              <EditableField
                label="Price (e.g. ₹999)"
                value={newSector.price}
                onChange={(v) =>
                  setNewSector((prev) => ({ ...prev, price: v }))
                }
                ocid="admin.custom_sectors.price.input"
              />
            </div>

            {/* Style selector */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Card Style
              </Label>
              <div
                className="flex flex-wrap gap-2"
                data-ocid="admin.custom_sectors.style.toggle"
              >
                {[
                  "Minimal",
                  "Bold",
                  "Elegant",
                  "Dark Luxury",
                  "Floral",
                  "Fresh",
                ].map((style) => (
                  <button
                    type="button"
                    key={style}
                    onClick={() => setNewSector((prev) => ({ ...prev, style }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      newSector.style === style
                        ? "bg-gold text-obsidian border-gold"
                        : "bg-transparent text-muted-foreground border-border hover:border-gold/50"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Image upload */}
            <div data-ocid="admin.custom_sectors.image.dropzone">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Sector Image (optional)
              </Label>
              <ImageDropZone
                currentSrc={newSectorImage}
                fallbackSrc=""
                label="Sector Image"
                onImageChange={setNewSectorImage}
                ocid="admin.custom_sectors.image.dropzone"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!newSector.name.trim()) {
                    toast.error("Please enter a perfume name.");
                    return;
                  }
                  const sector: CustomSectorItem = {
                    id: Date.now().toString(),
                    name: newSector.name,
                    tagline: newSector.tagline,
                    price: newSector.price,
                    style: newSector.style,
                    image: newSectorImage,
                  };
                  const updated = [...customSectors, sector];
                  setCustomSectors(updated);
                  writeKey("custom.sectors", JSON.stringify(updated));
                  setNewSector({
                    name: "",
                    tagline: "",
                    price: "",
                    style: "Minimal",
                  });
                  setNewSectorImage(undefined);
                  toast.success(
                    "Perfume sector added! It will appear on your website.",
                  );
                }}
                className="bg-gold hover:bg-gold-bright text-obsidian font-bold text-sm px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                data-ocid="admin.custom_sectors.add_button"
              >
                <span>+ Add Perfume Sector</span>
              </button>
            </div>
          </div>
        </div>
      ),
    },
  };

  return (
    <div className="min-h-screen bg-background" data-ocid="admin.page">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-gold-dim">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("/")}
              className="font-luxury text-xl text-gold gold-glow tracking-[0.3em]"
              data-ocid="admin.logo.link"
            >
              ALVRA
            </button>
            <span className="text-muted-foreground text-xs">
              / Admin Editor
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("/")}
              className="border-gold-dim text-gold hover:bg-gold hover:text-obsidian"
              data-ocid="admin.back.secondary_button"
            >
              ← Store
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-gold gap-1.5"
              data-ocid="admin.logout.button"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gold gold-glow mb-2">
            Website Editor
          </h1>
          <p className="text-muted-foreground text-sm mb-4">
            Edit any section below, then click the{" "}
            <span className="text-gold font-semibold">Save</span> button. Your
            changes go live on the website immediately.
          </p>

          {/* Reset button */}
          <button
            type="button"
            onClick={() => {
              if (
                !window.confirm(
                  "This will reset ALL your edits back to defaults. Are you sure?",
                )
              )
                return;
              clearAll();
              window.location.reload();
            }}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors border border-red-900/50 hover:border-red-700 rounded-lg px-3 py-1.5"
            data-ocid="admin.reset.delete_button"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset All to Defaults
          </button>
        </motion.div>

        {/* Sections */}
        <div className="space-y-5">
          {sectionOrder.map((id) => {
            const def = sectionDefs[id];
            if (!def) return null;
            return (
              <Section
                key={id}
                sectionId={id}
                title={def.title}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragging={draggedId === id}
              >
                {def.content}
              </Section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
