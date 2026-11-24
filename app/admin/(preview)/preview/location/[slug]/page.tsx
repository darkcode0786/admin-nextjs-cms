import { notFound, redirect } from "next/navigation";
import LocationPageView from "@/components/sections/location-detail/LocationPageView";
import { getPreviewLocation } from "@/lib/cms/public";
import { isAdmin } from "@/lib/auth";

export const instant = false;

export default async function PreviewLocationPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { slug } = await params;
  const record = await getPreviewLocation(slug);
  if (!record) notFound();
  return (
    <div>
      <p className="bg-navy px-4 py-2 text-center text-sm font-semibold text-white">Preview · {record.status} · not indexed</p>
      <LocationPageView page={record.content} />
    </div>
  );
}
