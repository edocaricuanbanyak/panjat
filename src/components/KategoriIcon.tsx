import {
  Cloud,
  GraduationCap,
  Landmark,
  LayoutGrid,
  ListChecks,
  Newspaper,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Gamepad2 } from "lucide-react";

// One icon per category slug (see src/db/seed.ts KATEGORI). `null` = "Semua".
const ICONS: Record<string, LucideIcon> = {
  "ai-tools": Sparkles,
  saas: Cloud,
  jasa: Wrench,
  ecommerce: ShoppingCart,
  konten: Newspaper,
  game: Gamepad2,
  edukasi: GraduationCap,
  fintech: Landmark,
  produktivitas: ListChecks,
  komunitas: Users,
  marketplace: Store,
};

export function KategoriIcon({
  slug,
  className = "size-4",
}: {
  slug: string | null;
  className?: string;
}) {
  const Icon = slug === null ? LayoutGrid : (ICONS[slug] ?? Tag);
  return <Icon className={className} aria-hidden />;
}
