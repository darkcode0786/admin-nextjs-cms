import { BLOG_POSTS } from "@/data/blogs";
import { BLOG_LISTING_ARTICLES } from "@/data/blogListing";
import { LOCATION_PAGES } from "@/data/locations";
import { connectDb } from "@/lib/db/mongoose";
import { BlogModel } from "@/lib/models/Blog";
import { LocationModel } from "@/lib/models/Location";
import { deriveLocationPlace, invalidateCmsCache } from "./public";
import { emptySeo } from "./types";

function blogContentFromRepo(content: (typeof BLOG_POSTS)[number]) {
  const listed = BLOG_LISTING_ARTICLES.find((article) => article.href === `/blog/${content.slug}`);
  if (!listed) return content;
  return {
    ...content,
    meta: {
      ...content.meta,
      date: listed.date,
    },
  };
}

export async function seedCmsFromStatic() {
  await connectDb();
  const blogOps = BLOG_POSTS.map((post) => {
    const content = blogContentFromRepo(post);
    return {
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
  };
  });
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

export async function replaceCmsFromStatic() {
  await connectDb();
  const blogSlugs = BLOG_POSTS.map((content) => content.slug);
  const locationSlugs = LOCATION_PAGES.map((content) => content.slug);
  const removedBlogs = await BlogModel.deleteMany({ slug: { $nin: blogSlugs } });
  const removedLocations = await LocationModel.deleteMany({ slug: { $nin: locationSlugs } });

  const blogOps = BLOG_POSTS.map((post) => {
    const content = blogContentFromRepo(post);
    return {
    updateOne: {
      filter: { slug: content.slug },
      update: {
        $set: {
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
  };
  });
  const locationOps = LOCATION_PAGES.map((content) => {
    const place = deriveLocationPlace(content);
    return {
      updateOne: {
        filter: { slug: content.slug },
        update: {
          $set: {
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

  if (blogOps.length) await BlogModel.bulkWrite(blogOps, { ordered: false });
  if (locationOps.length) await LocationModel.bulkWrite(locationOps, { ordered: false });
  invalidateCmsCache();
  return {
    removedBlogs: removedBlogs.deletedCount ?? 0,
    removedLocations: removedLocations.deletedCount ?? 0,
    blogTotal: await BlogModel.countDocuments(),
    locationTotal: await LocationModel.countDocuments(),
  };
}
