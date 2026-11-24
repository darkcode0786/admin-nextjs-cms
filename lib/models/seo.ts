import { Schema } from "mongoose";

export const seoSchema = new Schema(
  {
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    metaKeywords: { type: String, default: "" },
    canonicalUrl: { type: String, default: "" },
    ogTitle: { type: String, default: "" },
    ogDescription: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    twitterTitle: { type: String, default: "" },
    twitterDescription: { type: String, default: "" },
    twitterImage: { type: String, default: "" },
    noIndex: { type: Boolean, default: false },
    noFollow: { type: Boolean, default: false },
    schemaMarkup: { type: String, default: "" },
  },
  { _id: false },
);
