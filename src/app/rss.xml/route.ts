import { loadNoticeSummaries } from "@/app/announcements/data";
import { loadGuideSummaries } from "@/app/guide/data";
import { absoluteUrl, siteDescription, siteName } from "@/lib/seo";

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

interface RssItem {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  description: string;
}

export async function GET() {
  const items: RssItem[] = [];

  try {
    const notices = await loadNoticeSummaries();
    items.push(
      ...notices.map((notice) => ({
        title: `[공지사항] ${notice.title}`,
        link: absoluteUrl(`/announcements/${encodeURIComponent(notice.slug)}`),
        guid: `notice-${notice.id}`,
        pubDate: new Date(notice.publishedAt).toUTCString(),
        description: notice.summary || `${notice.title} 공지사항`,
      }))
    );
  } catch {
  }

  try {
    const guides = await loadGuideSummaries();
    items.push(
      ...guides.map((guide) => ({
        title: `[가이드] ${guide.title}`,
        link: absoluteUrl(`/guide/${encodeURIComponent(guide.slug)}`),
        guid: `guide-${guide.id}`,
        pubDate: new Date().toUTCString(),
        description: `${guide.title} 가이드`,
      }))
    );
  } catch {
  }

  const sortedItems = items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${escapeXml(absoluteUrl("/"))}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>ko-KR</language>
    ${sortedItems
      .map(
        (item) => `<item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid>${escapeXml(item.guid)}</guid>
      <pubDate>${escapeXml(item.pubDate)}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`
      )
      .join("\n")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
