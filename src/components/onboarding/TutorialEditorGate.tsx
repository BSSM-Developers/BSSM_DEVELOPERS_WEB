"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const TutorialEditor = dynamic(
  () => import("./TutorialEditor").then((m) => m.TutorialEditor),
  { ssr: false }
);

const isDev = process.env.NODE_ENV !== "production";

function GateInner() {
  const searchParams = useSearchParams();
  if (!isDev) return null;
  if (searchParams?.get("edit") !== "1") return null;
  return <TutorialEditor />;
}

/** dev && ?edit=1 일 때만 튜토리얼 편집기 마운트. 프로덕션 빌드에는 영향 없음. */
export function TutorialEditorGate() {
  if (!isDev) return null;
  return (
    <Suspense fallback={null}>
      <GateInner />
    </Suspense>
  );
}
