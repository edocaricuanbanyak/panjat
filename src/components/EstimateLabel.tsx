import { formatRupiah } from "@/lib/format";

/** Makes the decay visible in plain rupiah (§6.5: estimasi selalu ditampilkan). */
export function EstimateLabel({ rosotPerHari }: { rosotPerHari: number }) {
  return (
    <span className="font-sans tabular text-xs text-tinta-redup">
      merosot ~{formatRupiah(rosotPerHari)}/hari
    </span>
  );
}
