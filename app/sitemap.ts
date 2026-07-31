import { MetadataRoute } from "next";
import { connectDB } from "@/lib/databaseConnection";
import CategoryModel from "@/models/Category.model";
import ProductModel from "@/models/Product.model";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://cosmoxs.com";

const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" }> = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "about", priority: 0.6, changeFrequency: "monthly" },
  { path: "contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "faqs", priority: 0.5, changeFrequency: "monthly" },
  { path: "shipping", priority: 0.5, changeFrequency: "monthly" },
  { path: "returns", priority: 0.5, changeFrequency: "monthly" },
  { path: "terms-and-conditions", priority: 0.3, changeFrequency: "yearly" },
  { path: "privacy-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "purchase-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "business-to-business", priority: 0.8, changeFrequency: "monthly" },
  { path: "blog", priority: 0.6, changeFrequency: "weekly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: r.path ? `${SITE_URL}/${r.path}` : `${SITE_URL}/`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  try {
    await connectDB();

    const [categories, products] = await Promise.all([
      CategoryModel.find({ isActive: true, isDeleted: { $ne: true } })
        .select("slug updatedAt parent")
        .lean(),
      ProductModel.find({ isActive: true, isDeleted: { $ne: true } })
        .select("slug updatedAt images")
        .lean(),
    ]);

    const categoryEntries: MetadataRoute.Sitemap = categories.map((c: any) => ({
      url: `${SITE_URL}/category/${c.slug}`,
      lastModified: c.updatedAt || now,
      changeFrequency: "weekly" as const,
      priority: c.parent ? 0.7 : 0.9,
    }));

    const productEntries: MetadataRoute.Sitemap = products.map((p: any) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: p.updatedAt || now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: p.images?.[0]?.url ? [p.images[0].url] : undefined,
    }));

    return [...staticEntries, ...categoryEntries, ...productEntries];
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return staticEntries;
  }
}
