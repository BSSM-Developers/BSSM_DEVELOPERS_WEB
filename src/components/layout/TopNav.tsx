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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const { data: userData, isError, error } = useUserQuery(isClient);
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    setIsClient(true);
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
          setUserRole(null);
          return;
        }
      }

      setIsLoggedIn(true);
      setUserRole(tokenManager.getUserRole());
      if (userData?.name) {
        tokenManager.setUserName(userData.name);
      }
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
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
      setUserRole(null);
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

      {isClient && (
        isLoggedIn ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {userRole === 'ROLE_ADMIN' && (
              <StyledLink href="/admin/sign-ups">
                <NavLink active={isActive("/admin/sign-ups")} style={{ fontSize: '14px', color: '#ef4444' }}>Admin</NavLink>
              </StyledLink>
            )}
            <StyledLink href="/user/profile">
              <NavLink active={isActive("/user/profile")} style={{ fontSize: '14px' }}>프로필</NavLink>
            </StyledLink>
            <LoginButton onClick={handleLogout}>로그아웃</LoginButton>
          </div>
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
