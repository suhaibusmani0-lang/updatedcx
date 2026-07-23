import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.preview.emergentagent.com",
    "*.cluster-12.preview.emergentcf.cloud",
    "e083d001-b56e-4d8b-a8c1-b7760c4dc9e0.preview.emergentagent.com",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

// Only initialize Cloudflare dev context in development mode
if (process.env.NODE_ENV !== "production") {
  import("@opennextjs/cloudflare")
    .then((m) => m.initOpenNextCloudflareForDev())
    .catch(() => {});
}
