import type { NextConfig } from "next";
import path from "path";

const API_PROXY_TARGET = "https://music.mariolopez.org";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  /**
   * Static export for production builds.
   * IMPORTANT: Next.js does not allow rewrites/redirects/headers with output: "export".
   */
  output: isProd ? "export" : "standalone",

  /**
   * Deploy under a sub-path in production.
   */
  basePath: isProd ? "/next" : "",

  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? "/next" : "",
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

// Only enable dev-time proxying. Static export builds must not define rewrites at all.
if (!isProd) {
  nextConfig.rewrites = async () => {
    return [
      {
        basePath: false,
        source: "/api/:path*",
        destination: `${API_PROXY_TARGET}/api/:path*`,
      },
    ];
  };
}

export default nextConfig;
