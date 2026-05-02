import type { NextConfig } from "next";

/**
 * 同源部署：Next 通过 rewrites 把 /api/* 反代到后端容器，
 * 这样浏览器看到的是相对路径 /api/v1，避免把宿主机 localhost 编进 bundle。
 *
 * 本地开发（非 Docker）可通过 .env.local 设置 BACKEND_URL=http://localhost:8080。
 */
const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
