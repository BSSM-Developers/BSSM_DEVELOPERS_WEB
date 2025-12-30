"use client";

import styled from "@emotion/styled";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, tokenManager } from "@/lib/api";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = tokenManager.getAccessToken();
    setIsLoggedIn(!!token);
  }, [pathname]); // Re-check on path change

  const handleLogout = async () => {
    try {
      await api.auth.logout();
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

        <Link href="/apis" passHref legacyBehavior>
          <NavLink active={isActive("/apis")}>API 둘러보기</NavLink>
        </Link>
        <Link href="/static" passHref legacyBehavior>
          <NavLink active={isActive("/static")}>API 정적처리</NavLink>
        </Link>
        <Link href="/usage" passHref legacyBehavior>
          <NavLink active={isActive("/usage")}>API 사용하기</NavLink>
        </Link>
        <Link href="/guide" passHref legacyBehavior>
          <NavLink active={isActive("/guide")}>가이드</NavLink>
        </Link>
        <Link href="/docs/register" passHref legacyBehavior>
          <NavLink active={isActive("/docs/register")}>API 공유하기</NavLink>
        </Link>
      </Nav>

      {isLoggedIn ? (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {tokenManager.getUserRole() === 'ROLE_ADMIN' && (
            <Link href="/admin/sign-ups" passHref legacyBehavior>
              <NavLink active={isActive("/admin/sign-ups")} style={{ fontSize: '14px', color: '#ef4444' }}>Admin</NavLink>
            </Link>
          )}
          <Link href="/sign-up" passHref legacyBehavior>
            <NavLink active={isActive("/sign-up")} style={{ fontSize: '14px' }}>프로필</NavLink>
          </Link>
          <LoginButton onClick={handleLogout}>로그아웃</LoginButton>
        </div>
      ) : (
        <Link href="/login">
          <LoginButton>로그인</LoginButton>
        </Link>
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

const NavLink = styled.a<{ active?: boolean }>`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme, active }) => active ? theme.colors.text : theme.colors.grey[400]};
  text-decoration: none;
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
`;
