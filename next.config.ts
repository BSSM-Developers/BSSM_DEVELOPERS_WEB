import type { NextConfig } from "next";

// PostHog 호스트 (US 클라우드 기본). EU 프로젝트면 eu 로 바꾸세요.
const POSTHOG_ASSET_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_ASSET_HOST || "https://us-assets.i.posthog.com";
const POSTHOG_API_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_API_HOST || "https://us.i.posthog.com";

const nextConfig: NextConfig = {
  // /ingest → PostHog 로 리버스 프록시 (클라이언트는 자기 도메인으로만 요청)
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${POSTHOG_ASSET_HOST}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${POSTHOG_API_HOST}/:path*`,
      },
    ];
  },
  // PostHog API 요청이 trailing slash 리다이렉트로 깨지지 않도록
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
