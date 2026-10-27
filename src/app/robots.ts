import type { MetadataRoute } from "next";
import { robotsFor, siteUrl } from "@/lib/indexing";

/** Live site: everything but /admin, with the sitemap. Any other deployment: nothing at all. */
export default function robots(): MetadataRoute.Robots {
  return robotsFor(process.env.VERCEL_ENV, siteUrl());
}
