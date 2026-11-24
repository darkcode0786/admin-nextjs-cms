export type PublishStatus = "draft" | "published";

export type SeoFields = {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  noIndex: boolean;
  noFollow: boolean;
  schemaMarkup: string;
};

export const emptySeo = (): SeoFields => ({
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  twitterTitle: "",
  twitterDescription: "",
  twitterImage: "",
  noIndex: false,
  noFollow: false,
  schemaMarkup: "",
});

export function seoIsComplete(seo?: Partial<SeoFields> | null) {
  return Boolean(seo?.metaTitle?.trim() && seo?.metaDescription?.trim());
}
