"use client";

import styled from "@emotion/styled";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopNav() {
  const pathname = usePathname();

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
      </Nav>

      <LoginButton>로그인</LoginButton>
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
