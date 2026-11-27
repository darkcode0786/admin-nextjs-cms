"use client";

import { useState } from "react";
import LocationsHero from "@/components/sections/location/LocationsHero";
import LocationsRegistration from "@/components/sections/location/LocationsRegistration";
import LocationsCityCards from "@/components/sections/location/LocationsCityCards";
import LocationsDirectory from "@/components/sections/location/LocationsDirectory";

export type ManagedLocation = {
  slug: string;
  title: string;
  city: string;
  region: string;
  areaGroup: string;
  href: string;
};

export default function LocationsShell({
  publishedSlugs,
  extraLocations = [],
}: {
  publishedSlugs?: string[] | null;
  extraLocations?: ManagedLocation[];
}) {
  const [query, setQuery] = useState("");

  return (
    <>
      <LocationsHero query={query} onQueryChange={setQuery} />
      <LocationsRegistration />
      <LocationsCityCards />
      <LocationsDirectory
        query={query}
        publishedSlugs={publishedSlugs}
        extraLocations={extraLocations}
      />
    </>
  );
}
