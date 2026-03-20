import type { MetadataRoute } from "next";
import { loadGuideSummaries } from "@/app/guide/data";
import { loadNoticeSummaries } from "@/app/announcements/data";
import { absoluteUrl } from "@/lib/seo";

const buildSiteMapEntry = (pathname: string, lastModified?: string | Date): MetadataRoute.Sitemap[number] => ({
  url: absoluteUrl(pathname),
  lastModified: lastModified ?? new Date(),
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    buildSiteMapEntry("/"),
    buildSiteMapEntry("/apis"),
    buildSiteMapEntry("/guide"),
    buildSiteMapEntry("/announcements"),
  ];

  try {
    const guides = await loadGuideSummaries();
    entries.push(...guides.map((guide) => buildSiteMapEntry(`/guide/${encodeURIComponent(guide.slug)}`)));
  } catch {
  }

  try {
    const notices = await loadNoticeSummaries();
    entries.push(
      ...notices.map((notice) =>
        buildSiteMapEntry(`/announcements/${encodeURIComponent(notice.slug)}`, notice.publishedAt)
      )
    );
  } catch {
  }

  return entries;
}
