import type { MetadataRoute } from "next";
import { getAllBlogSlugs } from "@/data/blogs";
import { getPublishedBlogUpdates, getPublishedLocationUpdates } from "@/lib/cms/public";
import { getAllLocationSlugs } from "@/data/locations";
import { getSiteUrl, SITEMAP_GROUPS } from "@/data/sitemapData";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];
  const blogUpdates = await getPublishedBlogUpdates();
  const locationUpdates = await getPublishedLocationUpdates();
  const newest = (dates: Map<string, Date> | null) => {
    if (!dates || dates.size === 0) return undefined;
    return new Date(Math.max(...[...dates.values()].map((date) => date.getTime())));
  };

  const pushEntry = (
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: number,
    lastModified?: Date
  ) => {
    const normalizedPath = path === "/" ? "" : path.replace(/\/+$/, "");
    const url = `${siteUrl}${normalizedPath}`;
    if (seen.has(url)) return;
    seen.add(url);
    entries.push({
      url,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency,
      priority,
    });
  };

  const newestBlog = newest(blogUpdates);
  const newestLocation = newest(locationUpdates);

  for (const group of SITEMAP_GROUPS) {
    for (const item of group.items) {
      const lastModified =
        item.href === "/blog" ? newestBlog : item.href === "/location" ? newestLocation : undefined;
      pushEntry(item.href, item.changeFrequency, item.priority, lastModified);
    }
  }

  const locationSlugs = locationUpdates ? [...locationUpdates.keys()] : getAllLocationSlugs();
  for (const slug of locationSlugs) {
    pushEntry(`/location/${slug}`, "monthly", 0.75, locationUpdates?.get(slug));
  }

  const blogSlugs = blogUpdates ? [...blogUpdates.keys()] : getAllBlogSlugs();
  for (const slug of blogSlugs) {
    pushEntry(`/blog/${slug}`, "monthly", 0.7, blogUpdates?.get(slug));
  }

  return entries;
}
