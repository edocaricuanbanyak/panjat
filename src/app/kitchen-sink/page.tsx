import { Button } from "@/components/Button";
import { CategoryChip } from "@/components/CategoryChip";
import { EmptyState } from "@/components/EmptyState";
import { EstimateLabel } from "@/components/EstimateLabel";
import { ListingCard } from "@/components/ListingCard";
import { LogoTile } from "@/components/LogoTile";
import { PeganganBar } from "@/components/PeganganBar";
import { RankBadge } from "@/components/RankBadge";
import { TiangRail } from "@/components/TiangRail";
import type { BoardEntry } from "@/domain/board";

// Internal component gallery (R13) — every component, checked per breakpoint
// before release. Static; no DB.

const entry = (over: Partial<BoardEntry> = {}): BoardEntry => ({
  rank: 1,
  id: "sample",
  nama: "Nyala Analytics",
  urlNormal: "nyala.id",
  deskripsi: "Analitik web ramah privasi tanpa cookie, buatan Indonesia.",
  kategoriNama: "SaaS",
  pegangan: 98_808,
  klikHariIni: 412,
  rosotPerHari: 24_702,
  screenshotUrl: null,
  badges: ["Pernah di Puncak", "Comeback"],
  ...over,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-mono text-xs uppercase tracking-wide text-tinta-redup">{title}</h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

export default function KitchenSink() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
        Kitchen Sink
      </h1>

      <Section title="Button — variant × size">
        <Button variant="primary" size="sm">Salip</Button>
        <Button variant="primary" size="md">Manjat</Button>
        <Button variant="primary" size="lg">Manjat lagi</Button>
        <Button variant="secondary">Sekunder</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="primary" disabled>Disabled</Button>
      </Section>

      <Section title="RankBadge">
        <RankBadge rank={1} />
        <RankBadge rank={2} />
        <RankBadge rank={4} />
        <RankBadge rank={31} />
      </Section>

      <Section title="LogoTile">
        <LogoTile nama="Nyala" />
        <LogoTile nama="Warungku" className="size-14 rounded-md text-2xl" />
      </Section>

      <Section title="CategoryChip">
        <CategoryChip label="SaaS" />
        <CategoryChip label="AI Tools" active />
      </Section>

      <Section title="PeganganBar (100% / 60% / 8%)">
        <div className="flex w-full flex-col gap-2">
          <PeganganBar pegangan={100} max={100} />
          <PeganganBar pegangan={60} max={100} />
          <PeganganBar pegangan={8} max={100} />
        </div>
      </Section>

      <Section title="EstimateLabel">
        <EstimateLabel rosotPerHari={24_702} />
      </Section>

      <Section title="TiangRail">
        <div className="h-40">
          <TiangRail className="h-full w-3" />
        </div>
      </Section>

      <Section title="ListingCard — puncak / row">
        <div className="flex w-full flex-col gap-3">
          <ListingCard entry={entry()} max={98_808} density="puncak" />
          <ListingCard
            entry={entry({ rank: 7, nama: "Rakit Hosting", pegangan: 24_867, kategoriNama: "Jasa", klikHariIni: 33, rosotPerHari: 2984 })}
            max={98_808}
          />
        </div>
      </Section>

      <Section title="EmptyState">
        <div className="w-full rounded-lg border border-garis bg-kertas-1">
          <EmptyState title="Belum ada yang manjat." message="Tiangnya masih kinclong." />
        </div>
      </Section>
    </main>
  );
}
