import type { NextConfig } from "next";

const remotePatterns = [
  process.env.NEXT_PUBLIC_AWS_STORAGE
    ? {
        protocol: "https" as const,
        hostname: process.env.NEXT_PUBLIC_AWS_STORAGE.split("https://")[1],
      }
    : null,
  {
    protocol: "https" as const,
    hostname: "gainforest-transparency-dashboard.s3.us-east-1.amazonaws.com",
  },
  {
    protocol: "https" as const,
    hostname: "*",
  },
].filter((pattern) => pattern !== null);

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      ...remotePatterns,
      {
        protocol: "https",
        hostname:
          "gainforest-transparency-dashboard.s3.us-east-1.amazonaws.com",
      },
    ],
  },
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Add proper API route configuration
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
