import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The analysis flow now lives inside the dashboard.
      { source: "/sports-analysis", destination: "/dashboard/new", permanent: false },
      { source: "/analyze", destination: "/dashboard/new", permanent: false },
      { source: "/library", destination: "/dashboard/matches", permanent: false },
      { source: "/library/:id", destination: "/dashboard/matches/:id", permanent: false },
    ];
  },
};

export default nextConfig;
