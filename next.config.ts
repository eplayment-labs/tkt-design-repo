import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets phones on the home network load the dev server (hot reload, assets).
  allowedDevOrigins: ["192.168.1.30", "*.local"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
