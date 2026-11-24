"use client";

import { use } from "react";
import LocationForm from "@/components/admin/LocationForm";

export default function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <LocationForm id={id} />;
}
