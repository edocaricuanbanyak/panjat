import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dasbor", "/api", "/manjat/bayar-mock"] },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
