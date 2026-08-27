import { MockPay } from "./MockPay";

export const dynamic = "force-dynamic";

export default async function BayarMockPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string; nominal?: string }>;
}) {
  const sp = await searchParams;
  return <MockPay orderId={sp.order_id ?? ""} nominal={Number(sp.nominal ?? 0)} />;
}
