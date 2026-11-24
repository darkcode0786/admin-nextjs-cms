import { Schema, model, models } from "mongoose";
import { seoSchema } from "./seo";

const locationSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    city: { type: String, default: "" },
    region: { type: String, default: "" },
    content: { type: Schema.Types.Mixed, required: true },
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export const LocationModel =
  models.Location || model("Location", locationSchema);
