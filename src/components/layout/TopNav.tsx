"use client";

import styled from "@emotion/styled";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import { tokenManager } from "@/utils/fetcher";
import { useUserQuery } from "@/app/user/queries";
import { useLogoutMutation } from "@/app/login/queries";
import { useConfirm } from "@/hooks/useConfirm";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { confirm, ConfirmDialog } = useConfirm();

  const { data: userData, isError, error } = useUserQuery(isClient);
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    setIsClient(true);
    void tokenManager.initializeRefreshCycle();
  }, []);

  useEffect(() => {
    if (!isClient) {
      return;
    }

    const handleTokenChanged = () => {
      setIsLoggedIn(!!tokenManager.getAccessToken());
    };

    handleTokenChanged();
    window.addEventListener("auth-token-changed", handleTokenChanged);
    return () => {
      window.removeEventListener("auth-token-changed", handleTokenChanged);
    };
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;

    const token = tokenManager.getAccessToken();

    if (token) {
      if (isError) {
        const errorData = error as { status?: number; message?: string };
        const status = errorData?.status || errorData?.message;
        if (status === "Unauthorized" || String(status).includes("401")) {
          setIsLoggedIn(false);
          return;
        }
      }

      setIsLoggedIn(true);
      if (userData?.name) {
        tokenManager.setUserName(userData.name);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, [isClient, pathname, userData, isError, error]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    const shouldLogout = await confirm({
      title: "로그아웃",
      message: "로그아웃 하시겠습니까?",
      confirmText: "로그아웃",
      cancelText: "취소",
    });

    if (!shouldLogout) {
      return;
    }

    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      console.error(e);
    } finally {
      tokenManager.clearTokens();
      setIsLoggedIn(false);
      router.push("/");
    }
  };

  const handleProtectedMenuClick = async (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (tokenManager.getAccessToken()) {
      return;
    }

    event.preventDefault();
    await confirm({
      title: "로그인이 필요합니다",
      message: "로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.",
      confirmText: "확인",
      hideCancel: true,
    });
    router.push("/login");
  };

  const handleMobileProtectedMenuClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    setIsMobileMenuOpen(false);
    void handleProtectedMenuClick(event);
  };

  const isActive = (path: string) => {
    if (path === "/apis" && pathname.startsWith("/apis")) return true;
    if (path === "/announcements" && pathname.startsWith("/announcements")) return true;
    if (path === "/guide" && pathname.startsWith("/guide")) return true;
    if (path === "/docs/register" && pathname.startsWith("/docs")) return true;
    return false;
  };

  return (
    <>
      <Header>
        <Nav>
          <LogoWrapper href="/">
            <Image
              src="/BSM_DEV_LOGO.svg"
              alt="BSSM Developers"
              width={394}
              height={79}
              priority
            />
          </LogoWrapper>

          <DesktopLinks>
            <StyledLink href="/apis" onClick={handleProtectedMenuClick}>
              <NavLink active={isActive("/apis")}>API 둘러보기</NavLink>
            </StyledLink>
            <StyledLink href="/docs/register" onClick={handleProtectedMenuClick}>
              <NavLink active={isActive("/docs/register")}>API 공유하기</NavLink>
            </StyledLink>
            <StyledLink href="/guide">
              <NavLink active={isActive("/guide")}>가이드</NavLink>
            </StyledLink>
            <StyledLink href="/announcements">
              <NavLink active={isActive("/announcements")}>공지사항</NavLink>
            </StyledLink>
          </DesktopLinks>
        </Nav>

        {isClient && (
          <DesktopAccountArea>
            {isLoggedIn ? (
              <AccountActions>
                <StyledLink href="/user">
                  <ActionButton as="span" active={pathname?.startsWith("/user")}>
                    마이페이지
                  </ActionButton>
                </StyledLink>
                <ActionButton as="span" variant="ghost" onClick={handleLogout}>로그아웃</ActionButton>
              </AccountActions>
            ) : (
              <StyledLink href="/login">
                <LoginButton as="span">로그인</LoginButton>
              </StyledLink>
            )}
          </DesktopAccountArea>
        )}

        <HamburgerButton
          onClick={() => setIsMobileMenuOpen(prev => !prev)}
          aria-label="메뉴"
          isOpen={isMobileMenuOpen}
        >
          <span />
          <span />
          <span />
        </HamburgerButton>
      </Header>

      <MobileMenu isOpen={isMobileMenuOpen}>
        <MobileNavLinks>
          <MobileStyledLink href="/apis" onClick={handleMobileProtectedMenuClick}>
            <MobileNavItem active={isActive("/apis")}>API 둘러보기</MobileNavItem>
          </MobileStyledLink>
          <MobileStyledLink href="/docs/register" onClick={handleMobileProtectedMenuClick}>
            <MobileNavItem active={isActive("/docs/register")}>API 공유하기</MobileNavItem>
          </MobileStyledLink>
          <MobileStyledLink href="/guide" onClick={() => setIsMobileMenuOpen(false)}>
            <MobileNavItem active={isActive("/guide")}>가이드</MobileNavItem>
          </MobileStyledLink>
          <MobileStyledLink href="/announcements" onClick={() => setIsMobileMenuOpen(false)}>
            <MobileNavItem active={isActive("/announcements")}>공지사항</MobileNavItem>
          </MobileStyledLink>
        </MobileNavLinks>

        {isClient && (
          <MobileAccountArea>
            {isLoggedIn ? (
              <>
                <MobileStyledLink href="/user" onClick={() => setIsMobileMenuOpen(false)}>
                  <MobileNavItem active={pathname?.startsWith("/user")}>마이페이지</MobileNavItem>
                </MobileStyledLink>
                <MobileNavButton onClick={() => { setIsMobileMenuOpen(false); void handleLogout(); }}>
                  로그아웃
                </MobileNavButton>
              </>
            ) : (
              <MobileStyledLink href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <MobileNavItem>로그인</MobileNavItem>
              </MobileStyledLink>
            )}
          </MobileAccountArea>
        )}
      </MobileMenu>

      <MobileBackdrop isVisible={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(false)} />

      {ConfirmDialog}
    </>
  );
}

const Header = styled.header`
  display: flex;
  align-items: center;
  width: 100%;
  height: 69px;
  padding: 0 2rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey[200]};
  background: ${({ theme }) => theme.colors.background};
  position: relative;
  z-index: 201;

  @media (max-width: 767px) {
    padding: 0 1rem;
  }
`;

const LogoWrapper = styled(Link)`
  display: flex;
  align-items: center;
  cursor: pointer;
  text-decoration: none;
  flex-shrink: 0;

  img {
    object-fit: contain;

    @media (max-width: 767px) {
      width: 160px !important;
      height: 32px !important;
    }
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  flex: 1;
`;

const DesktopLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 60px;
  margin-left: 60px;

  @media (max-width: 767px) {
    display: none;
  }
`;

const DesktopAccountArea = styled.div`
  @media (max-width: 767px) {
    display: none;
  }
`;

const HamburgerButton = styled.button<{ isOpen: boolean }>`
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  flex-shrink: 0;

  span {
    display: block;
    width: 20px;
    height: 2px;
    background: ${({ theme }) => theme.colors.text};
    border-radius: 2px;
    transition: transform 0.2s ease, opacity 0.2s ease;

    &:nth-of-type(1) {
      transform: ${({ isOpen }) => isOpen ? "rotate(45deg) translate(5px, 5px)" : "none"};
    }
    &:nth-of-type(2) {
      opacity: ${({ isOpen }) => isOpen ? 0 : 1};
    }
    &:nth-of-type(3) {
      transform: ${({ isOpen }) => isOpen ? "rotate(-45deg) translate(5px, -5px)" : "none"};
    }
  }

  @media (max-width: 767px) {
    display: flex;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.grey[100]};
  }
`;

const StyledLink = styled(Link)`
  text-decoration: none;
`;

const MobileStyledLink = styled(Link)`
  text-decoration: none;
  display: block;
`;

const NavLink = styled.span<{ active?: boolean }>`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme, active }) => active ? theme.colors.text : theme.colors.grey[400]};
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const AccountActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 20px;
`;

const LoginButton = styled.button`
  border: none;
  background: none;
  width: 65px;
  height: 35px;
  color: ${({ theme }) => theme.colors.bssmGrey};
  font-weight: 500;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ActionButton = styled(LoginButton)<{ active?: boolean; variant?: "solid" | "ghost" }>`
  width: auto;
  min-width: 65px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme, variant }) => variant === "ghost" ? theme.colors.bssmDarkBlue : theme.colors.bssmDarkBlue};
  color: ${({ theme, variant }) => variant === "ghost" ? theme.colors.bssmDarkBlue : "white"};
  background: ${({ theme, active, variant }) => {
    if (variant === "ghost") {
      return active ? theme.colors.grey[50] : "white";
    }
    return theme.colors.bssmDarkBlue;
  }};
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    color: ${({ theme, variant }) => variant === "ghost" ? theme.colors.bssmDarkBlue : "white"};
    filter: ${({ variant }) => variant === "ghost" ? "none" : "brightness(1.08)"};
    background: ${({ theme, active, variant }) => variant === "ghost" ? theme.colors.grey[50] : theme.colors.bssmDarkBlue};
  }
`;

const MobileMenu = styled.div<{ isOpen: boolean }>`
  display: none;

  @media (max-width: 767px) {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 69px;
    left: 0;
    right: 0;
    background: ${({ theme }) => theme.colors.background};
    border-bottom: 1px solid ${({ theme }) => theme.colors.grey[200]};
    padding: 8px 16px 16px;
    z-index: 200;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transform: ${({ isOpen }) => isOpen ? "translateY(0)" : "translateY(-8px)"};
    opacity: ${({ isOpen }) => isOpen ? 1 : 0};
    pointer-events: ${({ isOpen }) => isOpen ? "auto" : "none"};
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
`;

const MobileBackdrop = styled.div<{ isVisible: boolean }>`
  display: none;

  @media (max-width: 767px) {
    display: block;
    position: fixed;
    top: 69px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 198;
    opacity: ${({ isVisible }) => isVisible ? 1 : 0};
    pointer-events: ${({ isVisible }) => isVisible ? "auto" : "none"};
    transition: opacity 0.2s ease;
  }
`;

const MobileNavLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MobileNavItem = styled.span<{ active?: boolean }>`
  display: block;
  padding: 10px 12px;
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme, active }) => active ? theme.colors.text : theme.colors.grey[500]};
  border-radius: 8px;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.grey[50]};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const MobileAccountArea = styled.div`
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.grey[200]};
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MobileNavButton = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  font-size: 15px;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.grey[500]};
  border-radius: 8px;

  &:hover {
    background: ${({ theme }) => theme.colors.grey[50]};
    color: ${({ theme }) => theme.colors.text};
  }
`;
