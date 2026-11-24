import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LocationPageView from "@/components/sections/location-detail/LocationPageView";
import JsonLd from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/cms/metadata";
import { getPublicLocation } from "@/lib/cms/public";
import { getLocationPageSchema } from "@/data/schemaData";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicLocation(slug);
  if (!page) return {};
  return buildPageMetadata({
    path: `/location/${slug}`,
    seo: page.seo,
    fallbackTitle: page.content.metadata?.title || page.content.hero.title,
    fallbackDescription:
      page.content.metadata?.description ||
      `${page.content.hero.descriptionPrefix} ${page.content.hero.highlightLocation}`.trim(),
    fallbackImage: page.content.hero.image,
  });
}

export default async function LocationSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPublicLocation(slug);
  if (!page) notFound();
  let schema = getLocationPageSchema(page.content);
  if (page.seo.schemaMarkup.trim()) {
    try {
      schema = JSON.parse(page.seo.schemaMarkup) as Record<string, unknown>;
    } catch {
      schema = getLocationPageSchema(page.content);
    }
  }
  return (
    <>
      <JsonLd data={schema} />
      <LocationPageView page={page.content} />
    </>
  );
}
