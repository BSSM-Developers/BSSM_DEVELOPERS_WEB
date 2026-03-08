"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import styled from "@emotion/styled";
import { BsdevLoader } from "@/components/common/BsdevLoader";
import { ROUTE_TRANSITION_START_EVENT } from "@/components/common/routeTransitionSignal";

export function RouteTransitionLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = useMemo(() => `${pathname}?${searchParams.toString()}`, [pathname, searchParams]);
  const [visible, setVisible] = useState(false);
  const routeKeyAtStartRef = useRef(routeKey);

  useEffect(() => {
    const handleStart = () => {
      routeKeyAtStartRef.current = routeKey;
      setVisible(true);
    };

    window.addEventListener(ROUTE_TRANSITION_START_EVENT, handleStart);
    return () => {
      window.removeEventListener(ROUTE_TRANSITION_START_EVENT, handleStart);
    };
  }, [routeKey]);

  useEffect(() => {
    if (!visible) return;
    if (routeKey !== routeKeyAtStartRef.current) {
      setVisible(false);
    }
  }, [routeKey, visible]);

  useEffect(() => {
    if (!visible) return;
    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, 10000);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Overlay>
      <BsdevLoader label="페이지 이동 중..." size={88} />
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(236, 238, 242, 0.58);
  backdrop-filter: blur(2px);
`;

