"use client";

import styled from "@emotion/styled";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tokenManager } from "@/utils/fetcher";
import { useUserQuery } from "@/app/user/queries";
import { useLogoutMutation } from "@/app/login/queries";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const { data: userData, isError, error } = useUserQuery(isClient);
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    setIsClient(true);
    tokenManager.initializeRefreshCycle();
  }, []);

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

  const handleLogout = async () => {
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

  const isActive = (path: string) => {
    if (path === "/apis" && pathname.startsWith("/apis")) return true;
    if (path === "/announcements" && pathname.startsWith("/announcements")) return true;
    if (path === "/guide" && pathname.startsWith("/guide")) return true;
    return false;
  };

  return (
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

        <StyledLink href="/apis">
          <NavLink active={isActive("/apis")}>API 둘러보기</NavLink>
        </StyledLink>
        <StyledLink href="/announcements">
          <NavLink active={isActive("/announcements")}>공지사항</NavLink>
        </StyledLink>
        <StyledLink href="/docs/register">
          <NavLink active={isActive("/docs/register")}>API 공유하기</NavLink>
        </StyledLink>
        <StyledLink href="/guide">
          <NavLink active={isActive("/guide")}>가이드</NavLink>
        </StyledLink>
      </Nav>

      {isClient && (
        isLoggedIn ? (
          <AccountActions>
            <StyledLink href="/user/profile">
              <ActionButton as="span" active={pathname?.startsWith("/user")}>
                프로필
              </ActionButton>
            </StyledLink>
            <ActionButton as="span" variant="ghost" onClick={handleLogout}>로그아웃</ActionButton>
          </AccountActions>
        ) : (
          <StyledLink href="/login">
            <LoginButton as="span">로그인</LoginButton>
          </StyledLink>
        )
      )}
    </Header>
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
`;

const LogoWrapper = styled(Link)`
  display: flex;
  align-items: center;
  cursor: pointer;
  text-decoration: none;

  img {
    object-fit: contain;
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  flex: 1;
  gap: 60px;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
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
    background: ${({ theme, variant }) => variant === "ghost" ? theme.colors.grey[50] : theme.colors.bssmDarkBlue};
  }
`;
