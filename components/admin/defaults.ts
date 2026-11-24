import type { BlogPostData } from "@/data/blogTypes";
import type { LocationPageData } from "@/data/locations";
import { emptySeo } from "@/lib/cms/types";

export const BLOG_CONSULTATION_TITLE = "Book a Consultation with Dr. Mona Dahiya";

export const DEFAULT_NEXT_STEP = {
  sectionId: "book-consultation",
  eyebrow: "Next step",
  title: "Book an In-Clinic or Online Consultation",
  subtitle:
    "Consult Dr. Mona Dahiya in person at our Delhi, Noida or Ghaziabad clinics, or book an online video consultation.",
  consultationDuration: "30 minutes",
  defaultClinic: "Noida",
};

export const BLOG_REVIEW_LINK = {
  label: "Read Dr. Mona's Google reviews →",
  href: "/best-ivf-patient-reviews",
};

export function blankBlog(): BlogPostData {
  return {
    slug: "",
    metadata: { title: "", description: "" },
    hero: {
      breadcrumbParent: { label: "Blog", href: "/blog" },
      breadcrumbLabel: "",
      eyebrow: "Fertility guide",
      title: "",
      primaryCta: { label: "Book Consultation", href: "#book-consultation" },
      secondaryCta: { label: "Schedule Online Consultation", href: "/ivf-consultation-online" },
      reviewLink: { label: "Read Dr. Mona's Google reviews →", href: "/best-ivf-patient-reviews" },
    },
    registration: {
      title: "Medical Registration",
      subtitle: "Dr. Mona Dahiya is registered with the following medical councils.",
    },
    meta: { date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), tags: ["Fertility"] },
    sections: [
      {
        heading: ["Overview"],
        blocks: [{ type: "paragraph", content: ["Write the article here."] }],
      },
    ],
    consultation: { ...DEFAULT_NEXT_STEP, title: BLOG_CONSULTATION_TITLE },
  };
}

export function blankLocation(): LocationPageData {
  return {
    slug: "",
    metadata: { title: "", description: "" },
    hero: {
      breadcrumbParent: { label: "Locations", href: "/location" },
      breadcrumbLabel: "",
      eyebrow: "",
      title: "",
      descriptionPrefix: "",
      highlightLocation: "",
      descriptionSuffix: "",
      image: "/pageBanner/M0500491.jpg",
      imageAlt: "Dr. Mona Dahiya",
      primaryCta: { label: "Book In-Clinic Consultation", href: "#book-consultation" },
      secondaryCta: { label: "Schedule Online Consultation", href: "/ivf-consultation-online" },
      pills: [],
    },
    registration: {
      title: "",
      subtitle: "",
    },
    indications: { eyebrow: "", title: "", items: [{ number: 1, title: "", description: "" }] },
    checklist: { eyebrow: "", title: "", subtitle: "", items: [{ title: "", description: "" }] },
    protocol: { eyebrow: "", title: "", items: [{ step: 1, title: "", description: "" }] },
    whyConsult: { eyebrow: "", title: "", items: [{ title: "", description: "" }] },
    scenario: { eyebrow: "", title: "", text: "", disclaimer: "" },
    howToReach: { eyebrow: "", title: "", subtitle: "", originLabel: "", clinics: [{ number: 1, tag: "", title: "", distance: "", duration: "", routeBadge: "", byRoad: "", byMetro: "", linkLabel: "", linkHref: "" }] },
    nearbyAreas: { eyebrow: "", title: "", items: [{ title: "", subtitle: "", href: "" }] },
    costFactors: { eyebrow: "", title: "", subtitle: "", items: [{ icon: "check", title: "", description: "" }] },
    faq: { eyebrow: "", title: "", subtitle: "", items: [{ question: "", answer: "" }] },
    consultation: { ...DEFAULT_NEXT_STEP },
  };
}

export function withBlankRows(page: LocationPageData): LocationPageData {
  const blank = blankLocation();
  return {
    ...page,
    indications: { ...page.indications, items: page.indications.items.length ? page.indications.items : blank.indications.items },
    checklist: { ...page.checklist, items: page.checklist.items.length ? page.checklist.items : blank.checklist.items },
    protocol: { ...page.protocol, items: page.protocol.items.length ? page.protocol.items : blank.protocol.items },
    whyConsult: { ...page.whyConsult, items: page.whyConsult.items.length ? page.whyConsult.items : blank.whyConsult.items },
    howToReach: { ...page.howToReach, clinics: page.howToReach.clinics.length ? page.howToReach.clinics : blank.howToReach.clinics },
    nearbyAreas: { ...page.nearbyAreas, items: page.nearbyAreas.items.length ? page.nearbyAreas.items : blank.nearbyAreas.items },
    costFactors: { ...page.costFactors, items: page.costFactors.items.length ? page.costFactors.items : blank.costFactors.items },
    faq: { ...page.faq, items: page.faq.items.length ? page.faq.items : blank.faq.items },
  };
}

function hasText(values: Array<string | undefined>) {
  return values.some((value) => Boolean(value?.trim()));
}

export function withoutBlankRows(page: LocationPageData): LocationPageData {
  return {
    ...page,
    indications: { ...page.indications, items: page.indications.items.filter((item) => hasText([item.title, item.description])) },
    checklist: { ...page.checklist, items: page.checklist.items.filter((item) => hasText([item.title, item.description])) },
    protocol: { ...page.protocol, items: page.protocol.items.filter((item) => hasText([item.title, item.description])) },
    whyConsult: { ...page.whyConsult, items: page.whyConsult.items.filter((item) => hasText([item.title, item.description])) },
    howToReach: {
      ...page.howToReach,
      clinics: page.howToReach.clinics.filter((clinic) => hasText([clinic.tag, clinic.title, clinic.distance, clinic.duration, clinic.routeBadge, clinic.byRoad, clinic.byMetro, clinic.linkLabel, clinic.linkHref])),
    },
    nearbyAreas: { ...page.nearbyAreas, items: page.nearbyAreas.items.filter((item) => hasText([item.title, item.subtitle, item.href])) },
    costFactors: { ...page.costFactors, items: page.costFactors.items.filter((item) => hasText([item.title, item.description])) },
    faq: { ...page.faq, items: page.faq.items.filter((item) => hasText([item.question, item.answer])) },
  };
}

export { emptySeo };
