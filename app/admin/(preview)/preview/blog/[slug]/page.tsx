import { notFound, redirect } from "next/navigation";
import BlogPageView from "@/components/sections/blog/BlogPageView";
import { getPreviewBlog } from "@/lib/cms/public";
import { isAdmin } from "@/lib/auth";

export const instant = false;

export default async function PreviewBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { slug } = await params;
  const record = await getPreviewBlog(slug);
  if (!record) notFound();
  return (
    <div>
      <p className="bg-navy px-4 py-2 text-center text-sm font-semibold text-white">Preview · {record.status} · not indexed</p>
      <BlogPageView post={record.content} />
    </div>
  );
}
