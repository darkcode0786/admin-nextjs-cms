import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPageView from "@/components/sections/blog/BlogPageView";
import JsonLd from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/cms/metadata";
import { getPublicBlog } from "@/lib/cms/public";
import { getBlogPostSchema } from "@/data/schemaData";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicBlog(slug);
  if (!post) return {};
  return buildPageMetadata({
    path: `/blog/${slug}`,
    seo: post.seo,
    fallbackTitle: post.content.metadata?.title || post.content.hero.title,
    fallbackDescription: post.content.metadata?.description || post.content.hero.title,
    fallbackImage: post.content.meta.image?.src,
  });
}

export default async function BlogSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublicBlog(slug);
  if (!post) notFound();
  let schema = getBlogPostSchema(post.content);
  if (post.seo.schemaMarkup.trim()) {
    try {
      schema = JSON.parse(post.seo.schemaMarkup) as Record<string, unknown>;
    } catch {
      schema = getBlogPostSchema(post.content);
    }
  }
  return (
    <>
      <JsonLd data={schema} />
      <BlogPageView post={post.content} />
    </>
  );
}
