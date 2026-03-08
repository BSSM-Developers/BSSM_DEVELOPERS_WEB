"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { usePathname, useSearchParams } from "next/navigation";
import { BsdevLoader } from "@/components/common/BsdevLoader";
import { ROUTE_TRANSITION_START_EVENT } from "@/components/common/routeTransitionSignal";

const MIN_VISIBLE_MS = 320;
const FAILSAFE_HIDE_MS = 45000;

function isNavigableAnchor(anchor: HTMLAnchorElement): boolean {
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const href = anchor.getAttribute("href");
  if (!href) return false;
  if (href.startsWith("#")) return false;
  if (href.startsWith("mailto:")) return false;
  if (href.startsWith("tel:")) return false;
  if (href.startsWith("javascript:")) return false;

  const currentUrl = new URL(window.location.href);
  const nextUrl = new URL(anchor.href, window.location.href);

  if (nextUrl.origin !== currentUrl.origin) return false;
  if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) return false;

  return true;
}

export function RouteTransitionLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef(false);
  const startedAtRef = useRef(0);
  const fromLocationKeyRef = useRef<string | null>(null);
  const failsafeTimerRef = useRef<number | null>(null);
  const locationKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  const clearFailsafe = useCallback(() => {
    if (failsafeTimerRef.current !== null) {
      window.clearTimeout(failsafeTimerRef.current);
      failsafeTimerRef.current = null;
    }
  }, []);

  const startLoading = useCallback(() => {
    if (!isVisibleRef.current) {
      startedAtRef.current = Date.now();
      fromLocationKeyRef.current = locationKey;
      setIsVisible(true);
      isVisibleRef.current = true;
    }

    clearFailsafe();
    failsafeTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      isVisibleRef.current = false;
      fromLocationKeyRef.current = null;
      failsafeTimerRef.current = null;
    }, FAILSAFE_HIDE_MS);
  }, [clearFailsafe, locationKey]);

  useEffect(() => {
    const handleClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isNavigableAnchor(anchor)) return;

      window.setTimeout(() => {
        startLoading();
      }, 0);
    };

    const handlePopState = () => {
      startLoading();
    };

    const handleCustomStart = () => {
      startLoading();
    };

    window.addEventListener("click", handleClickCapture, true);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener(ROUTE_TRANSITION_START_EVENT, handleCustomStart);

    return () => {
      clearFailsafe();
      window.removeEventListener("click", handleClickCapture, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener(ROUTE_TRANSITION_START_EVENT, handleCustomStart);
    };
  }, [clearFailsafe, startLoading]);

  useEffect(() => {
    if (!isVisible) return;
    if (!fromLocationKeyRef.current) return;
    if (locationKey === fromLocationKeyRef.current) return;

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const timer = window.setTimeout(() => {
      setIsVisible(false);
      isVisibleRef.current = false;
      fromLocationKeyRef.current = null;
      clearFailsafe();
    }, remaining);

    return () => {
      window.clearTimeout(timer);
    };
  }, [clearFailsafe, isVisible, locationKey]);

  if (!isVisible) return null;

  return (
    <Overlay aria-hidden>
      <BsdevLoader size={88} label="페이지 이동 중입니다..." minHeight="100dvh" />
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(245, 247, 251, 0.78);
  backdrop-filter: blur(1.5px);
`;
