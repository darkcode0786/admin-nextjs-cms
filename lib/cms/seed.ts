import { BLOG_POSTS } from "@/data/blogs";
import { LOCATION_PAGES } from "@/data/locations";
import { connectDb } from "@/lib/db/mongoose";
import { BlogModel } from "@/lib/models/Blog";
import { LocationModel } from "@/lib/models/Location";
import { deriveLocationPlace, invalidateCmsCache } from "./public";
import { emptySeo } from "./types";

export async function seedCmsFromStatic() {
  await connectDb();
  const blogOps = BLOG_POSTS.map((content) => ({
    updateOne: {
      filter: { slug: content.slug },
      update: {
        $setOnInsert: {
          slug: content.slug,
          status: "published",
          author: "Dr. Mona Dahiya",
          content,
          seo: {
            ...emptySeo(),
            metaTitle: content.metadata?.title || content.hero?.title || "",
            metaDescription: content.metadata?.description || "",
          },
        },
      },
      upsert: true,
    },
  }));
  const locationOps = LOCATION_PAGES.map((content) => {
    const place = deriveLocationPlace(content);
    return {
      updateOne: {
        filter: { slug: content.slug },
        update: {
          $setOnInsert: {
            slug: content.slug,
            status: "published",
            city: place.city,
            region: place.region,
            content,
            seo: {
              ...emptySeo(),
              metaTitle: content.metadata?.title || content.hero?.title || "",
              metaDescription: content.metadata?.description || "",
            },
          },
        },
        upsert: true,
      },
    };
  });

  const blogs = blogOps.length
    ? await BlogModel.bulkWrite(blogOps, { ordered: false })
    : null;
  const locations = locationOps.length
    ? await LocationModel.bulkWrite(locationOps, { ordered: false })
    : null;
  invalidateCmsCache();
  return {
    blogsInserted: blogs?.upsertedCount ?? 0,
    locationsInserted: locations?.upsertedCount ?? 0,
    blogTotal: await BlogModel.countDocuments(),
    locationTotal: await LocationModel.countDocuments(),
  };
}
