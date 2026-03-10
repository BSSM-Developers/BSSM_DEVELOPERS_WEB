"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/useConfirm";
import { tokenManager } from "@/utils/fetcher";

interface RequireLoginGateProps {
  children: ReactNode;
}

export function RequireLoginGate({ children }: RequireLoginGateProps) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [isAllowed, setIsAllowed] = useState(false);
  const hasPromptedRef = useRef(false);

  useEffect(() => {
    const token = tokenManager.getAccessToken();
    if (token) {
      setIsAllowed(true);
      return;
    }

    if (hasPromptedRef.current) {
      return;
    }
    hasPromptedRef.current = true;

    let isMounted = true;
    const moveToLogin = async () => {
      await confirm({
        title: "로그인이 필요합니다",
        message: "로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.",
        confirmText: "확인",
        hideCancel: true,
      });
      if (!isMounted) {
        return;
      }
      router.replace("/login");
    };

    void moveToLogin();
    return () => {
      isMounted = false;
    };
  }, [confirm, router]);

  return (
    <>
      {ConfirmDialog}
      {isAllowed ? children : null}
    </>
  );
}
