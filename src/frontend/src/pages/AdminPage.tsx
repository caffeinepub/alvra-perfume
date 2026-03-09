import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GripVertical, Loader2, LogOut, Save, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import {
  useGetAllProducts,
  useGetContent,
  useSetProductImage,
  useUpdateContent,
} from "../hooks/useQueries";
import AdminLoginPage, { adminLogout, isAdminLoggedIn } from "./AdminLoginPage";

interface AdminPageProps {
  onNavigate: (path: string) => void;
}

// ─── Image Drop Zone ──────────────────────────────────────────────────────────
function ImageDropZone({
  currentSrc,
  label,
  onImageChange,
  ocid,
}: {
  currentSrc?: string;
  label: string;
  onImageChange: (dataUrl: string) => void;
  ocid: string;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentSrc);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(currentSrc);
  }, [currentSrc]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please drop an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onImageChange(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <button
      type="button"
      className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all cursor-pointer w-full text-left ${
        isDragOver
          ? "border-gold bg-gold/10"
          : "border-border hover:border-gold-dim"
      }`}
      style={{ minHeight: "120px" }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      data-ocid={ocid}
      aria-label={`Drop zone for ${label}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        data-ocid={`${ocid}_input`}
      />
      {preview ? (
        <div className="relative group">
          <img src={preview} alt={label} className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-obsidian/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-gold text-sm font-medium flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Replace Image
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
          <Upload className="w-6 h-6" />
          <span className="text-xs text-center px-2">
            Drag & drop or click to upload
            <br />
            <span className="text-gold">{label}</span>
          </span>
        </div>
      )}
    </button>
  );
}

// ─── Text Field ───────────────────────────────────────────────────────────────
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
          className="bg-obsidian-3 border-border focus:border-gold text-foreground placeholder:text-muted-foreground resize-none text-sm"
          data-ocid={ocid}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-obsidian-3 border-border focus:border-gold text-foreground placeholder:text-muted-foreground text-sm"
          data-ocid={ocid}
        />
      )}
    </div>
  );
}

// ─── Draggable Section Block ──────────────────────────────────────────────────
interface SectionBlock {
  id: string;
  title: string;
  order: number;
}

function DraggableSection({
  section,
  children,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: {
  section: SectionBlock;
  children: React.ReactNode;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (id: string) => void;
  isDragging: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(section.id)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(section.id)}
      className={`bg-obsidian-2 border rounded-2xl transition-all ${
        isDragging ? "border-gold opacity-50 scale-[0.99]" : "border-border"
      }`}
      data-ocid={`admin.${section.id}.card`}
    >
      {/* Section header with drag handle */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div
          className="text-muted-foreground hover:text-gold transition-colors cursor-grab active:cursor-grabbing"
          data-ocid={`admin.${section.id}.drag_handle`}
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <h3 className="font-display text-lg font-bold text-gold">
          {section.title}
        </h3>
      </div>

      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Content helper ───────────────────────────────────────────────────────────
function useContentMap(blocks: { key: string; value: string }[]) {
  const map: Record<string, string> = {};
  for (const b of blocks) {
    map[b.key] = b.value;
  }
  return map;
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
export default function AdminPage({ onNavigate }: AdminPageProps) {
  const { actor } = useActor();
  const [adminSession, setAdminSession] = useState(() => isAdminLoggedIn());
  const { data: contentBlocks = [] } = useGetContent();
  const { data: backendProducts = [] } = useGetAllProducts();
  const updateContent = useUpdateContent();
  const setProductImage = useSetProductImage();

  const contentMap = useContentMap(contentBlocks);

  // Section ordering state
  const defaultOrder = ["hero", "products", "offer", "why"];
  const [sectionOrder, setSectionOrder] = useState<string[]>(defaultOrder);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const dragTarget = useRef<string | null>(null);

  // Hero state
  const [heroTitle, setHeroTitle] = useState("BE UNFORGETTABLE");
  const [heroSubtitle, setHeroSubtitle] = useState(
    "Premium perfumes designed for Formal & Party moments.",
  );
  const [heroImage, setHeroImage] = useState<string | undefined>(undefined);

  // Products state
  const [products, setProducts] = useState([
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
  ]);

  // Launch offer state
  const [offerTitle, setOfferTitle] = useState("🔥 Launch Offer");
  const [offerDesc, setOfferDesc] = useState(
    "Get ALVRA perfume today for just ₹199. Includes 50ml perfume, travel spray, thank you card, coupon & flower seeds.",
  );

  // Why Choose state
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

  // Populate from backend content
  useEffect(() => {
    if (contentBlocks.length === 0) return;
    if (contentMap["hero.title"]) setHeroTitle(contentMap["hero.title"]);
    if (contentMap["hero.subtitle"])
      setHeroSubtitle(contentMap["hero.subtitle"]);
    if (contentMap["hero.image"]) setHeroImage(contentMap["hero.image"]);
    if (contentMap["offer.title"]) setOfferTitle(contentMap["offer.title"]);
    if (contentMap["offer.desc"]) setOfferDesc(contentMap["offer.desc"]);

    setProducts((prev) =>
      prev.map((p, i) => ({
        name: contentMap[`product.${i + 1}.name`] ?? p.name,
        desc: contentMap[`product.${i + 1}.desc`] ?? p.desc,
        price: contentMap[`product.${i + 1}.price`] ?? p.price,
        image: contentMap[`product.${i + 1}.image`] ?? p.image,
      })),
    );

    setFeatures((prev) =>
      prev.map((f, i) => ({
        title: contentMap[`why.${i + 1}.title`] ?? f.title,
        desc: contentMap[`why.${i + 1}.desc`] ?? f.desc,
      })),
    );

    if (contentMap["section.order"]) {
      try {
        const saved = JSON.parse(contentMap["section.order"]) as string[];
        setSectionOrder(saved);
      } catch {
        // ignore
      }
    }
  }, [contentBlocks, contentMap]);

  // ─── Save handlers ────────────────────────────────────────────────────────
  const saveHero = async () => {
    try {
      await Promise.all([
        updateContent.mutateAsync({ key: "hero.title", value: heroTitle }),
        updateContent.mutateAsync({
          key: "hero.subtitle",
          value: heroSubtitle,
        }),
        ...(heroImage
          ? [updateContent.mutateAsync({ key: "hero.image", value: heroImage })]
          : []),
      ]);
      toast.success("Hero section saved!");
    } catch {
      toast.error("Failed to save hero section.");
    }
  };

  const saveProduct = async (index: number) => {
    const p = products[index];
    // Find the backend product ID (1-indexed matches backend IDs)
    const backendProduct = backendProducts.find(
      (bp) => bp.id === BigInt(index + 1),
    );
    try {
      const contentUpdates = [
        updateContent.mutateAsync({
          key: `product.${index + 1}.name`,
          value: p.name,
        }),
        updateContent.mutateAsync({
          key: `product.${index + 1}.desc`,
          value: p.desc,
        }),
        updateContent.mutateAsync({
          key: `product.${index + 1}.price`,
          value: p.price,
        }),
        ...(p.image
          ? [
              updateContent.mutateAsync({
                key: `product.${index + 1}.image`,
                value: p.image,
              }),
            ]
          : []),
      ];

      // Also update the backend product image via setProductImage
      const imageUpdates =
        p.image && backendProduct
          ? [
              setProductImage.mutateAsync({
                productId: backendProduct.id,
                imageUrl: p.image,
              }),
            ]
          : [];

      await Promise.all([...contentUpdates, ...imageUpdates]);
      toast.success(`Product ${index + 1} saved!`);
    } catch {
      toast.error(`Failed to save product ${index + 1}.`);
    }
  };

  const saveOffer = async () => {
    try {
      await Promise.all([
        updateContent.mutateAsync({ key: "offer.title", value: offerTitle }),
        updateContent.mutateAsync({ key: "offer.desc", value: offerDesc }),
      ]);
      toast.success("Launch Offer section saved!");
    } catch {
      toast.error("Failed to save offer section.");
    }
  };

  const saveWhy = async () => {
    try {
      await Promise.all(
        features.flatMap((f, i) => [
          updateContent.mutateAsync({
            key: `why.${i + 1}.title`,
            value: f.title,
          }),
          updateContent.mutateAsync({
            key: `why.${i + 1}.desc`,
            value: f.desc,
          }),
        ]),
      );
      toast.success("Why Choose section saved!");
    } catch {
      toast.error("Failed to save features section.");
    }
  };

  // ─── Drag and drop for section reordering ────────────────────────────────
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    const newOrder = [...sectionOrder];
    const fromIdx = newOrder.indexOf(draggedId);
    const toIdx = newOrder.indexOf(targetId);
    if (fromIdx !== -1 && toIdx !== -1) {
      newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, draggedId);
      setSectionOrder(newOrder);
      dragTarget.current = null;
      try {
        await updateContent.mutateAsync({
          key: "section.order",
          value: JSON.stringify(newOrder),
        });
        toast.success("Section order saved!");
      } catch {
        toast.error("Failed to save section order.");
      }
    }
    setDraggedId(null);
  };

  // ─── Handle logout ────────────────────────────────────────────────────────
  const handleAdminLogout = () => {
    adminLogout();
    setAdminSession(false);
    toast.success("Signed out of admin panel.");
  };

  // ─── Access denied: show password login ───────────────────────────────────
  if (!adminSession) {
    return (
      <AdminLoginPage
        onSuccess={() => setAdminSession(true)}
        onNavigate={onNavigate}
      />
    );
  }

  // suppress unused warning
  void actor;

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
              currentSrc={
                heroImage || "/assets/generated/hero-perfume.dim_800x900.png"
              }
              label="Hero Perfume Image"
              onImageChange={setHeroImage}
              ocid="admin.hero.image.dropzone"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={saveHero}
              disabled={updateContent.isPending}
              className="bg-gold text-obsidian font-bold hover:bg-gold-bright gap-2"
              data-ocid="admin.hero.save_button"
            >
              {updateContent.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Hero
            </Button>
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
              className="bg-obsidian-3 rounded-xl p-4 border border-border"
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
                  currentSrc={
                    p.image ||
                    `/assets/generated/${
                      [
                        "men-formal",
                        "men-party",
                        "women-formal",
                        "women-party",
                      ][i]
                    }.dim_400x500.png`
                  }
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
                <Button
                  onClick={() => saveProduct(i)}
                  disabled={updateContent.isPending}
                  className="bg-gold text-obsidian font-bold hover:bg-gold-bright gap-2 text-sm"
                  data-ocid={`admin.product.save_button.${i + 1}`}
                >
                  {updateContent.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  Save Product {i + 1}
                </Button>
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
            <Button
              onClick={saveOffer}
              disabled={updateContent.isPending}
              className="bg-gold text-obsidian font-bold hover:bg-gold-bright gap-2"
              data-ocid="admin.offer.save_button"
            >
              {updateContent.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Offer
            </Button>
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
              key={`feature-${i + 1}`}
              className="bg-obsidian-3 rounded-xl p-4 border border-border"
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
            <Button
              onClick={saveWhy}
              disabled={updateContent.isPending}
              className="bg-gold text-obsidian font-bold hover:bg-gold-bright gap-2"
              data-ocid="admin.why.save_button"
            >
              {updateContent.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Features
            </Button>
          </div>
        </div>
      ),
    },
  };

  return (
    <div className="min-h-screen bg-obsidian" data-ocid="admin.page">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark border-b border-gold-dim">
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
            <span className="text-muted-foreground text-xs">/ Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onNavigate("/")}
              className="border-gold-dim text-gold hover:bg-gold hover:text-obsidian text-sm"
              data-ocid="admin.back.secondary_button"
            >
              ← Back to Store
            </Button>
            <Button
              variant="ghost"
              onClick={handleAdminLogout}
              className="text-muted-foreground hover:text-gold text-sm gap-1.5"
              data-ocid="admin.logout.button"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gold gold-glow mb-2">
            Website Editor
          </h1>
          <p className="text-muted-foreground text-sm">
            Drag sections to reorder them. Edit text and images, then save each
            section.
          </p>
          <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
            <GripVertical className="w-3 h-3" />
            Drag the grip icon to reorder sections on the live website.
          </p>
        </motion.div>

        {/* Section blocks */}
        <div className="space-y-5">
          {sectionOrder.map((sectionId) => {
            const def = sectionDefs[sectionId];
            if (!def) return null;
            return (
              <DraggableSection
                key={sectionId}
                section={{
                  id: sectionId,
                  title: def.title,
                  order: sectionOrder.indexOf(sectionId),
                }}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragging={draggedId === sectionId}
              >
                {def.content}
              </DraggableSection>
            );
          })}
        </div>
      </main>
    </div>
  );
}
