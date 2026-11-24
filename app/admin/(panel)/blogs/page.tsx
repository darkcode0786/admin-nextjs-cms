"use client";

import ResourceTable from "@/components/admin/ResourceTable";

export default function AdminBlogsPage() {
  return (
    <ResourceTable
      kind="blog"
      endpoint="/api/admin/blogs"
      editBase="/admin/blogs"
      publicBase="/blog"
      createHref="/admin/blogs/new"
      createLabel="Create new blog"
    />
  );
}
