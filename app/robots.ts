import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://cosmoxs.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/admin",
          "/admin/",
          "/api",
          "/api/",
          "/auth/",
          "/checkout",
          "/checkout/",
          "/cart",
          "/my-account",
          "/wishlist",
          "/*?*orderId=",
          "/*?*awb=",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/"],
        disallow: [
          "/admin",
          "/admin/",
          "/api",
          "/api/",
          "/auth/",
          "/checkout",
          "/my-account",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
