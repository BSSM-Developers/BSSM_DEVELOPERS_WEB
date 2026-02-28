"use client";

import styled from "@emotion/styled";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tokenManager } from "@/utils/fetcher";
import { useMyProfileQuery } from "@/app/sign-up/queries";
import { useLogoutMutation } from "@/app/login/queries";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Fetch user profile if token exists
  const { data: userData, isError } = useMyProfileQuery(!!tokenManager.getAccessToken());
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    const token = tokenManager.getAccessToken();
    if (token) {
      setIsLoggedIn(true);

      // Update cached username if data is fetched successfully
      if (userData?.name) {
        tokenManager.setUserName(userData.name);
      }

      // Optionally handle errors (e.g. 401) if needed, though useMyProfileQuery might handle it via global fetcher
    } else {
      setIsLoggedIn(false);
    }
  }, [pathname, userData]); // Re-run when path or user data changes


  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      tokenManager.clearTokens();
      setIsLoggedIn(false);
      router.push("/");
    }
  };

  const isActive = (path: string) => {
    if (path === "/apis" && pathname.startsWith("/apis")) return true;
    if (path === "/static" && pathname.startsWith("/static")) return true;
    if (path === "/usage" && pathname.startsWith("/usage")) return true;
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
        <StyledLink href="/static">
          <NavLink active={isActive("/static")}>API 정적처리</NavLink>
        </StyledLink>
        <StyledLink href="/usage">
          <NavLink active={isActive("/usage")}>API 사용하기</NavLink>
        </StyledLink>
        <StyledLink href="/guide">
          <NavLink active={isActive("/guide")}>가이드</NavLink>
        </StyledLink>
        <StyledLink href="/docs/register">
          <NavLink active={isActive("/docs/register")}>API 공유하기</NavLink>
        </StyledLink>
      </Nav>

      {isLoggedIn ? (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {tokenManager.getUserRole() === 'ROLE_ADMIN' && (
            <StyledLink href="/admin/sign-ups">
              <NavLink active={isActive("/admin/sign-ups")} style={{ fontSize: '14px', color: '#ef4444' }}>Admin</NavLink>
            </StyledLink>
          )}
          <StyledLink href="/sign-up">
            <NavLink active={isActive("/sign-up")} style={{ fontSize: '14px' }}>프로필</NavLink>
          </StyledLink>
          <LoginButton onClick={handleLogout}>로그아웃</LoginButton>
        </div>
      ) : (
        <StyledLink href="/login">
          <LoginButton as="span">로그인</LoginButton>
        </StyledLink>
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
  width: 1447px;
  gap: 69px;
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
