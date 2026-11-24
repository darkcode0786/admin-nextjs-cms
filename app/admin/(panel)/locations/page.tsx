"use client";

import ResourceTable from "@/components/admin/ResourceTable";

export default function AdminLocationsPage() {
  return (
    <ResourceTable
      kind="location"
      endpoint="/api/admin/locations"
      editBase="/admin/locations"
      publicBase="/location"
      createHref="/admin/locations/new"
      createLabel="Create new location"
    />
  );
}
