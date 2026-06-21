import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "coze-coding-project.tos.coze.site",
      },
    ],
  },
};

export default nextConfig;
