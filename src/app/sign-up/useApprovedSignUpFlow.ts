import { useEffect } from "react";
import { authApi } from "@/app/login/api";
import { tokenManager } from "@/utils/fetcher";
import { createApprovedViewedKey, type SignUpProfileSnapshot } from "./model";

type RouterLike = {
  replace: (href: string) => void;
};

interface UseApprovedSignUpFlowOptions {
  profileData?: SignUpProfileSnapshot;
  router: RouterLike;
  setPurpose: (purpose: string) => void;
  setShowApprovedCelebration: (show: boolean) => void;
}

const ensureAccessTokenAndRedirect = async (
  router: RouterLike,
  isCancelled: () => boolean
): Promise<void> => {
  const currentAccessToken = tokenManager.getAccessToken();
  if (currentAccessToken) {
    router.replace("/");
    return;
  }

  try {
    const refreshed = await authApi.refreshAccessToken();
    if (isCancelled()) {
      return;
    }

    if (refreshed.accessToken) {
      tokenManager.setTokens(refreshed.accessToken, refreshed.refreshToken);
      router.replace("/");
      return;
    }
  } catch {
  }

  if (!isCancelled()) {
    router.replace("/login");
  }
};

export const useApprovedSignUpFlow = ({
  profileData,
  router,
  setPurpose,
  setShowApprovedCelebration,
}: UseApprovedSignUpFlowOptions): void => {
  useEffect(() => {
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;
    let isCancelled = false;

    if (profileData?.purpose) {
      setPurpose(profileData.purpose);
    }

    if (profileData?.state === "APPROVED") {
      const viewedKey = createApprovedViewedKey(profileData);
      const alreadyViewed = typeof window !== "undefined" ? sessionStorage.getItem(viewedKey) === "1" : false;

      if (alreadyViewed) {
        void ensureAccessTokenAndRedirect(router, () => isCancelled);
        return () => {
        };
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem(viewedKey, "1");
      }
      setShowApprovedCelebration(true);
      redirectTimer = setTimeout(() => {
        void ensureAccessTokenAndRedirect(router, () => isCancelled);
      }, 2200);
    } else {
      setShowApprovedCelebration(false);
    }

    return () => {
      isCancelled = true;
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [profileData, router, setPurpose, setShowApprovedCelebration]);
};
