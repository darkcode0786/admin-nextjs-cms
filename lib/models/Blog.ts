import { Schema, model, models } from "mongoose";
import { seoSchema } from "./seo";

const blogSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    author: { type: String, default: "Dr. Mona Dahiya" },
    content: { type: Schema.Types.Mixed, required: true },
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export const BlogModel = models.Blog || model("Blog", blogSchema);
