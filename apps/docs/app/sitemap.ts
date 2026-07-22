import type { MetadataRoute } from "next";
import { siteConfig } from "../lib/site";
import { source } from "../lib/source";

export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => ({
    url: new URL(page.url, siteConfig.url).toString(),
  }));
}
