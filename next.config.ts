import type { NextConfig } from "next";

// Safely extract hostname from NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHostname: string | undefined;
if (supabaseUrl) {
  try {
    supabaseHostname = new URL(supabaseUrl).hostname;
  } catch {
    // fallback if URL parsing fails
  }
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    // Allows loading images when DNS resolves via NAT64 or local/internal IPs
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      // Generic wildcard pattern for Supabase Storage domains
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
      // Explicit pattern for current Supabase project URL
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
