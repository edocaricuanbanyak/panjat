import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { NextResponse } from "next/server";
import { parseSaCredentials } from "@/lib/ga4";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TEMPORARY GA4 diagnostic — remove once the /statistik GA4 block is confirmed.
 * Returns a sanitized verdict only (booleans, lengths, email DOMAIN, a classified
 * + redacted error) so we can tell why getGa4Stats() returns null in prod without
 * reading logs. Never returns the SA key, the property id value, or a full email.
 */
export async function GET() {
  const propertyId = (process.env.GA4_PROPERTY_ID ?? "").trim();
  const raw = process.env.GA4_SA_JSON ?? "";
  const out: Record<string, unknown> = {
    propertyIdSet: propertyId.length > 0,
    propertyIdLooksNumeric: /^[0-9]+$/.test(propertyId), // false ⇒ pasted a G-…/GTM-… by mistake
    saJsonSet: raw.length > 0,
    saJsonLen: raw.length,
    saJsonLooksBase64: raw.length > 0 && !raw.trim().startsWith("{"), // base64 form
    hasLiteralNewlineInValue: /\r|\n/.test(raw), // true ⇒ multi-line paste (breaks raw JSON.parse)
  };

  // Same base64-or-raw parser as getGa4Stats() so the verdict matches reality.
  const creds = parseSaCredentials(raw) as { client_email?: string } | null;
  if (!creds) {
    out.saJsonParses = false;
    out.saJsonParseError = "not valid JSON nor base64-encoded JSON";
    return NextResponse.json(out); // can't go further without valid creds
  }
  out.saJsonParses = true;
  out.saClientEmailDomain =
    typeof creds?.client_email === "string" ? (creds.client_email.split("@")[1] ?? null) : null;

  try {
    const c = new BetaAnalyticsDataClient({ credentials: creds ?? undefined });
    const [rep] = await c.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "2020-01-01", endDate: "today" }],
      dimensions: [{ name: "city" }],
      metrics: [{ name: "activeUsers" }],
      limit: 3,
    });
    out.runReport = "ok";
    out.rowCount = rep.rows?.length ?? 0;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    out.runReport = "error";
    out.errorReason = /PERMISSION_DENIED/.test(msg)
      ? "permission_denied — SA not added as Viewer on the GA4 property"
      : /INVALID_ARGUMENT/.test(msg)
        ? "invalid_argument — likely wrong GA4_PROPERTY_ID (must be the numeric Property ID)"
        : /UNAUTHENTICATED|invalid_grant|DECODER|private key|PEM/i.test(msg)
          ? "auth_failed — SA key invalid / malformed private_key"
          : "other";
    out.errorSnippet = msg.slice(0, 180).replace(/[\w.+-]+@[\w.-]+/g, "<email>");
  }

  return NextResponse.json(out);
}
