import type { Metadata } from "next";

import LocationsShell from "@/components/sections/location/LocationsShell";
import AboutParenthoodCta from "@/components/sections/about-mona-dahiya/AboutParenthoodCta";

import { SectionReveal } from "@/components/ui/Reveal";
import { getPublishedLocationSlugs } from "@/lib/cms/public";

export const metadata: Metadata = {
  title: "Locations & Contact | Dr. Mona Dahiya Fertility Clinics",
  description:
    "Find Dr. Mona Dahiya near you across Noida, Ghaziabad and Delhi. Search your area, view clinic addresses, and book a fertility consultation.",
};

export const instant = false;
export default async function LocationsPage() {
  const publishedSlugs = await getPublishedLocationSlugs();
  return (
    <main className="flex min-h-screen flex-col bg-pink">
      <LocationsShell publishedSlugs={publishedSlugs} />

      <SectionReveal delay={0.04}>
        <AboutParenthoodCta />
      </SectionReveal>
    </main>
  );
}
