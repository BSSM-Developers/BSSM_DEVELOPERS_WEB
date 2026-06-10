import { createMABCronRoute } from "@mab-kit/posthog";

/**
 * MAB(Multi-Armed Bandit) 비율 재계산 크론 라우트.
 *
 * Vercel Cron(또는 외부 크론)이 주기적으로 GET 호출하면, PostHog에서 변형별
 * 노출/전환을 집계해 Thompson Sampling으로 rollout 비율을 재계산하고
 * 멀티변량 플래그에 PATCH 한다.
 *
 * - host: 서버는 프록시(/ingest)가 아니라 PostHog API 호스트 직접 사용
 * - personalApiKey: phx_ (서버 전용 비밀, .env.local)
 * - cronSecret: Authorization: Bearer <CRON_SECRET> 검증
 */
export const GET = createMABCronRoute({
  host: process.env.POSTHOG_HOST!,
  projectId: process.env.POSTHOG_PROJECT_ID!,
  personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY!,
  cronSecret: process.env.CRON_SECRET,
  experiments: [
    {
      flagKey: "github-connect-cta",
      conversionEvent: "github_connect_clicked",
    },
  ],
});

export const dynamic = "force-dynamic";
